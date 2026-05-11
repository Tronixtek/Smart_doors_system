import mongoose, { Document, Schema } from 'mongoose';

export enum RestaurantTableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  DIRTY = 'DIRTY',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface IRestaurantTable extends Document {
  tableNumber: string;
  area: string;
  capacity: number;
  status: RestaurantTableStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantTableSchema = new Schema<IRestaurantTable>(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    area: {
      type: String,
      default: 'Main Dining',
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(RestaurantTableStatus),
      default: RestaurantTableStatus.AVAILABLE,
    },
  },
  {
    timestamps: true,
  }
);

RestaurantTableSchema.index({ status: 1 });

export const RestaurantTable = mongoose.model<IRestaurantTable>('RestaurantTable', RestaurantTableSchema);
