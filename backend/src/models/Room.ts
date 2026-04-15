import mongoose, { Document, Schema } from 'mongoose';

export enum RoomType {
  STANDARD = 'STANDARD',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  EXECUTIVE = 'EXECUTIVE',
  PRESIDENTIAL = 'PRESIDENTIAL',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface IRoom extends Document {
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  status: RoomStatus;
  basePrice: number;
  
  // Features
  hasBalcony: boolean;
  hasKitchen: boolean;
  isSmoking: boolean;
  maxOccupancy: number;
  
  // Smart Lock Integration
  lockMac?: string;
  lockData?: string;
  lockBattery?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: 1,
    },
    roomType: {
      type: String,
      enum: Object.values(RoomType),
      default: RoomType.STANDARD,
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.AVAILABLE,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    hasBalcony: {
      type: Boolean,
      default: false,
    },
    hasKitchen: {
      type: Boolean,
      default: false,
    },
    isSmoking: {
      type: Boolean,
      default: false,
    },
    maxOccupancy: {
      type: Number,
      default: 2,
      min: 1,
    },
    lockMac: {
      type: String,
    },
    lockData: {
      type: String,
    },
    lockBattery: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ roomType: 1 });
RoomSchema.index({ floor: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
