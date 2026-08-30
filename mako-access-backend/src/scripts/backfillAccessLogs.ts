/**
 * Re-resolve historical access logs.
 *
 * Logs synced before credential resolution existed were all written as
 * "Unknown User", and later ones used a recordType map that did not cover the
 * codes this firmware emits (15/17 for cards, 20/21 for fingerprints), so they
 * landed as OTHER. Every one of them still has its original SDK payload in
 * rawLogData, so the correct method, credential and timestamp can be recovered
 * without re-syncing the hardware.
 *
 * Read-only unless --commit is passed.
 *
 *   node -r ts-node/register src/scripts/backfillAccessLogs.ts
 *   node -r ts-node/register src/scripts/backfillAccessLogs.ts --commit
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AccessLog, AccessMethod, AccessOutcome } from '../models/AccessLog';
import { lookupLogOperate } from '../utils/ttlockLogTypes';
import { LockKey } from '../models/LockKey';

dotenv.config();

const commit = process.argv.includes('--commit');

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

const keyTypeToMethod = (keyType: string): string =>
  keyType === 'EKEY' ? AccessMethod.APP : keyType;

const backfill = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mako-access';
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected. Mode: ${commit ? 'COMMIT' : 'DRY RUN (pass --commit to apply)'}\n`);

  const logs = await AccessLog.find({ rawLogData: { $exists: true, $ne: null } });
  console.log(`Examining ${logs.length} logs with raw SDK data.\n`);

  // Credentials are per-lock, so cache one map per lock rather than re-querying.
  const credentialCache = new Map<string, Map<string, any>>();
  const getCredentials = async (lockId: string) => {
    const cached = credentialCache.get(lockId);
    if (cached) return cached;

    const keys = await LockKey.find({ lockId }).select('keyIdentifier name keyType');
    const map = new Map(keys.map((key) => [key.keyIdentifier, key]));
    credentialCache.set(lockId, map);
    return map;
  };

  let changed = 0;
  const summary: Record<string, number> = {};

  for (const log of logs) {
    let logData: any;
    try {
      logData = JSON.parse(log.rawLogData as string);
    } catch {
      continue;
    }

    const credentials = await getCredentials(log.lockId.toString());
    const operate = lookupLogOperate(logData?.recordType);
    const credentialIdentifier = extractCredentialIdentifier(logData);
    const enrolled = credentialIdentifier ? credentials.get(credentialIdentifier) : undefined;

    const outcome = operate.outcome as AccessOutcome;
    const method =
      enrolled && outcome === 'GRANTED' ? keyTypeToMethod(enrolled.keyType) : operate.method;

    const credentialName = enrolled
      ? enrolled.name
      : logData?.username ||
        logData?.name ||
        describeCredential(operate.method, credentialIdentifier);

    const timestamp = new Date(
      logData?.operateDate || logData?.serverDate || logData?.timestamp || log.timestamp
    );

    const isChanged =
      log.credentialName !== credentialName ||
      log.method !== method ||
      log.outcome !== outcome ||
      log.eventLabel !== operate.label ||
      log.credentialIdentifier !== credentialIdentifier ||
      log.timestamp.getTime() !== timestamp.getTime();

    if (!isChanged) continue;

    changed++;
    const key = `${log.outcome || '-'}/${log.method} "${log.credentialName}"  ->  ${outcome}/${method} "${credentialName}" (${operate.label})`;
    summary[key] = (summary[key] || 0) + 1;

    if (commit) {
      log.credentialName = credentialName;
      log.method = method as AccessMethod;
      log.outcome = outcome;
      log.eventLabel = operate.label;
      log.success = outcome === 'GRANTED';
      log.credentialIdentifier = credentialIdentifier;
      log.timestamp = timestamp;
      await log.save();
    }
  }

  console.log('Changes by transition:');
  Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => console.log(`  ${count.toString().padStart(4)}  ${key}`));

  console.log(`\n${changed} of ${logs.length} logs ${commit ? 'updated' : 'would change'}.`);
  await mongoose.disconnect();
  process.exit(0);
};

backfill().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
