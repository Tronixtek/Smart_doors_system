import mongoose, { Document, Schema } from 'mongoose';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface IReservation extends Document {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdNumber?: string;
  numberOfGuests: number;
  
  roomId?: mongoose.Types.ObjectId;
  
  checkInDate: Date;
  checkOutDate: Date;
  status: ReservationStatus;
  
  totalAmount: number;
  paidAmount: number;
  
  specialRequests?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    guestEmail: {
      type: String,
      required: [true, 'Guest email is required'],
      trim: true,
      lowercase: true,
    },
    guestPhone: {
      type: String,
      required: [true, 'Guest phone is required'],
      trim: true,
    },
    guestIdNumber: {
      type: String,
      trim: true,
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: 1,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: false,
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.PENDING,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    specialRequests: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReservationSchema.index({ roomId: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ checkInDate: 1 });
ReservationSchema.index({ checkOutDate: 1 });
ReservationSchema.index({ guestEmail: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);
