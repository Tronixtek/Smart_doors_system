import { Router, Request, Response } from 'express';
import { verifyToken, requireAdminOrManager, requireStaff } from '../middleware/auth';
import { AccessEvent, AccessEventResult, AccessEventType, AccessCredentialType } from '../models/AccessEvent';
import { Space } from '../models/Space';
import { Lock } from '../models/Lock';
import { LockKey, LockKeyType } from '../models/LockKey';
import { Person, Visit } from '../models';
import {
  buildAccessEventKey,
  buildCredentialHint,
  buildRecordIdentifierCandidates,
  getTtlockRecordProfile,
  normalizeOperationDate,
  parseTtlockOperationRecords,
  type NormalizedTtlockRecord,
} from '../utils/accessEvents';

const router = Router();

router.use(verifyToken);

const sanitizeRawRecord = (record: NormalizedTtlockRecord) => ({
  ...record.raw,
  password: record.password ? `***${record.password.slice(-2)}` : undefined,
  newPassword: record.newPassword ? `***${record.newPassword.slice(-2)}` : undefined,
});

const parseMultiValue = (value: unknown): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildEventFilter = (query: Request['query']) => {
  const filter: Record<string, any> = {};

  if (query.spaceId) {
    filter.spaceId = query.spaceId;
  }

  if (query.personId) {
    filter.personId = query.personId;
  }

  const eventTypes = parseMultiValue(query.eventType);
  if (eventTypes && eventTypes.length > 0) {
    filter.eventType = eventTypes.length === 1 ? eventTypes[0] : { $in: eventTypes };
  }

  const eventResults = parseMultiValue(query.eventResult);
  if (eventResults && eventResults.length > 0) {
    filter.eventResult = eventResults.length === 1 ? eventResults[0] : { $in: eventResults };
  }

  const credentialTypes = parseMultiValue(query.credentialType);
  if (credentialTypes && credentialTypes.length > 0) {
    filter.credentialType = credentialTypes.length === 1 ? credentialTypes[0] : { $in: credentialTypes };
  }

  if (query.from || query.to) {
    filter.occurredAt = {};
    if (query.from) {
      filter.occurredAt.$gte = new Date(String(query.from));
    }
    if (query.to) {
      filter.occurredAt.$lte = new Date(String(query.to));
    }
  }

  return filter;
};

const getLockKeyIdentifiers = (lockKey: any): string[] =>
  [
    lockKey.keyIdentifier,
    lockKey.metadata?.passcode,
    lockKey.metadata?.cardNumber,
    lockKey.metadata?.fingerprintNumber,
  ]
    .filter((value: unknown): value is string | number => value !== undefined && value !== null && value !== '')
    .map((value) => String(value));

const credentialTypeMatches = (recordCredentialType: AccessCredentialType, lockKeyType: LockKeyType) => {
  switch (recordCredentialType) {
    case AccessCredentialType.PASSCODE:
    case AccessCredentialType.ADMIN_CODE:
      return lockKeyType === LockKeyType.PASSCODE;
    case AccessCredentialType.CARD:
      return lockKeyType === LockKeyType.CARD;
    case AccessCredentialType.FINGERPRINT:
    case AccessCredentialType.FACE:
    case AccessCredentialType.PALM_VEIN:
      return lockKeyType === LockKeyType.FINGERPRINT;
    case AccessCredentialType.EKEY:
      return lockKeyType === LockKeyType.EKEY;
    default:
      return false;
  }
};

const resolveLockKeyAttribution = (
  record: NormalizedTtlockRecord,
  recordCredentialType: AccessCredentialType,
  occurredAt: Date,
  lockKeys: any[]
) => {
  const directCandidates = buildRecordIdentifierCandidates(record);
  if (directCandidates.length > 0) {
    const directMatch = lockKeys.filter((lockKey) => {
      if (!credentialTypeMatches(recordCredentialType, lockKey.keyType)) {
        return false;
      }

      const knownIdentifiers = getLockKeyIdentifiers(lockKey);
      return directCandidates.some((identifier) => knownIdentifiers.includes(identifier));
    });

    if (directMatch.length === 1) {
      return directMatch[0];
    }
  }

  const timeWindowMatches = lockKeys.filter((lockKey) => {
    if (!credentialTypeMatches(recordCredentialType, lockKey.keyType)) {
      return false;
    }

    return occurredAt >= new Date(lockKey.startDate) && occurredAt <= new Date(lockKey.endDate);
  });

  if (timeWindowMatches.length === 1) {
    return timeWindowMatches[0];
  }

  return null;
};

