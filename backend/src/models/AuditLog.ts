import mongoose, { Document, Schema } from 'mongoose';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_UPDATED = 'RESERVATION_UPDATED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  ROOM_UPDATED = 'ROOM_UPDATED',
  FOLIO_CREATED = 'FOLIO_CREATED',
  FOLIO_UPDATED = 'FOLIO_UPDATED',
  PAYMENT_RECORDED = 'PAYMENT_RECORDED',
  RESTAURANT_TABLE_UPDATED = 'RESTAURANT_TABLE_UPDATED',
  RESTAURANT_MENU_UPDATED = 'RESTAURANT_MENU_UPDATED',
  RESTAURANT_ORDER_CREATED = 'RESTAURANT_ORDER_CREATED',
  RESTAURANT_ORDER_UPDATED = 'RESTAURANT_ORDER_UPDATED',
  LOCK_INITIALIZED = 'LOCK_INITIALIZED',
  KEY_GENERATED = 'KEY_GENERATED',
  KEY_REVOKED = 'KEY_REVOKED',
  SPACE_CREATED = 'SPACE_CREATED',
  SPACE_UPDATED = 'SPACE_UPDATED',
  SPACE_DELETED = 'SPACE_DELETED',
  PERSON_CREATED = 'PERSON_CREATED',
  PERSON_UPDATED = 'PERSON_UPDATED',
  PERSON_DELETED = 'PERSON_DELETED',
  VISIT_CREATED = 'VISIT_CREATED',
  VISIT_UPDATED = 'VISIT_UPDATED',
  VISIT_CANCELLED = 'VISIT_CANCELLED',
  VISIT_CHECK_IN = 'VISIT_CHECK_IN',
  VISIT_CHECK_OUT = 'VISIT_CHECK_OUT',
}

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: AuditAction;
  resource: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
