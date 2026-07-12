import mongoose, { Document, Schema } from 'mongoose';

export enum OrganizationType {
  HOTEL = 'HOTEL',
  OFFICE = 'OFFICE',
  RESIDENTIAL = 'RESIDENTIAL',
  OTHER = 'OTHER'
}

export interface IOrganization extends Document {
  ownerId?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  type: OrganizationType;
  settings: {
    ttlockClientId?: string;
    ttlockClientSecret?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: Object.values(OrganizationType), default: OrganizationType.OTHER },
    settings: {
      ttlockClientId: String,
      ttlockClientSecret: String,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
