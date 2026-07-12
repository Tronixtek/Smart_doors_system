import mongoose, { Document, Schema } from 'mongoose';

export interface ILock extends Document {
  organizationId: mongoose.Types.ObjectId;
  accessPointId: mongoose.Types.ObjectId;
  lockMac: string;
  lockName: string;
  lockData: string;
  lockVersion: string;
  batteryLevel: number;
}

const LockSchema = new Schema<ILock>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    accessPointId: { type: Schema.Types.ObjectId, ref: 'AccessPoint', required: true },
    lockMac: { type: String, required: true, unique: true },
    lockName: { type: String, required: true },
    lockData: { type: String, required: true },
    lockVersion: { type: String, required: true },
    batteryLevel: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export const Lock = mongoose.model<ILock>('Lock', LockSchema);
