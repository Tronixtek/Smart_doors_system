import { Router } from 'express';
import { Lock } from '../models/Lock';
import { AccessPoint } from '../models/AccessPoint';
import { LockKey } from '../models/LockKey';
import { AccessLog, AccessMethod, AccessOutcome } from '../models/AccessLog';
import { lookupLogOperate } from '../utils/ttlockLogTypes';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserOrganizationIds, syncUserOrganizations } from '../utils/organizations';

const router = Router();
router.use(authenticate);

// TTLock records the *number* of the credential that was used, never a name.
// `password` is the generic field the firmware uses for passcodes, card
// numbers and fingerprint numbers alike; the rest are other SDK spellings.
const CREDENTIAL_ID_FIELDS = [
  'password',
  'keyboardPwd',
  'keyboardPassword',
  'cardNum',
  'cardNumber',
  'fingerprintNum',
  'fingerprintNumber',
  'credentialNumber',
];

/**
 * A record with no credential (an app/Bluetooth unlock) still carries
 * keyId: 0 and uid: 0, so zero has to be read as "absent" rather than as an
 * identifier - otherwise every app unlock resolves to a credential named "0".
 */
const extractCredentialIdentifier = (logData: any): string | undefined => {
  for (const field of CREDENTIAL_ID_FIELDS) {
    const value = logData?.[field];
    if (value === undefined || value === null) continue;

    const identifier = String(value).trim();
    if (identifier === '' || identifier === '0') continue;

    return identifier;
  }
  return undefined;
};

/**
 * Human-readable label for a credential we have no enrolled name for, so the
 * history shows *which* credential opened the door rather than "Unknown User".
 * Passcodes are masked - the raw PIN should not be readable from a log list.
 */
const describeCredential = (method: string, identifier?: string): string => {
  if (!identifier) {
    return method === 'APP' ? 'App unlock' : 'Unrecognised credential';
  }

  switch (method) {
    case 'PASSCODE':
      return `Unassigned PIN ••${identifier.slice(-2)}`;
    case 'CARD':
      return `Unassigned card ${identifier}`;
    case 'FINGERPRINT':
      return `Unassigned fingerprint ${identifier}`;
    default:
      return `Unassigned credential ${identifier}`;
  }
};

/** Maps LockKey.keyIdentifier -> the enrolled credential, for one lock. */
const buildCredentialMap = async (lockId: string) => {
  const keys = await LockKey.find({ lockId }).select('keyIdentifier name keyType');
  return new Map(keys.map((key) => [key.keyIdentifier, key]));
};

/**
 * LockKeyType and AccessMethod overlap but are not the same enum - EKEY has no
 * AccessMethod counterpart, and an eKey unlock is an app unlock in practice.
 */
const keyTypeToMethod = (keyType: string): string =>
  keyType === 'EKEY' ? AccessMethod.APP : keyType;

/**
 * Resolve one raw SDK record into a name, method and outcome.
 *
 * The record type is authoritative for *what happened* - the lock sends no
 * success flag, and a wrong PIN (type 7) looks identical to a valid one (type
 * 4) in every other field. A matched credential supplies the person's name,
 * and its type is only trusted for successful events: on a denied attempt the
 * number reported is precisely the one that did NOT open the door, so
 * relabelling it by the credential type would misreport the event.
 */
const resolveLogEntry = (logData: any, credentials: Map<string, any>) => {
  const operate = lookupLogOperate(logData?.recordType);
  const credentialIdentifier = extractCredentialIdentifier(logData);
  const enrolled = credentialIdentifier ? credentials.get(credentialIdentifier) : undefined;

  const outcome = operate.outcome as AccessOutcome;
  const method =
    enrolled && outcome === 'GRANTED' ? keyTypeToMethod(enrolled.keyType) : operate.method;

  const credentialName = enrolled
    ? enrolled.name
    : logData?.username || logData?.name || describeCredential(operate.method, credentialIdentifier);

  return {
    credentialIdentifier,
    credentialName,
    method,
    outcome,
    eventLabel: operate.label,
    success: outcome === 'GRANTED',
  };
};

