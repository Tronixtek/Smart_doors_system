import crypto from 'crypto';
import { AccessCredentialType, AccessEventResult, AccessEventType } from '../models/AccessEvent';

export interface NormalizedTtlockRecord {
  recordType: number;
  recordId?: number;
  uid?: number;
  keyId?: number;
  password?: string;
  newPassword?: string;
  operateDate: number;
  deleteDate?: number;
  electricQuantity?: number;
  accessoryElectricQuantity?: number;
  raw: Record<string, any>;
}

type RecordProfile = {
  eventType: AccessEventType;
  eventResult: AccessEventResult;
  credentialType: AccessCredentialType;
  description: string;
};

const TTLOCK_RECORD_PROFILES: Record<number, RecordProfile> = {
  1: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.APP, description: 'Mobile app unlock succeeded' },
  3: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.GATEWAY, description: 'Server or gateway unlock succeeded' },
  4: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.PASSCODE, description: 'Passcode unlock succeeded' },
  5: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PASSCODE, description: 'Passcode modified at the lock' },
  6: { eventType: AccessEventType.CREDENTIAL_REMOVED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PASSCODE, description: 'Single passcode removed from the lock' },
  7: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PASSCODE, description: 'Passcode unlock failed' },
  8: { eventType: AccessEventType.CREDENTIAL_CLEARED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PASSCODE, description: 'All passcodes cleared from the lock' },
  9: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PASSCODE, description: 'Passcode was rejected by anti-peep protection' },
  10: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PASSCODE, description: 'Deleted passcode was used at the lock' },
  11: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PASSCODE, description: 'Expired passcode was used at the lock' },
  12: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PASSCODE, description: 'Lock reported insufficient storage space' },
  13: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PASSCODE, description: 'Blacklisted passcode was used at the lock' },
  14: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.UNKNOWN, description: 'Lock rebooted' },
  15: { eventType: AccessEventType.CREDENTIAL_ADDED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.CARD, description: 'Card added to the lock' },
  16: { eventType: AccessEventType.CREDENTIAL_CLEARED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.CARD, description: 'All cards cleared from the lock' },
  17: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.CARD, description: 'Card unlock succeeded' },
  18: { eventType: AccessEventType.CREDENTIAL_REMOVED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.CARD, description: 'Card removed from the lock' },
  19: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.KEY_FOB, description: 'Key fob unlock succeeded' },
  20: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.FINGERPRINT, description: 'Fingerprint unlock succeeded' },
  21: { eventType: AccessEventType.CREDENTIAL_ADDED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FINGERPRINT, description: 'Fingerprint added to the lock' },
  22: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.FINGERPRINT, description: 'Fingerprint unlock failed' },
  23: { eventType: AccessEventType.CREDENTIAL_REMOVED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FINGERPRINT, description: 'Fingerprint removed from the lock' },
  24: { eventType: AccessEventType.CREDENTIAL_CLEARED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FINGERPRINT, description: 'All fingerprints cleared from the lock' },
  25: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.CARD, description: 'Card unlock failed' },
  26: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.APP, description: 'Lock was secured over Bluetooth' },
  27: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.PHYSICAL_KEY, description: 'Mechanical key unlock succeeded' },
  28: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.GATEWAY, description: 'Gateway unlock succeeded' },
  29: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.UNKNOWN, description: 'Illegal unlock attempt detected' },
  30: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.UNKNOWN, description: 'Door sensor reported the door locked' },
  31: { eventType: AccessEventType.DOOR_UNLOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.UNKNOWN, description: 'Door sensor reported the door unlocked' },
  32: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.UNKNOWN, description: 'Door go-out event recorded' },
  33: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FINGERPRINT, description: 'Door locked after fingerprint use' },
  34: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PASSCODE, description: 'Door locked after passcode use' },
  35: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.CARD, description: 'Door locked after card use' },
  36: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PHYSICAL_KEY, description: 'Door locked with a mechanical key' },
  37: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.KEY_FOB, description: 'Remote control key unlock succeeded' },
  38: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PASSCODE, description: 'Passcode unlock failed because lock direction was reversed' },
  39: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.CARD, description: 'Card unlock failed because lock direction was reversed' },
  40: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.FINGERPRINT, description: 'Fingerprint unlock failed because lock direction was reversed' },
  41: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.APP, description: 'App unlock failed because lock direction was reversed' },
  51: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.CARD, description: 'Blacklisted card unlock failed' },
  52: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.APP, description: 'Dead lock engaged from the app' },
  55: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.KEY_FOB, description: 'Wireless key fob unlock succeeded' },
  56: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.PASSCODE, description: 'Wireless keypad access succeeded' },
  57: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.QR_CODE, description: 'QR code unlock succeeded' },
  58: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.QR_CODE, description: 'QR code unlock failed' },
  67: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.FACE, description: 'Face unlock succeeded' },
  68: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.FACE, description: 'Face unlock failed because lock direction was reversed' },
  69: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FACE, description: 'Door locked after face use' },
  70: { eventType: AccessEventType.CREDENTIAL_ADDED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FACE, description: 'Face credential added to the lock' },
  71: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.FACE, description: 'Face unlock failed because the credential was outside its valid time' },
  72: { eventType: AccessEventType.CREDENTIAL_REMOVED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FACE, description: 'Face credential removed from the lock' },
  73: { eventType: AccessEventType.CREDENTIAL_CLEARED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FACE, description: 'All face credentials cleared from the lock' },
  74: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.CARD, description: 'CPU card unlock failed' },
  75: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.EKEY, description: 'App authorization key unlock succeeded' },
  76: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.EKEY, description: 'Gateway authorization key unlock succeeded' },
  77: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PHYSICAL_KEY, description: 'Double-check key unlock succeeded and is waiting for second verification' },
  78: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PASSCODE, description: 'Double-check passcode unlock succeeded and is waiting for second verification' },
  79: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FINGERPRINT, description: 'Double-check fingerprint unlock succeeded and is waiting for second verification' },
  80: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.CARD, description: 'Double-check card unlock succeeded and is waiting for second verification' },
  81: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.FACE, description: 'Double-check face unlock succeeded and is waiting for second verification' },
  82: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.KEY_FOB, description: 'Double-check key fob unlock succeeded and is waiting for second verification' },
  83: { eventType: AccessEventType.SYSTEM_EVENT, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PALM_VEIN, description: 'Double-check palm-vein unlock succeeded and is waiting for second verification' },
  84: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.PALM_VEIN, description: 'Palm-vein unlock succeeded' },
  85: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PALM_VEIN, description: 'Palm-vein unlock failed because lock direction was reversed' },
  86: { eventType: AccessEventType.DOOR_LOCKED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PALM_VEIN, description: 'Door locked after palm-vein use' },
  87: { eventType: AccessEventType.CREDENTIAL_ADDED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PALM_VEIN, description: 'Palm-vein credential added to the lock' },
  88: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.PALM_VEIN, description: 'Palm-vein unlock failed' },
  89: { eventType: AccessEventType.CREDENTIAL_REMOVED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PALM_VEIN, description: 'Palm-vein credential removed from the lock' },
  90: { eventType: AccessEventType.CREDENTIAL_CLEARED, eventResult: AccessEventResult.INFO, credentialType: AccessCredentialType.PALM_VEIN, description: 'All palm-vein credentials cleared from the lock' },
  91: { eventType: AccessEventType.ACCESS_DENIED, eventResult: AccessEventResult.FAILED, credentialType: AccessCredentialType.CARD, description: 'Card unlock failed' },
  92: { eventType: AccessEventType.ACCESS_GRANTED, eventResult: AccessEventResult.SUCCESS, credentialType: AccessCredentialType.ADMIN_CODE, description: 'Admin code unlock succeeded' },
};

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const tryParseJson = (value: string): unknown => {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (
    !(
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('"[') && trimmed.endsWith(']"')) ||
      (trimmed.startsWith('"{') && trimmed.endsWith('}"'))
    )
  ) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const parseKeyValueRecordString = (value: string): Record<string, any>[] => {
  const matches = value.match(/\{[^{}]+\}/g);
  const segments = matches && matches.length > 0 ? matches : value.includes('recordType=') ? [value] : [];

  return segments
    .map((segment) => {
      const record: Record<string, any> = {};
      const regex = /([A-Za-z][A-Za-z0-9_]*)=([^,}]+)/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(segment)) !== null) {
        record[match[1]] = match[2].trim();
      }
      return record;
    })
    .filter((record) => Object.keys(record).length > 0);
};

