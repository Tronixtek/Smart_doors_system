import mongoose, { Document, Schema } from 'mongoose';

export enum AccessMethod {
  PASSCODE = 'PASSCODE',
  CARD = 'CARD',
  FINGERPRINT = 'FINGERPRINT',
  APP = 'APP',
  KEY = 'KEY',
  OTHER = 'OTHER'
}

export interface IAccessLog extends Document {
  organizationId: mongoose.Types.ObjectId;
  lockId: mongoose.Types.ObjectId;
  accessPointId: mongoose.Types.ObjectId;
  credentialName: string; // Name of the person/credential used
  method: AccessMethod;
  timestamp: Date;
  success: boolean;
  rawLogData?: string; // Optional original log from SDK
}

const AccessLogSchema = new Schema<IAccessLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    lockId: { type: Schema.Types.ObjectId, ref: 'Lock', required: true },
    accessPointId: { type: Schema.Types.ObjectId, ref: 'AccessPoint', required: true },
    credentialName: { type: String, required: true },
    method: { type: String, enum: Object.values(AccessMethod), required: true },
    timestamp: { type: Date, required: true },
    success: { type: Boolean, default: true },
    rawLogData: { type: String },
  },
  { timestamps: true }
);

// Index for faster queries on specific locks or time ranges
AccessLogSchema.index({ lockId: 1, timestamp: -1 });
AccessLogSchema.index({ organizationId: 1, timestamp: -1 });

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', AccessLogSchema);
