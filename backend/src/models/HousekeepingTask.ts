import mongoose, { Document, Schema } from 'mongoose';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export interface IHousekeepingTask extends Document {
  roomId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: 'CHECKOUT_CLEAN' | 'DAILY_CLEAN' | 'DEEP_CLEAN';
  notes?: string;
  completionNotes?: string;
  estimatedDuration?: number; // in minutes
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HousekeepingTaskSchema = new Schema<IHousekeepingTask>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.NORMAL,
    },
    taskType: {
      type: String,
      enum: ['CHECKOUT_CLEAN', 'DAILY_CLEAN', 'DEEP_CLEAN'],
      default: 'CHECKOUT_CLEAN',
    },
    notes: {
      type: String,
    },
    completionNotes: {
      type: String,
    },
    estimatedDuration: {
      type: Number,
      min: 0,
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

// Indexes
HousekeepingTaskSchema.index({ roomId: 1 });
HousekeepingTaskSchema.index({ assignedTo: 1 });
HousekeepingTaskSchema.index({ status: 1 });
HousekeepingTaskSchema.index({ priority: 1 });
HousekeepingTaskSchema.index({ createdAt: -1 });

// Compound indexes for common queries
HousekeepingTaskSchema.index({ status: 1, priority: -1, createdAt: -1 });
HousekeepingTaskSchema.index({ assignedTo: 1, status: 1 });

export const HousekeepingTask = mongoose.model<IHousekeepingTask>('HousekeepingTask', HousekeepingTaskSchema);