/**
 * Load a lock only if it belongs to an organization the caller can access.
 *
 * Every per-lock route must go through this. The system is multi-tenant and a
 * user may belong to several organizations, so ownership is "the lock's org is
 * one of mine" - never a bare findById, which would expose other tenants'
 * locks to anyone who knows an id.
 */
const findAccessibleLock = async (user: any, lockId: string, populateAccessPoint = false) => {
  await syncUserOrganizations(user);
  const organizationIds = await getUserOrganizationIds(user);

  const query = Lock.findOne({ _id: lockId, organizationId: { $in: organizationIds } });
  return populateAccessPoint ? query.populate('accessPointId') : query;
};

router.post('/register', async (req: AuthRequest, res) => {
  try {
    const { accessPointId, lockMac, lockName, lockData, lockVersion } = req.body;
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    // Verify access point belongs to organization
    const ap = await AccessPoint.findOne({ _id: accessPointId, organizationId: { $in: organizationIds } });
    if (!ap) return res.status(404).json({ message: 'Access point not found' });

    const lock = await Lock.create({
      organizationId: ap.organizationId,
      accessPointId,
      lockMac,
      lockName,
      lockData,
      lockVersion,
    });

    res.status(201).json(lock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);
    const locks = await Lock.find({ organizationId: { $in: organizationIds } }).populate('accessPointId');
    res.json(locks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Register a new credential (PIN, Card, Fingerprint)
router.post('/:lockId/credentials', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    const { name, keyType, keyIdentifier, startDate, endDate } = req.body;

    const lock = await findAccessibleLock(req.user, lockId);
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    const key = await LockKey.create({
      organizationId: lock.organizationId,
      lockId,
      name,
      keyType,
      keyIdentifier,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    res.status(201).json(key);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// List the credentials enrolled on a lock
router.get('/:lockId/credentials', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;

    const lock = await findAccessibleLock(req.user, lockId);
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    const credentials = await LockKey.find({ lockId }).sort({ createdAt: -1 });
    res.json(credentials);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Remove one enrolled credential.
 *
 * The caller is expected to have already deleted it from the lock hardware
 * over Bluetooth - this only drops our record of it. Scoped to the lock *and*
 * the caller's organizations so one tenant cannot delete another's keys.
 */
router.delete('/:lockId/credentials/:credentialId', async (req: AuthRequest, res) => {
  try {
    const { lockId, credentialId } = req.params;

    const lock = await findAccessibleLock(req.user, lockId);
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    const credential = await LockKey.findOneAndDelete({
      _id: credentialId,
      lockId,
      organizationId: lock.organizationId,
    });
    if (!credential) return res.status(404).json({ message: 'Credential not found' });

    res.json({ message: 'Credential removed', credential });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Drop every credential of one type for a lock, to match a hardware-level
 * "clear all cards/fingerprints". Needed because credentials enrolled directly
 * on the lock have no record here, so only a bulk wipe can guarantee the lock
 * and the app agree on what exists.
 */
router.delete('/:lockId/credentials', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    const keyType = req.query.keyType as string | undefined;

    const lock = await findAccessibleLock(req.user, lockId);
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    const filter: any = { lockId, organizationId: lock.organizationId };
    if (keyType) filter.keyType = keyType;

    const result = await LockKey.deleteMany(filter);
    res.json({ message: 'Credentials removed', deletedCount: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Sync logs from the lock
router.post('/:lockId/logs', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    const { logs } = req.body; // Array of log objects from SDK
    
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ message: 'Invalid logs format. Expected an array.' });
    }

    const lock = await findAccessibleLock(req.user, lockId, true);
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    // The lock hardware stores credential numbers, not names. Resolve each
    // record against the credentials enrolled through the app for this lock.
    const credentials = await buildCredentialMap(lockId);

    // App unlocks are recorded by the app itself (the hardware logs no
    // identity for them), so skip the hardware's copy of anything we already
    // attributed to a real user rather than listing the unlock twice.
    // Client-recorded unlocks are the ones with no rawLogData.
    const appUnlocks = await AccessLog.find({
      lockId,
      method: AccessMethod.APP,
      rawLogData: { $exists: false },
    }).select('timestamp');
    const appUnlockTimes = appUnlocks.map((log) => log.timestamp.getTime());
    const DEDUPE_WINDOW_MS = 90 * 1000;

    const createdLogs = [];
    for (const logData of logs) {
      const { credentialName, credentialIdentifier, method, outcome, eventLabel, success } =
        resolveLogEntry(logData, credentials);

      // operateDate is what this firmware reports; the other names are for
      // SDK variants. Without it every record was stamped with the sync time.
      const timestamp = new Date(
        logData.operateDate || logData.serverDate || logData.timestamp || Date.now()
      );

      if (
        outcome === 'GRANTED' &&
        method === 'APP' &&
        appUnlockTimes.some((time) => Math.abs(time - timestamp.getTime()) <= DEDUPE_WINDOW_MS)
      ) {
        continue;
      }

      createdLogs.push({
        organizationId: lock.organizationId,
        lockId,
        accessPointId: lock.accessPointId?._id || lock.accessPointId,
        credentialName,
        credentialIdentifier,
        method: method,
        outcome,
        eventLabel,
        timestamp,
        success,
        rawLogData: JSON.stringify(logData),
      });
    }

    if (createdLogs.length > 0) {
      await AccessLog.insertMany(createdLogs);
    }

    res.status(201).json({ count: createdLogs.length });
  } catch (error: any) {
    console.error('Sync logs error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Record an unlock performed from the app.
 *
 * The lock's own log has no identity for a Bluetooth/app unlock - it reports
 * keyId 0 and uid 0 - so the only moment we know who opened the door is right
 * here, from the authenticated user. Sync later skips the hardware's
 * anonymous copy of these.
 */
router.post('/:lockId/unlock-events', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;

    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOne({
      _id: lockId,
      organizationId: { $in: organizationIds },
    }).populate('accessPointId');
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    const fullName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim();

    const log = await AccessLog.create({
      organizationId: lock.organizationId,
      lockId,
      accessPointId: lock.accessPointId?._id || lock.accessPointId,
      credentialName: fullName || req.user.email || 'App user',
      method: AccessMethod.APP,
      outcome: AccessOutcome.GRANTED,
      eventLabel: 'Unlocked with the app',
      timestamp: new Date(),
      success: req.body?.success === undefined ? true : Boolean(req.body.success),
    });

    res.status(201).json(log);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get logs for a lock
router.get('/:lockId/logs', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;

    const lock = await findAccessibleLock(req.user, lockId);
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    const logs = await AccessLog.find({ lockId }).sort({ timestamp: -1 }).limit(50);

    // Resolve names at read time as well as at sync time: a credential named
    // after its logs were synced should still show up correctly in history.
    const credentials = await buildCredentialMap(lockId);

    const resolved = logs.map((log) => {
      const enrolled = log.credentialIdentifier
        ? credentials.get(log.credentialIdentifier)
        : undefined;

      return {
        ...log.toObject(),
        credentialName: enrolled ? enrolled.name : log.credentialName,
        method:
          enrolled && log.outcome === AccessOutcome.GRANTED
            ? keyTypeToMethod(enrolled.keyType)
            : log.method,
      };
    });

    res.json(resolved);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all logs for a lock
router.delete('/:lockId/logs', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOne({ _id: lockId, organizationId: { $in: organizationIds } });
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    await AccessLog.deleteMany({ lockId });
    res.json({ message: 'Access history cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update a lock
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { lockName, accessPointId, lockData } = req.body;

    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOne({ _id: id, organizationId: { $in: organizationIds } });
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    if (accessPointId) {
      const ap = await AccessPoint.findOne({ _id: accessPointId, organizationId: { $in: organizationIds } });
      if (!ap) return res.status(404).json({ message: 'Target access point not found' });
      lock.accessPointId = accessPointId;
    }

    // Resetting passcodes on the hardware issues new lockData. Without
    // persisting it the app permanently loses the ability to reach the lock.
    if (lockData) {
      lock.lockData = lockData;
    }

    lock.lockName = lockName || lock.lockName;

    await lock.save();
    res.json(lock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete a lock
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOneAndDelete({ _id: id, organizationId: { $in: organizationIds } });
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    res.json({ message: 'Lock deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
