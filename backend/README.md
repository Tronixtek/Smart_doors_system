# Hotel Backend API Server

Enterprise-grade hotel management backend with MongoDB, JWT authentication, and role-based access control.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Seed database:**
   ```bash
   npm run seed
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Server will run on:**
   - `http://localhost:3000`
   - API base: `http://localhost:3000/api/v1`

## Default Credentials

All seeded accounts use the following credentials:

### Admin Account
- Email: `admin@hotel.com`
- Password: `admin123`
- Role: `ADMIN` (Full access)

### Manager Account
- Email: `manager@hotel.com`
- Password: `staff123`
- Role: `MANAGER` (Management operations)

### Front Desk Account
- Email: `frontdesk@hotel.com`
- Password: `staff123`
- Role: `FRONT_DESK` (Guest services)

### Housekeeping Account
- Email: `housekeeping@hotel.com`
- Password: `staff123`
- Role: `HOUSEKEEPING` (Room maintenance)

## Database (MongoDB)

The system uses MongoDB with Mongoose ODM:

### Collections
- **Users** - Staff accounts with roles and security
- **Rooms** - 29 rooms across 4 floors (Standard/Deluxe/Suite/Executive/Presidential)
- **Reservations** - Guest bookings with room assignments
- **RefreshTokens** - JWT refresh token storage
- **AuditLogs** - Security audit trail

### Seeded Data
- 4 staff users with different roles
- 29 rooms (101-110, 201-210, 301-308, 401, 501)
- 2 sample reservations

## API Endpoints

### Authentication (Public)
- `POST /api/v1/auth/login` - Login with email/password → Returns `accessToken` + `refreshToken`
- `POST /api/v1/auth/register` - Register new user → Returns `accessToken` + `refreshToken`
- `POST /api/v1/auth/refresh` - Refresh access token using refresh token (token rotation)
- `POST /api/v1/auth/logout` - Logout and revoke refresh token
- `POST /api/v1/auth/logout-all` - Logout from all devices (requires auth)
- `GET /api/v1/auth/me` - Get current user profile (requires auth)

### Reservations (Requires Auth)
- `GET /api/v1/reservations` - List all reservations (Staff+)
- `GET /api/v1/reservations/today-checkins` - Today's check-ins (Staff+)
- `GET /api/v1/reservations/today-checkouts` - Today's check-outs (Staff+)
- `GET /api/v1/reservations/:id` - Get reservation by ID (Staff+)
- `POST /api/v1/reservations` - Create reservation (Staff+)
- `PATCH /api/v1/reservations/:id` - Update reservation (Staff+)
- `PATCH /api/v1/reservations/:id/cancel` - Cancel reservation (Staff+)

### Rooms (Requires Auth)
- `GET /api/v1/rooms` - List all rooms (Staff+)
- `GET /api/v1/rooms/available` - Available rooms only (Staff+)
- `GET /api/v1/rooms/:id` - Get room by ID (Staff+)
- `POST /api/v1/rooms` - Create new room (Admin/Manager only)
- `PATCH /api/v1/rooms/:id/status` - Update room status (Staff+)
- `PATCH /api/v1/rooms/:id` - Update room details (Admin/Manager only)
- `DELETE /api/v1/rooms/:id` - Delete room (Admin/Manager only)

### Check-In/Check-Out (Requires Auth)
- `POST /api/v1/checkin` - Check in guest (Staff+)
- `POST /api/v1/checkin/checkout` - Check out guest (Staff+)

## Role-Based Access Control (RBAC)

### Roles Hierarchy
1. **ADMIN** - Full system access
2. **MANAGER** - Management operations
3. **FRONT_DESK** - Guest services, reservations
4. **HOUSEKEEPING** - Room status updates

### Permission Middleware
- `verifyToken` - Validates JWT and attaches user to request
- `requireAdmin` - Admin only
- `requireAdminOrManager` - Admin or Manager
- `requireStaff` - Admin, Manager, or Front Desk

### Audit Logging
All protected actions are automatically logged:
- Login/Logout attempts
- Unauthorized access attempts
- Room/reservation CRUD operations
- User management actions
- IP address and timestamp tracking

## Configure Mobile App

Update the API URL in your mobile app:

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. Edit `hotel-mobile-app/src/api/client.ts`:
   ```typescript
   const API_URL = __DEV__ 
     ? 'http://YOUR_IP_ADDRESS:3000/api/v1'  // e.g., http://192.168.1.5:3000/api/v1
     : 'https://api.yourhotel.com/api/v1';
   ```

3. Make sure your phone and computer are on the same WiFi network

## Features

- ✅ MongoDB with Mongoose ODM
- ✅ JWT authentication with refresh tokens
- ✅ Token rotation for enhanced security
- ✅ Role-based access control (RBAC)
- ✅ Security audit logging
- ✅ Account lockout after 5 failed login attempts
- ✅ Password hashing with bcrypt
- ✅ Protected routes with authentication middleware
- ✅ Auto-populated relationships (Room → Reservation)
- ✅ Automatic expired token cleanup (24h cycle)
- ✅ TypeScript support
- ✅ Auto-reload on changes (ts-node-dev)
- ✅ CORS enabled

## Security Features

### Authentication & Tokens
- Passwords hashed with bcrypt (10 rounds)
- **Access tokens** expire after 15 minutes (short-lived)
- **Refresh tokens** expire after 7 days (long-lived, stored in DB)
- **Token rotation**: Old refresh token revoked when new one issued
- Logout support: Single device or all devices
- Account lockout after 5 failed attempts (30 min)
- Failed login tracking
- Last login timestamp
- Automatic cleanup of expired tokens every 24 hours

### Authorization
- Role-based middleware (`requireAdmin`, `requireStaff`, etc.)
- Granular permissions per route
- Unauthorized access logged to audit trail

### Audit Trail
All security events logged to MongoDB:
- User login/logout
- Failed login attempts
- Unauthorized access attempts
- CRUD operations on protected resources
- IP address and user agent tracking

## Production

This backend is production-ready with:
- ✅ MongoDB database with indexes
- ✅ Security middleware and RBAC
- ✅ Audit logging
- ✅ Environment variables

**Before deploying:**
- Change `JWT_SECRET` to a strong random value
- Use MongoDB Atlas or managed database
- Add rate limiting (express-rate-limit)
- Add input validation (express-validator)
- Enable HTTPS
- Add monitoring (Sentry, DataDog)
- Configure backup strategy
