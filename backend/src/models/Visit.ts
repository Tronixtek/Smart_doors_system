import mongoose, { Document, Schema } from 'mongoose';
import { LockKeyType } from './LockKey';

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum VisitPurpose {
  MEETING = 'MEETING',
  DELIVERY = 'DELIVERY',
  INTERVIEW = 'INTERVIEW',
  MAINTENANCE = 'MAINTENANCE',
  CONTRACTOR_WORK = 'CONTRACTOR_WORK',
  OFFICE_ACCESS = 'OFFICE_ACCESS',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

export interface IVisit extends Document {
  personId: mongoose.Types.ObjectId;
  spaceId: mongoose.Types.ObjectId;
  hostUserId?: mongoose.Types.ObjectId;
  title: string;
  purpose: VisitPurpose;
  startAt: Date;
  endAt: Date;
  status: VisitStatus;
  visitorCount: number;
  credentialRequested: boolean;
  credentialType?: LockKeyType;
  issuedCredentialIds?: mongoose.Types.ObjectId[];
  checkedInAt?: Date;
  checkedOutAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
    },
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: Object.values(VisitPurpose),
      default: VisitPurpose.MEETING,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(VisitStatus),
      default: VisitStatus.SCHEDULED,
    },
    visitorCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    credentialRequested: {
      type: Boolean,
      default: false,
    },
    credentialType: {
      type: String,
      enum: Object.values(LockKeyType),
    },
    issuedCredentialIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'LockKey',
        },
      ],
      default: [],
    },
    checkedInAt: Date,
    checkedOutAt: Date,
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

VisitSchema.index({ personId: 1 });
VisitSchema.index({ spaceId: 1 });
VisitSchema.index({ hostUserId: 1 });
VisitSchema.index({ status: 1, startAt: 1 });
VisitSchema.index({ startAt: 1, endAt: 1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
