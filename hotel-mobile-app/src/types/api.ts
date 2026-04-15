// API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'ADMIN' | 'MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'RECEPTION';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  failedLoginAttempts?: number;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string;
  confirmationNumber?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdNumber?: string;
  roomId: string | null;
  roomNumber?: string;
  roomType?: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
  numberOfGuests: number;
  specialRequests?: string;
  totalAmount: number;
  paidAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber?: string;
  address?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'OUT_OF_SERVICE';
  basePrice: number;
  hasBalcony: boolean;
  hasKitchen: boolean;
  isSmoking: boolean;
  maxOccupancy: number;
  lockMac?: string;
  lockData?: string;
  lockBattery?: number;
  currentReservation?: Reservation | null;
  ttlockId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  reservationId: string;
  roomId: string;
  actualCheckInTime: string;
  guestIdVerified: boolean;
  depositAmount?: number;
}

export interface CheckOutRequest {
  reservationId: string;
  actualCheckOutTime: string;
  finalCharges?: number;
  paymentMethod?: string;
  roomCondition?: string;
}

export interface TTLockKey {
  id: string;
  lockId: string;
  passcode: string;
  startDate: number;
  endDate: number;
  keyType: 'permanent' | 'temporary' | 'single_use';
  status: 'active' | 'expired' | 'revoked';
}

export interface Lock {
  id: string;
  lockMac: string;
  lockName: string;
  lockData: string;
  lockVersion: string;
  roomId: string | Room;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'LOW_BATTERY';
  batteryLevel?: number;
  lastConnected?: string;
  features?: {
    supportsPasscode: boolean;
    supportsCard: boolean;
    supportsFingerprint: boolean;
    supportsRemoteUnlock: boolean;
  };
  metadata?: {
    firmwareVersion?: string;
    hardwareVersion?: string;
    installDate?: string;
    lastMaintenance?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LockKey {
  id: string;
  lockId: string | Lock;
  roomId: string | Room;
  reservationId: string | Reservation;
  guestName: string;
  keyType: 'PASSCODE' | 'CARD' | 'FINGERPRINT' | 'EKEY';
  keyIdentifier: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';
  createdBy: string | User;
  revokedAt?: string;
  revokedBy?: string | User;
  metadata?: {
    passcode?: string;
    cardNumber?: string;
    fingerprintNumber?: string;
    deliveryMethod?: string;
    deliveredAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LockStats {
  totalLocks: number;
  activeLocks: number;
  maintenanceLocks: number;
  lowBatteryLocks: number;
  avgBatteryLevel: number;
}

export interface LockKeyStats {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  revokedKeys: number;
  keysByType: {
    PASSCODE: number;
    CARD: number;
    FINGERPRINT: number;
    EKEY: number;
  };
}

export interface HousekeepingTask {
  id: string;
  roomId: Room | string;
  assignedTo?: User | string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  taskType: 'CHECKOUT_CLEAN' | 'DAILY_CLEAN' | 'DEEP_CLEAN';
  notes?: string;
  completionNotes?: string;
  estimatedDuration?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceTask {
  id: string;
  roomId: Room | string;
  assignedTo?: User | string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  issueType: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'FURNITURE' | 'APPLIANCES' | 'STRUCTURAL' | 'GENERAL';
  description: string;
  resolutionNotes?: string;
  reportedBy?: User | string;
  scheduledDate?: string;
  estimatedDuration: number;
  actualDuration?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeSpace {
  id: string;
  name: string;
  code: string;
  site: string;
  floor: number;
  type:
    | 'WORKSTATION'
    | 'PRIVATE_OFFICE'
    | 'MEETING_ROOM'
    | 'EXECUTIVE_OFFICE'
    | 'LAB'
    | 'STORAGE'
    | 'COMMON_AREA'
    | 'SERVER_ROOM'
    | 'PARKING'
    | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RESTRICTED';
  capacity: number;
  department?: string;
  description?: string;
  linkedLockId?: Lock | string;
  features?: {
    requiresBooking: boolean;
    supportsVisitors: boolean;
    hasLock: boolean;
    isShared: boolean;
  };
  metadata?: {
    accessNotes?: string;
    timezone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OfficePerson {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  personType: 'EMPLOYEE' | 'VISITOR' | 'CONTRACTOR' | 'SECURITY' | 'FACILITY_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  employeeId?: string;
  company?: string;
  department?: string;
  title?: string;
  hostUserId?: User | string;
  identityDocument?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OfficeVisit {
  id: string;
  personId: OfficePerson | string;
  spaceId: OfficeSpace | string;
  hostUserId?: User | string;
  title: string;
  purpose:
    | 'MEETING'
    | 'DELIVERY'
    | 'INTERVIEW'
    | 'MAINTENANCE'
    | 'CONTRACTOR_WORK'
    | 'OFFICE_ACCESS'
    | 'EVENT'
    | 'OTHER';
  startAt: string;
  endAt: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'EXPIRED';
  visitorCount: number;
  credentialRequested: boolean;
  credentialType?: 'PASSCODE' | 'CARD' | 'FINGERPRINT' | 'EKEY';
  issuedCredentialIds?: LockKey[] | string[];
  checkedInAt?: string;
  checkedOutAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
