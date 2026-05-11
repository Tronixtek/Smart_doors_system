import mongoose, { Document, Schema } from 'mongoose';

export enum AccessEventType {
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  DOOR_LOCKED = 'DOOR_LOCKED',
  DOOR_UNLOCKED = 'DOOR_UNLOCKED',
  CREDENTIAL_ADDED = 'CREDENTIAL_ADDED',
  CREDENTIAL_REMOVED = 'CREDENTIAL_REMOVED',
  CREDENTIAL_CLEARED = 'CREDENTIAL_CLEARED',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  UNKNOWN = 'UNKNOWN',
}

export enum AccessEventResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  INFO = 'INFO',
}

export enum AccessCredentialType {
  PASSCODE = 'PASSCODE',
  CARD = 'CARD',
  FINGERPRINT = 'FINGERPRINT',
  EKEY = 'EKEY',
  APP = 'APP',
  GATEWAY = 'GATEWAY',
  PHYSICAL_KEY = 'PHYSICAL_KEY',
  KEY_FOB = 'KEY_FOB',
  QR_CODE = 'QR_CODE',
  FACE = 'FACE',
  PALM_VEIN = 'PALM_VEIN',
  ADMIN_CODE = 'ADMIN_CODE',
  UNKNOWN = 'UNKNOWN',
}

export enum AccessEventSource {
  TTLOCK_LOG = 'TTLOCK_LOG',
  SYSTEM = 'SYSTEM',
}

export interface IAccessEvent extends Document {
  eventKey: string;
  source: AccessEventSource;
  spaceId: mongoose.Types.ObjectId;
  lockId: mongoose.Types.ObjectId;
  personId?: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  lockKeyId?: mongoose.Types.ObjectId;
  syncedBy?: mongoose.Types.ObjectId;
  eventType: AccessEventType;
  eventResult: AccessEventResult;
  credentialType: AccessCredentialType;
  description: string;
  occurredAt: Date;
  syncedAt: Date;
  recordId?: number;
  recordType?: number;
  uid?: number;
  keyId?: number;
  credentialHint?: string;
  batteryLevel?: number;
  rawData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AccessEventSchema = new Schema<IAccessEvent>(
  {
    eventKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    source: {
      type: String,
      enum: Object.values(AccessEventSource),
      default: AccessEventSource.TTLOCK_LOG,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
      index: true,
    },
    lockId: {
      type: Schema.Types.ObjectId,
      ref: 'Lock',
      required: true,
      index: true,
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
    },
    visitId: {
      type: Schema.Types.ObjectId,
      ref: 'Visit',
    },
    lockKeyId: {
      type: Schema.Types.ObjectId,
      ref: 'LockKey',
    },
    syncedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    eventType: {
      type: String,
      enum: Object.values(AccessEventType),
      required: true,
    },
    eventResult: {
      type: String,
      enum: Object.values(AccessEventResult),
      required: true,
    },
    credentialType: {
      type: String,
      enum: Object.values(AccessCredentialType),
      default: AccessCredentialType.UNKNOWN,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
    recordId: Number,
    recordType: Number,
    uid: Number,
    keyId: Number,
    credentialHint: String,
    batteryLevel: Number,
    rawData: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

AccessEventSchema.index({ spaceId: 1, occurredAt: -1 });
AccessEventSchema.index({ personId: 1, occurredAt: -1 });
AccessEventSchema.index({ lockId: 1, occurredAt: -1 });
AccessEventSchema.index({ eventType: 1, eventResult: 1, occurredAt: -1 });
AccessEventSchema.index({ credentialType: 1, occurredAt: -1 });

export const AccessEvent = mongoose.model<IAccessEvent>('AccessEvent', AccessEventSchema);