router.get('/', requireStaff, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const filter = buildEventFilter(req.query);

    const [events, total] = await Promise.all([
      AccessEvent.find(filter)
        .populate('spaceId', 'name code site floor type')
        .populate('personId', 'firstName lastName personType company')
        .populate('visitId', 'title startAt endAt status')
        .populate('lockId', 'lockName lockMac')
        .populate('lockKeyId', 'keyType keyIdentifier')
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(pageSize),
      AccessEvent.countDocuments(filter),
    ]);

    res.json({
      data: events,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error('Get office access events error:', error);
    res.status(500).json({ error: 'Failed to fetch office access activity', message: error.message });
  }
});

router.get('/analytics/overview', requireAdminOrManager, async (req: Request, res: Response) => {
  try {
    const timezone = String(req.query.timezone || 'UTC');
    const filter = buildEventFilter(req.query);
    const accessFilter = {
      ...filter,
      eventType: { $in: [AccessEventType.ACCESS_GRANTED, AccessEventType.ACCESS_DENIED] },
    };

    const successFilter = {
      ...accessFilter,
      eventResult: AccessEventResult.SUCCESS,
    };

    const deniedFilter = {
      ...accessFilter,
      eventResult: AccessEventResult.FAILED,
    };

    const [
      totalAccessEvents,
      successfulAccesses,
      deniedAccesses,
      uniquePeopleAggregate,
      topSpacesAggregate,
      topPeopleAggregate,
      hourlyAggregate,
      credentialAggregate,
      recentEvents,
    ] = await Promise.all([
      AccessEvent.countDocuments(accessFilter),
      AccessEvent.countDocuments(successFilter),
      AccessEvent.countDocuments(deniedFilter),
      AccessEvent.aggregate([
        { $match: successFilter },
        { $group: { _id: '$personId' } },
        { $match: { _id: { $ne: null } } },
        { $count: 'count' },
      ]),
      AccessEvent.aggregate([
        { $match: successFilter },
        { $group: { _id: '$spaceId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      AccessEvent.aggregate([
        { $match: successFilter },
        { $group: { _id: '$personId', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      AccessEvent.aggregate([
        { $match: accessFilter },
        {
          $group: {
            _id: {
              $hour: {
                date: '$occurredAt',
                timezone,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AccessEvent.aggregate([
        { $match: successFilter },
        { $group: { _id: '$credentialType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AccessEvent.find(accessFilter)
        .populate('spaceId', 'name code')
        .populate('personId', 'firstName lastName')
        .sort({ occurredAt: -1 })
        .limit(10),
    ]);

    const topSpaceIds = topSpacesAggregate.map((item) => item._id).filter(Boolean);
    const topPersonIds = topPeopleAggregate.map((item) => item._id).filter(Boolean);

    const [spaces, people] = await Promise.all([
      Space.find({ _id: { $in: topSpaceIds } }).select('name code'),
      Person.find({ _id: { $in: topPersonIds } }).select('firstName lastName'),
    ]);

    const spaceMap = new Map(spaces.map((space) => [String(space._id), space]));
    const personMap = new Map(people.map((person) => [String(person._id), person]));

    res.json({
      data: {
        summary: {
          totalAccessEvents,
          successfulAccesses,
          deniedAccesses,
          uniquePeople: uniquePeopleAggregate[0]?.count || 0,
        },
        topSpaces: topSpacesAggregate.map((item) => {
          const space = spaceMap.get(String(item._id));
          return {
            spaceId: item._id,
            name: space?.name || 'Unknown Space',
            code: space?.code || '',
            count: item.count,
          };
        }),
        topPeople: topPeopleAggregate.map((item) => {
          const person = personMap.get(String(item._id));
          return {
            personId: item._id,
            name: person ? `${person.firstName} ${person.lastName}` : 'Unknown Person',
            count: item.count,
          };
        }),
        accessByHour: hourlyAggregate.map((item) => ({
          hour: item._id,
          count: item.count,
        })),
        credentialUsage: credentialAggregate.map((item) => ({
          credentialType: item._id,
          count: item.count,
        })),
        recentEvents,
      },
    });
  } catch (error: any) {
    console.error('Get office access analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch office access analytics', message: error.message });
  }
});

router.post('/sync', requireStaff, async (req: Request, res: Response) => {
  try {
    const { spaceId, rawRecords, syncMode = 'ALL' } = req.body;

    if (!spaceId || rawRecords === undefined) {
      return res.status(400).json({ error: 'spaceId and rawRecords are required' });
    }

    const space = await Space.findById(spaceId).populate('linkedLockId', 'lockName lockMac');
    if (!space) {
      return res.status(404).json({ error: 'Office space not found' });
    }

    if (!space.linkedLockId) {
      return res.status(400).json({ error: 'The selected office space does not have a linked lock' });
    }

    const lockId = typeof space.linkedLockId === 'object' ? String((space.linkedLockId as any)._id || (space.linkedLockId as any).id) : String(space.linkedLockId);
    const lock = await Lock.findById(lockId);
    if (!lock) {
      return res.status(404).json({ error: 'Linked lock not found' });
    }

    const records = parseTtlockOperationRecords(rawRecords);
    if (records.length === 0) {
      return res.json({
        data: {
          processed: 0,
          inserted: 0,
          updated: 0,
          unresolved: 0,
          syncMode,
        },
      });
    }

    const lockKeys = await LockKey.find({ lockId: lock._id, spaceId: space._id })
      .populate({
        path: 'visitId',
        select: 'personId title startAt endAt status',
      })
      .select('keyType keyIdentifier startDate endDate metadata visitId');

    let inserted = 0;
    let updated = 0;
    let unresolved = 0;

    for (const record of records) {
      const profile = getTtlockRecordProfile(record.recordType);
      const occurredAt = normalizeOperationDate(record.operateDate);
      const lockKeyMatch = resolveLockKeyAttribution(record, profile.credentialType, occurredAt, lockKeys);
      const visit = lockKeyMatch?.visitId && typeof lockKeyMatch.visitId === 'object' ? lockKeyMatch.visitId : null;

      if (!lockKeyMatch && profile.eventType === AccessEventType.ACCESS_GRANTED) {
        unresolved += 1;
      }

      const credentialHint = buildCredentialHint(record);
      const eventKey = buildAccessEventKey(lockId, record, credentialHint);
      const updatePayload = {
        source: 'TTLOCK_LOG',
        spaceId: space._id,
        lockId: lock._id,
        personId: visit?.personId || undefined,
        visitId: visit?._id || undefined,
        lockKeyId: lockKeyMatch?._id || undefined,
        syncedBy: req.user?.userId,
        eventType: profile.eventType,
        eventResult: profile.eventResult,
        credentialType: profile.credentialType,
        description: profile.description,
        occurredAt,
        syncedAt: new Date(),
        recordId: record.recordId,
        recordType: record.recordType,
        uid: record.uid,
        keyId: record.keyId,
        credentialHint,
        batteryLevel: record.electricQuantity,
        rawData: sanitizeRawRecord(record),
      };

      const existing = await AccessEvent.findOne({ eventKey }).select('_id');
      if (existing) {
        await AccessEvent.findByIdAndUpdate(existing._id, updatePayload, { new: true });
        updated += 1;
      } else {
        await AccessEvent.create({
          eventKey,
          ...updatePayload,
        });
        inserted += 1;
      }
    }

    res.json({
      data: {
        processed: records.length,
        inserted,
        updated,
        unresolved,
        syncMode,
      },
    });
  } catch (error: any) {
    console.error('Sync office access events error:', error);
    res.status(500).json({ error: 'Failed to sync office access activity', message: error.message });
  }
});

export default router;
