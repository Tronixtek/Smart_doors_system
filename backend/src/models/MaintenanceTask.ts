import mongoose, { Schema, Document } from 'mongoose';

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceIssueType {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  FURNITURE = 'FURNITURE',
  APPLIANCES = 'APPLIANCES',
  STRUCTURAL = 'STRUCTURAL',
  GENERAL = 'GENERAL',
}

export interface IMaintenanceTask extends Document {
  roomId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  issueType: MaintenanceIssueType;
  description: string;
  resolutionNotes?: string;
  reportedBy?: mongoose.Types.ObjectId;
  scheduledDate?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceTaskSchema = new Schema<IMaintenanceTask>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.SCHEDULED,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(MaintenancePriority),
      default: MaintenancePriority.NORMAL,
      required: true,
      index: true,
    },
    issueType: {
      type: String,
      enum: Object.values(MaintenanceIssueType),
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    resolutionNotes: {
      type: String,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    scheduledDate: {
      type: Date,
      index: true,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      default: 60,
    },
    actualDuration: {
      type: Number,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
MaintenanceTaskSchema.index({ status: 1, priority: -1, scheduledDate: 1 });
MaintenanceTaskSchema.index({ roomId: 1, status: 1 });
MaintenanceTaskSchema.index({ assignedTo: 1, status: 1 });

export const MaintenanceTask = mongoose.model<IMaintenanceTask>('MaintenanceTask', MaintenanceTaskSchema);