const extractRecordArray = (input: unknown): Record<string, any>[] => {
  if (Array.isArray(input)) {
    return input.filter((item): item is Record<string, any> => typeof item === 'object' && item !== null);
  }

  if (typeof input === 'object' && input !== null) {
    const candidate = input as Record<string, any>;
    if (Array.isArray(candidate.records)) {
      return candidate.records.filter((item): item is Record<string, any> => typeof item === 'object' && item !== null);
    }
    if (Array.isArray(candidate.data)) {
      return candidate.data.filter((item): item is Record<string, any> => typeof item === 'object' && item !== null);
    }
    if (Array.isArray(candidate.list)) {
      return candidate.list.filter((item): item is Record<string, any> => typeof item === 'object' && item !== null);
    }
    if (candidate.recordType !== undefined) {
      return [candidate];
    }
  }

  return [];
};

export const parseTtlockOperationRecords = (payload: unknown): NormalizedTtlockRecord[] => {
  let records = extractRecordArray(payload);

  if (records.length === 0 && typeof payload === 'string') {
    const jsonParsed = tryParseJson(payload);
    if (typeof jsonParsed === 'string') {
      records = extractRecordArray(tryParseJson(jsonParsed));
    } else {
      records = extractRecordArray(jsonParsed);
    }

    if (records.length === 0) {
      records = parseKeyValueRecordString(payload);
    }
  }

  return records
    .map<NormalizedTtlockRecord | null>((record) => {
      const operateDateValue = toNumber(record.operateDate ?? record.timestamp ?? record.time ?? record.operate_time);
      if (!operateDateValue) {
        return null;
      }

      return {
        recordType: toNumber(record.recordType ?? record.type) ?? -1,
        recordId: toNumber(record.recordId ?? record.id ?? record.logId),
        uid: toNumber(record.uid ?? record.userId),
        keyId: toNumber(record.keyId ?? record.credentialId),
        password: record.password ? String(record.password) : undefined,
        newPassword: record.newPassword ? String(record.newPassword) : undefined,
        operateDate: operateDateValue,
        deleteDate: toNumber(record.deleteDate),
        electricQuantity: toNumber(record.electricQuantity),
        accessoryElectricQuantity: toNumber(record.accessoryElectricQuantity),
        raw: record,
      };
    })
    .filter((record): record is NormalizedTtlockRecord => !!record && record.recordType >= 0);
};

