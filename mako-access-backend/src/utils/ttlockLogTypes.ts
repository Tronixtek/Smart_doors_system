/**
 * TTLock operation-log record types.
 *
 * Taken from com.ttlock.bl.sdk.constant.LogOperate in the bundled TTLock
 * Android SDK 3.5.4, not from guesswork - the codes are not what their names
 * suggest. Notably recordType 7 is a WRONG passcode (a denied attempt), while
 * 15 and 21 are enrolment events rather than unlocks.
 *
 * The lock reports no success flag of its own; the record type is the only
 * thing that says whether the door actually opened.
 */

export type LogOutcome =
  | 'GRANTED' // the door opened
  | 'DENIED' // someone tried and was refused
  | 'MANAGEMENT' // a credential was added, changed or removed
  | 'LOCKED' // the door was locked
  | 'SYSTEM'; // sensor, reboot and similar housekeeping

export interface LogOperateDefinition {
  method: string;
  outcome: LogOutcome;
  label: string;
}

export const LOG_OPERATE_TYPES: Record<number, LogOperateDefinition> = {
  1: { method: 'APP', outcome: 'GRANTED', label: 'Unlocked with the app' },
  3: { method: 'APP', outcome: 'GRANTED', label: 'Unlocked remotely' },
  4: { method: 'PASSCODE', outcome: 'GRANTED', label: 'Unlocked with a PIN' },
  5: { method: 'PASSCODE', outcome: 'MANAGEMENT', label: 'PIN changed on the keypad' },
  6: { method: 'PASSCODE', outcome: 'MANAGEMENT', label: 'PIN deleted on the keypad' },
  7: { method: 'PASSCODE', outcome: 'DENIED', label: 'Wrong PIN entered' },
  8: { method: 'PASSCODE', outcome: 'MANAGEMENT', label: 'All PINs cleared on the keypad' },
  9: { method: 'PASSCODE', outcome: 'DENIED', label: 'PIN rejected - superseded' },
  10: { method: 'PASSCODE', outcome: 'MANAGEMENT', label: 'Delete code used' },
  11: { method: 'PASSCODE', outcome: 'DENIED', label: 'PIN expired' },
  12: { method: 'OTHER', outcome: 'SYSTEM', label: 'Lock storage full' },
  13: { method: 'PASSCODE', outcome: 'DENIED', label: 'PIN is blocked' },
  14: { method: 'OTHER', outcome: 'SYSTEM', label: 'Lock restarted' },
  15: { method: 'CARD', outcome: 'MANAGEMENT', label: 'Card added on the lock' },
  16: { method: 'CARD', outcome: 'MANAGEMENT', label: 'All cards cleared' },
  17: { method: 'CARD', outcome: 'GRANTED', label: 'Unlocked with a card' },
  18: { method: 'CARD', outcome: 'MANAGEMENT', label: 'Card deleted' },
  19: { method: 'OTHER', outcome: 'GRANTED', label: 'Unlocked with a wristband' },
  20: { method: 'FINGERPRINT', outcome: 'GRANTED', label: 'Unlocked with a fingerprint' },
  21: { method: 'FINGERPRINT', outcome: 'MANAGEMENT', label: 'Fingerprint added on the lock' },
  22: { method: 'FINGERPRINT', outcome: 'DENIED', label: 'Fingerprint not recognised' },
  23: { method: 'FINGERPRINT', outcome: 'MANAGEMENT', label: 'Fingerprint deleted' },
  24: { method: 'FINGERPRINT', outcome: 'MANAGEMENT', label: 'All fingerprints cleared' },
  25: { method: 'CARD', outcome: 'DENIED', label: 'Card not recognised' },
  26: { method: 'APP', outcome: 'LOCKED', label: 'Locked from the app' },
  27: { method: 'KEY', outcome: 'GRANTED', label: 'Unlocked with a mechanical key' },
  28: { method: 'APP', outcome: 'GRANTED', label: 'Unlocked via the gateway' },
  29: { method: 'OTHER', outcome: 'DENIED', label: 'Illegal unlock attempt' },
  30: { method: 'OTHER', outcome: 'SYSTEM', label: 'Door sensor - closed' },
  31: { method: 'OTHER', outcome: 'SYSTEM', label: 'Door sensor - opened' },
  32: { method: 'OTHER', outcome: 'GRANTED', label: 'Opened from inside' },
  33: { method: 'FINGERPRINT', outcome: 'LOCKED', label: 'Locked with a fingerprint' },
  34: { method: 'PASSCODE', outcome: 'LOCKED', label: 'Locked with a PIN' },
  35: { method: 'CARD', outcome: 'LOCKED', label: 'Locked with a card' },
  36: { method: 'KEY', outcome: 'LOCKED', label: 'Locked with a mechanical key' },
  37: { method: 'OTHER', outcome: 'GRANTED', label: 'Remote control key used' },
  38: { method: 'PASSCODE', outcome: 'DENIED', label: 'Correct PIN, but the lock is double-locked' },
  39: { method: 'CARD', outcome: 'DENIED', label: 'Valid card, but the lock is double-locked' },
  40: { method: 'FINGERPRINT', outcome: 'DENIED', label: 'Valid fingerprint, but the lock is double-locked' },
  41: { method: 'APP', outcome: 'DENIED', label: 'App unlock refused - the lock is double-locked' },
  51: { method: 'CARD', outcome: 'DENIED', label: 'Card is blocked' },
  52: { method: 'APP', outcome: 'LOCKED', label: 'Double-locked from the app' },
  55: { method: 'OTHER', outcome: 'GRANTED', label: 'Unlocked with a key fob' },
  56: { method: 'OTHER', outcome: 'GRANTED', label: 'Unlocked with a wireless keypad' },
  57: { method: 'OTHER', outcome: 'GRANTED', label: 'Unlocked with a QR code' },
  58: { method: 'OTHER', outcome: 'DENIED', label: 'QR code rejected' },
  67: { method: 'OTHER', outcome: 'GRANTED', label: 'Unlocked with face recognition' },
  68: { method: 'OTHER', outcome: 'DENIED', label: 'Face recognised, but the lock is double-locked' },
  69: { method: 'OTHER', outcome: 'LOCKED', label: 'Locked with face recognition' },
  70: { method: 'OTHER', outcome: 'MANAGEMENT', label: 'Face added' },
  71: { method: 'OTHER', outcome: 'DENIED', label: 'Face rejected - outside its valid time' },
  72: { method: 'OTHER', outcome: 'MANAGEMENT', label: 'Face deleted' },
  73: { method: 'OTHER', outcome: 'MANAGEMENT', label: 'All faces cleared' },
  74: { method: 'CARD', outcome: 'DENIED', label: 'CPU card rejected' },
  75: { method: 'APP', outcome: 'GRANTED', label: 'Unlocked with an authorised app key' },
  76: { method: 'APP', outcome: 'GRANTED', label: 'Unlocked via an authorised gateway key' },
  77: { method: 'KEY', outcome: 'GRANTED', label: 'Key accepted - awaiting second check' },
  78: { method: 'PASSCODE', outcome: 'GRANTED', label: 'PIN accepted - awaiting second check' },
  79: { method: 'FINGERPRINT', outcome: 'GRANTED', label: 'Fingerprint accepted - awaiting second check' },
  80: { method: 'CARD', outcome: 'GRANTED', label: 'Card accepted - awaiting second check' },
  81: { method: 'OTHER', outcome: 'GRANTED', label: 'Face accepted - awaiting second check' },
  82: { method: 'OTHER', outcome: 'GRANTED', label: 'Key fob accepted - awaiting second check' },
  83: { method: 'OTHER', outcome: 'GRANTED', label: 'Palm vein accepted - awaiting second check' },
  84: { method: 'OTHER', outcome: 'GRANTED', label: 'Unlocked with palm vein' },
  85: { method: 'OTHER', outcome: 'DENIED', label: 'Palm vein recognised, but the lock is double-locked' },
  86: { method: 'OTHER', outcome: 'LOCKED', label: 'Locked with palm vein' },
  87: { method: 'OTHER', outcome: 'MANAGEMENT', label: 'Palm vein added' },
  88: { method: 'OTHER', outcome: 'DENIED', label: 'Palm vein not recognised' },
  89: { method: 'OTHER', outcome: 'MANAGEMENT', label: 'Palm vein deleted' },
  90: { method: 'OTHER', outcome: 'MANAGEMENT', label: 'All palm veins cleared' },
  91: { method: 'CARD', outcome: 'DENIED', label: 'Card rejected' },
  92: { method: 'PASSCODE', outcome: 'GRANTED', label: 'Unlocked with the admin code' },
};

/** Record types the lock reports that SDK 3.5.4 does not define. */
export const describeUnknownRecordType = (recordType: number): LogOperateDefinition => ({
  method: 'OTHER',
  outcome: 'SYSTEM',
  label: `Lock event (type ${recordType})`,
});

export const lookupLogOperate = (recordType: number): LogOperateDefinition =>
  LOG_OPERATE_TYPES[recordType] || describeUnknownRecordType(recordType);
