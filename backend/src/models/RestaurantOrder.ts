import mongoose, { Document, Schema } from 'mongoose';
import { MenuCategory } from './MenuItem';

export enum RestaurantOrderStatus {
  OPEN = 'OPEN',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  SERVED = 'SERVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export interface IRestaurantOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  category: MenuCategory;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface IRestaurantOrder extends Document {
  orderNumber: string;
  tableId?: mongoose.Types.ObjectId;
  reservationId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  folioId?: mongoose.Types.ObjectId;
  guestName?: string;
  status: RestaurantOrderStatus;
  items: IRestaurantOrderItem[];
  subtotal: number;
  serviceCharge: number;
  taxAmount: number;
  totalAmount: number;
  postedToFolio: boolean;
  postedAt?: Date;
  notes?: string;
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantOrderItemSchema = new Schema<IRestaurantOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(MenuCategory),
      default: MenuCategory.OTHER,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const RestaurantOrderSchema = new Schema<IRestaurantOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'RestaurantTable',
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    folioId: {
      type: Schema.Types.ObjectId,
      ref: 'BillingFolio',
    },
    guestName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(RestaurantOrderStatus),
      default: RestaurantOrderStatus.OPEN,
    },
    items: {
      type: [RestaurantOrderItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postedToFolio: {
      type: Boolean,
      default: false,
    },
    postedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

RestaurantOrderSchema.pre('validate', function () {
  const subtotal = (this.items || []).reduce((sum, item) => {
    const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    item.lineTotal = lineTotal;
    return sum + lineTotal;
  }, 0);

  this.subtotal = subtotal;
  this.totalAmount = subtotal + Number(this.serviceCharge || 0) + Number(this.taxAmount || 0);

  if ([RestaurantOrderStatus.CLOSED, RestaurantOrderStatus.CANCELLED].includes(this.status) && !this.closedAt) {
    this.closedAt = new Date();
  }

  if (![RestaurantOrderStatus.CLOSED, RestaurantOrderStatus.CANCELLED].includes(this.status)) {
    this.closedAt = undefined;
  }
});

RestaurantOrderSchema.index({ status: 1, openedAt: -1 });
RestaurantOrderSchema.index({ reservationId: 1, status: 1 });
RestaurantOrderSchema.index({ roomId: 1, status: 1 });

export const RestaurantOrder = mongoose.model<IRestaurantOrder>('RestaurantOrder', RestaurantOrderSchema);