export const getTtlockRecordProfile = (recordType: number): RecordProfile =>
  TTLOCK_RECORD_PROFILES[recordType] || {
    eventType: AccessEventType.UNKNOWN,
    eventResult: AccessEventResult.INFO,
    credentialType: AccessCredentialType.UNKNOWN,
    description: `Unmapped TTLock event ${recordType}`,
  };

export const normalizeOperationDate = (value: number): Date => {
  const milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
  return new Date(milliseconds);
};

export const buildAccessEventKey = (
  lockId: string,
  record: NormalizedTtlockRecord,
  fallbackCredentialHint?: string
) => {
  if (record.recordId !== undefined) {
    return `ttlock:${lockId}:${record.recordId}`;
  }

  const fingerprint = crypto
    .createHash('sha1')
    .update(
      [
        record.recordType,
        record.operateDate,
        record.uid ?? '',
        record.keyId ?? '',
        fallbackCredentialHint ?? '',
      ].join(':')
    )
    .digest('hex');

  return `ttlock:${lockId}:fp:${fingerprint}`;
};

export const buildCredentialHint = (record: NormalizedTtlockRecord): string | undefined => {
  if (record.password) {
    const suffix = record.password.slice(-2);
    return `passcode **${suffix}`;
  }
  if (record.keyId !== undefined) {
    return `key ${record.keyId}`;
  }
  if (record.uid !== undefined) {
    return `uid ${record.uid}`;
  }
  return undefined;
};

export const buildRecordIdentifierCandidates = (record: NormalizedTtlockRecord): string[] => {
  return [record.password, record.keyId, record.uid]
    .filter((value): value is string | number => value !== undefined && value !== null && value !== '')
    .map((value) => String(value));
};

