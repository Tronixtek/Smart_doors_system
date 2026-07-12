import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessPoint extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'DOOR' | 'GATE' | 'CABINET' | 'LIFT';
}

const AccessPointSchema = new Schema<IAccessPoint>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['DOOR', 'GATE', 'CABINET', 'LIFT'], default: 'DOOR' },
  },
  { timestamps: true }
);

export const AccessPoint = mongoose.model<IAccessPoint>('AccessPoint', AccessPointSchema);
