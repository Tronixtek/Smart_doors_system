import mongoose, { Document, Schema } from 'mongoose';

export enum SpaceType {
  WORKSTATION = 'WORKSTATION',
  PRIVATE_OFFICE = 'PRIVATE_OFFICE',
  MEETING_ROOM = 'MEETING_ROOM',
  EXECUTIVE_OFFICE = 'EXECUTIVE_OFFICE',
  LAB = 'LAB',
  STORAGE = 'STORAGE',
  COMMON_AREA = 'COMMON_AREA',
  SERVER_ROOM = 'SERVER_ROOM',
  PARKING = 'PARKING',
  OTHER = 'OTHER',
}

export enum SpaceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RESTRICTED = 'RESTRICTED',
}

export interface ISpace extends Document {
  name: string;
  code: string;
  site: string;
  floor: number;
  type: SpaceType;
  status: SpaceStatus;
  capacity: number;
  department?: string;
  description?: string;
  linkedLockId?: mongoose.Types.ObjectId;
  features?: {
    requiresBooking: boolean;
    supportsVisitors: boolean;
    hasLock: boolean;
    isShared: boolean;
  };
  metadata?: {
    accessNotes?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    site: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: Object.values(SpaceType),
      default: SpaceType.PRIVATE_OFFICE,
    },
    status: {
      type: String,
      enum: Object.values(SpaceStatus),
      default: SpaceStatus.ACTIVE,
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    department: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    linkedLockId: {
      type: Schema.Types.ObjectId,
      ref: 'Lock',
    },
    features: {
      requiresBooking: { type: Boolean, default: false },
      supportsVisitors: { type: Boolean, default: true },
      hasLock: { type: Boolean, default: true },
      isShared: { type: Boolean, default: false },
    },
    metadata: {
      accessNotes: String,
      timezone: String,
    },
  },
  {
    timestamps: true,
  }
);

SpaceSchema.index({ site: 1, floor: 1 });
SpaceSchema.index({ type: 1, status: 1 });
SpaceSchema.index({ department: 1 });

export const Space = mongoose.model<ISpace>('Space', SpaceSchema);
