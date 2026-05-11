import mongoose, { Document, Schema } from 'mongoose';

export enum PersonType {
  EMPLOYEE = 'EMPLOYEE',
  VISITOR = 'VISITOR',
  CONTRACTOR = 'CONTRACTOR',
  SECURITY = 'SECURITY',
  FACILITY_ADMIN = 'FACILITY_ADMIN',
}

export enum PersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export interface IPerson extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  personType: PersonType;
  status: PersonStatus;
  employeeId?: string;
  company?: string;
  department?: string;
  title?: string;
  hostUserId?: mongoose.Types.ObjectId;
  identityDocument?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema = new Schema<IPerson>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    personType: {
      type: String,
      enum: Object.values(PersonType),
      default: PersonType.EMPLOYEE,
    },
    status: {
      type: String,
      enum: Object.values(PersonStatus),
      default: PersonStatus.ACTIVE,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    company: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    identityDocument: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

PersonSchema.index({ personType: 1, status: 1 });
PersonSchema.index({ department: 1 });
PersonSchema.index({ company: 1 });
PersonSchema.index({ lastName: 1, firstName: 1 });

export const Person = mongoose.model<IPerson>('Person', PersonSchema);
