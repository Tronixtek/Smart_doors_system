import mongoose, { Document, Schema } from 'mongoose';

export enum LockStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  LOW_BATTERY = 'LOW_BATTERY'
}

export interface ILock extends Document {
  lockMac: string; // MAC address of the lock
  lockName: string; // Friendly name
  lockData: string; // Encrypted lock data from TTLock SDK
  lockVersion: string; // Lock version info from SDK
  roomId: mongoose.Types.ObjectId; // Reference to Room
  status: LockStatus;
  batteryLevel?: number; // 0-100
  lastConnected?: Date;
  features?: {
    supportsPasscode: boolean;
    supportsCard: boolean;
    supportsFingerprint: boolean;
    supportsRemoteUnlock: boolean;
  };
  metadata?: {
    firmwareVersion?: string;
    hardwareVersion?: string;
    installDate?: Date;
    lastMaintenance?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LockSchema = new Schema<ILock>(
  {
    lockMac: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    lockName: {
      type: String,
      required: true,
      trim: true,
    },
    lockData: {
      type: String,
      required: true,
    },
    lockVersion: {
      type: String,
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      unique: true, // One lock per room
    },
    status: {
      type: String,
      enum: Object.values(LockStatus),
      default: LockStatus.ACTIVE,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    lastConnected: {
      type: Date,
    },
    features: {
      supportsPasscode: { type: Boolean, default: true },
      supportsCard: { type: Boolean, default: false },
      supportsFingerprint: { type: Boolean, default: false },
      supportsRemoteUnlock: { type: Boolean, default: true },
    },
    metadata: {
      firmwareVersion: String,
      hardwareVersion: String,
      installDate: Date,
      lastMaintenance: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
LockSchema.index({ status: 1 });

export const Lock = mongoose.model<ILock>('Lock', LockSchema);
