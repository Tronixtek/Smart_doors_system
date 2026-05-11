import mongoose, { Document, Schema } from 'mongoose';

export enum FolioStatus {
  OPEN = 'OPEN',
  SETTLED = 'SETTLED',
  CLOSED = 'CLOSED',
}

export enum ChargeCategory {
  ROOM = 'ROOM',
  RESTAURANT = 'RESTAURANT',
  BAR = 'BAR',
  LAUNDRY = 'LAUNDRY',
  MINIBAR = 'MINIBAR',
  DAMAGE = 'DAMAGE',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}

export enum ChargeStatus {
  POSTED = 'POSTED',
  VOIDED = 'VOIDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  RECORDED = 'RECORDED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
}

export interface IFolioCharge {
  description: string;
  category: ChargeCategory;
  source: string;
  quantity: number;
  amount: number;
  total: number;
  notes?: string;
  externalRef?: string;
  postedAt: Date;
  postedBy?: mongoose.Types.ObjectId;
  status: ChargeStatus;
}

export interface IFolioPayment {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedAt: Date;
  recordedBy?: mongoose.Types.ObjectId;
  status: PaymentStatus;
}

export interface IBillingFolio extends Document {
  reservationId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  guestName: string;
  status: FolioStatus;
  openedAt: Date;
  closedAt?: Date;
  charges: IFolioCharge[];
  payments: IFolioPayment[];
  totals: {
    chargeTotal: number;
    paymentTotal: number;
    balanceDue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FolioChargeSchema = new Schema<IFolioCharge>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ChargeCategory),
      default: ChargeCategory.OTHER,
    },
    source: {
      type: String,
      default: 'MANUAL',
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    externalRef: {
      type: String,
      trim: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(ChargeStatus),
      default: ChargeStatus.POSTED,
    },
  },
  { _id: true }
);

const FolioPaymentSchema = new Schema<IFolioPayment>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
    },
    reference: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.RECORDED,
    },
  },
  { _id: true }
);

const BillingFolioSchema = new Schema<IBillingFolio>(
  {
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(FolioStatus),
      default: FolioStatus.OPEN,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
    charges: {
      type: [FolioChargeSchema],
      default: [],
    },
    payments: {
      type: [FolioPaymentSchema],
      default: [],
    },
    totals: {
      chargeTotal: {
        type: Number,
        default: 0,
      },
      paymentTotal: {
        type: Number,
        default: 0,
      },
      balanceDue: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

BillingFolioSchema.pre('validate', function () {
  const chargeTotal = (this.charges || []).reduce((sum, charge) => {
    const quantity = Number(charge.quantity || 1);
    const amount = Number(charge.amount || 0);
    const total = charge.status === ChargeStatus.VOIDED ? 0 : Number(charge.total || quantity * amount);
    charge.total = total;
    return sum + total;
  }, 0);

  const paymentTotal = (this.payments || []).reduce((sum, payment) => {
    if (payment.status === PaymentStatus.VOIDED || payment.status === PaymentStatus.REFUNDED) {
      return sum;
    }
    return sum + Number(payment.amount || 0);
  }, 0);

  this.totals = {
    chargeTotal,
    paymentTotal,
    balanceDue: chargeTotal - paymentTotal,
  };

  if (this.status === FolioStatus.CLOSED && !this.closedAt) {
    this.closedAt = new Date();
  }

  if (this.status !== FolioStatus.CLOSED) {
    this.closedAt = undefined;
  }
});

BillingFolioSchema.index({ reservationId: 1, status: 1 });
BillingFolioSchema.index({ roomId: 1, status: 1 });
BillingFolioSchema.index({ status: 1, openedAt: -1 });

export const BillingFolio = mongoose.model<IBillingFolio>('BillingFolio', BillingFolioSchema);
