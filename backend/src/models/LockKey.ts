import mongoose, { Document, Schema } from 'mongoose';

export enum LockKeyType {
  PASSCODE = 'PASSCODE',
  CARD = 'CARD',
  FINGERPRINT = 'FINGERPRINT',
  EKEY = 'EKEY' // Electronic key for app
}

export enum LockKeyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING' // Not yet delivered to lock
}

export interface ILockKey extends Document {
  lockId: mongoose.Types.ObjectId; // Reference to Lock
  roomId?: mongoose.Types.ObjectId; // Reference to Room
  reservationId?: mongoose.Types.ObjectId; // Reference to Reservation
  spaceId?: mongoose.Types.ObjectId; // Reference to Office Space
  visitId?: mongoose.Types.ObjectId; // Reference to Office Visit
  guestName: string;
  keyType: LockKeyType;
  keyIdentifier: string; // PasscodNumber, card number, fingerprint ID, or eKey ID
  startDate: Date;
  endDate: Date;
  status: LockKeyStatus;
  createdBy: mongoose.Types.ObjectId; // User who created (staff)
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  metadata?: {
    passcode?: string; // Store the actual passcode (encrypted in production)
    cardNumber?: string;
    fingerprintNumber?: string;
    deliveryMethod?: string; // 'SMS', 'EMAIL', 'IN_PERSON', etc.
    deliveredAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LockKeySchema = new Schema<ILockKey>(
  {
    lockId: {
      type: Schema.Types.ObjectId,
      ref: 'Lock',
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Space',
    },
    visitId: {
      type: Schema.Types.ObjectId,
      ref: 'Visit',
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    keyType: {
      type: String,
      enum: Object.values(LockKeyType),
      required: true,
    },
    keyIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LockKeyStatus),
      default: LockKeyStatus.PENDING,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revokedAt: Date,
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      passcode: String,
      cardNumber: String,
      fingerprintNumber: String,
      deliveryMethod: String,
      deliveredAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LockKeySchema.index({ lockId: 1 });
LockKeySchema.index({ roomId: 1 });
LockKeySchema.index({ reservationId: 1 });
LockKeySchema.index({ spaceId: 1 });
LockKeySchema.index({ visitId: 1 });
LockKeySchema.index({ status: 1 });
LockKeySchema.index({ startDate: 1, endDate: 1 });
LockKeySchema.index({ keyIdentifier: 1 });

// Compound index for finding active keys
LockKeySchema.index({ lockId: 1, status: 1, endDate: 1 });

export const LockKey = mongoose.model<ILockKey>('LockKey', LockKeySchema);
