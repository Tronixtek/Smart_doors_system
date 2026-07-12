import mongoose, { Document, Schema } from 'mongoose';

export enum LockKeyType {
  PASSCODE = 'PASSCODE',
  CARD = 'CARD',
  FINGERPRINT = 'FINGERPRINT',
  EKEY = 'EKEY'
}

export interface ILockKey extends Document {
  organizationId: mongoose.Types.ObjectId;
  lockId: mongoose.Types.ObjectId;
  name: string;
  keyType: LockKeyType;
  keyIdentifier: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const LockKeySchema = new Schema<ILockKey>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    lockId: { type: Schema.Types.ObjectId, ref: 'Lock', required: true },
    name: { type: String, required: true },
    keyType: { type: String, enum: Object.values(LockKeyType), required: true },
    keyIdentifier: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LockKey = mongoose.model<ILockKey>('LockKey', LockKeySchema);
