# Phase 1 Implementation Plan - Hotel Management System MVP

## 🎯 Goal: Core Operations Without Payment Processing

**Timeline:** 2-3 months  
**Team Size:** 3-4 developers  
**Deliverable:** Functional hotel management system with manual billing

---

## What We're Building (Phase 1)

### ✅ Modules Included:

1. **Authentication & User Management**
   - Login/logout
   - Role-based access (Admin, Manager, Front Desk, Housekeeping, Guest)
   - User CRUD operations
   - Password reset

2. **Property & Room Management**
   - Properties (multi-property ready)
   - Room types (Standard, Deluxe, Suite, etc.)
   - Rooms with status tracking
   - Room rates (simple pricing, no dynamic pricing yet)
   - Amenities

3. **Guest Management**
   - Guest profiles (name, contact, documents)
   - Guest history
   - Guest search
   - Document uploads (ID, passport)

4. **Reservation System**
   - Create reservation
   - Check availability (prevent double-booking)
   - Room assignment
   - Reservation search & filters
   - Modify/cancel reservations
   - Walk-in handling

5. **Front Desk Operations**
   - Check-in (generate access keys)
   - Check-out (revoke keys, close reservation)
   - Room status view (occupied, vacant, dirty)
   - Arrival/departure list

6. **TTLock Access Control**
   - Door lock registration
   - Auto-generate guest keys on check-in
   - Auto-revoke keys on check-out
   - Staff master keys
   - Temporary housekeeping keys
   - Access log viewing

7. **Simple Folio System** (No Payment Processing)
   - Create folio on check-in
   - Add charges (room, restaurant, services)
   - View balance
   - Print folio
   - **Manual settlement** - Mark as "Paid by Cash/Card" (no actual payment processing)

8. **Basic Admin Panel** (React)
   - Dashboard (occupancy, arrivals, departures)
   - All CRUD interfaces
   - Reports (simple lists, exports)

### ❌ What's NOT in Phase 1:

- ❌ Automated payment processing (Stripe, PayPal)
- ❌ Online booking from website
- ❌ Guest mobile app
- ❌ Advanced CRM (loyalty, marketing)
- ❌ Channel manager integrations
- ❌ Dynamic pricing
- ❌ Advanced analytics
- ❌ Restaurant POS (just manual charges)

---

## Database Schema (Phase 1)

### PostgreSQL Tables:

```sql
-- Users & Auth
users
roles
permissions
user_roles
sessions

-- Property Management
properties
room_types
rooms
amenities
room_amenities

-- Guest Management
guests
guest_documents

-- Reservations
reservations
reservation_rooms
reservation_status_history

-- Access Control (TTLock)
door_locks
access_keys
access_logs

-- Simple Billing (No Payment Processing)
folios
folio_charges
charge_categories

-- System
audit_logs
settings
```

### Simplified Folio Schema:

```sql
CREATE TABLE folios (
  id UUID PRIMARY KEY,
  reservation_id UUID UNIQUE REFERENCES reservations(id),
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20), -- OPEN, SETTLED_CASH, SETTLED_CARD, PENDING
  settlement_notes TEXT, -- "Paid by cash", "Paid by Visa card ending 1234"
  settled_by UUID REFERENCES users(id),
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE folio_charges (
  id UUID PRIMARY KEY,
  folio_id UUID REFERENCES folios(id),
  category VARCHAR(50), -- ROOM, RESTAURANT, BAR, SERVICE, OTHER
  description VARCHAR(255),
  amount DECIMAL(10,2),
  quantity INT DEFAULT 1,
  total DECIMAL(10,2), -- amount * quantity
  charged_by UUID REFERENCES users(id),
  charged_at TIMESTAMP DEFAULT NOW()
);
```

**Key Point:** No payment tables, transaction processing, or gateway integration. Just tracking what was charged and marking as "settled" manually.

---

## API Endpoints (Phase 1)

### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

### Users
```
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
PUT    /api/v1/users/:id/password
```

### Properties
```
GET    /api/v1/properties
GET    /api/v1/properties/:id
POST   /api/v1/properties
PUT    /api/v1/properties/:id
DELETE /api/v1/properties/:id
```

### Rooms
```
GET    /api/v1/rooms
GET    /api/v1/rooms/:id
POST   /api/v1/rooms
PUT    /api/v1/rooms/:id
DELETE /api/v1/rooms/:id
PATCH  /api/v1/rooms/:id/status
GET    /api/v1/rooms/availability
```

### Guests
```
GET    /api/v1/guests
GET    /api/v1/guests/:id
POST   /api/v1/guests
PUT    /api/v1/guests/:id
DELETE /api/v1/guests/:id
GET    /api/v1/guests/:id/history
POST   /api/v1/guests/:id/documents
```

### Reservations
```
GET    /api/v1/reservations
GET    /api/v1/reservations/:id
POST   /api/v1/reservations
PUT    /api/v1/reservations/:id
DELETE /api/v1/reservations/:id
POST   /api/v1/reservations/check-availability
GET    /api/v1/reservations/arrivals
GET    /api/v1/reservations/departures
```

### Front Desk
```
POST   /api/v1/front-desk/check-in/:reservationId
POST   /api/v1/front-desk/check-out/:reservationId
GET    /api/v1/front-desk/room-status
GET    /api/v1/front-desk/dashboard
```

### Access Control (TTLock)
```
GET    /api/v1/locks
POST   /api/v1/locks
GET    /api/v1/locks/:id
PUT    /api/v1/locks/:id
DELETE /api/v1/locks/:id
GET    /api/v1/locks/:id/keys
POST   /api/v1/locks/:id/keys/generate
POST   /api/v1/locks/:id/keys/revoke
GET    /api/v1/locks/:id/access-logs
```

### Folios (Simple - No Payment)
```
GET    /api/v1/folios/:reservationId
POST   /api/v1/folios/:reservationId/charges
DELETE /api/v1/folios/charges/:chargeId
POST   /api/v1/folios/:reservationId/settle-manual
GET    /api/v1/folios/:reservationId/print
```

---

## Frontend Structure (Phase 1)

### Admin Panel Pages:

```
/login
/dashboard
/properties
  /properties/list
  /properties/create
  /properties/:id/edit
  /properties/:id/rooms
/rooms
  /rooms/list
  /rooms/create
  /rooms/:id/edit
  /rooms/status-board
/guests
  /guests/list
  /guests/create
  /guests/:id/profile
  /guests/:id/history
/reservations
  /reservations/list
  /reservations/create
  /reservations/:id/details
  /reservations/:id/edit
/front-desk
  /front-desk/dashboard
  /front-desk/arrivals
  /front-desk/departures
  /front-desk/in-house
  /front-desk/check-in/:id
  /front-desk/check-out/:id
/access-control
  /access-control/locks
  /access-control/keys
  /access-control/logs
/folios
  /folios/:reservationId
/users
  /users/list
  /users/create
  /users/:id/edit
/settings
```

---

## Development Workflow (Phase 1)

### Week 1-2: Project Setup
- ✅ Initialize monorepo structure
- ✅ Setup Express.js + TypeScript backend
- ✅ Setup PostgreSQL + Prisma
- ✅ Setup Redis for sessions
- ✅ Setup React admin panel with routing
- ✅ Configure Docker Compose for development
- ✅ Setup ESLint, Prettier, Git hooks

### Week 3-4: Authentication & Users
- ✅ User model and database schema
- ✅ JWT authentication
- ✅ Login/logout APIs
- ✅ Role-based access control (RBAC)
- ✅ User CRUD operations
- ✅ Login page (React)
- ✅ Protected routes
- ✅ User management UI

### Week 5-6: Properties & Rooms
- ✅ Property model and APIs
- ✅ Room types model and APIs
- ✅ Rooms model with status
- ✅ Property management UI
- ✅ Room management UI
- ✅ Room status board UI

### Week 7-8: Guests & Reservations
- ✅ Guest model and APIs
- ✅ Reservation model with availability check
- ✅ Guest CRUD UI
- ✅ Reservation creation wizard
- ✅ Reservation list and search
- ✅ Availability calendar

### Week 9-10: TTLock Integration
- ✅ TTLock API client
- ✅ Door lock model and APIs
- ✅ Access key generation logic
- ✅ Access log tracking
- ✅ Lock management UI
- ✅ Test with actual TTLock gateway/devices

### Week 11-12: Front Desk & Folios
- ✅ Check-in flow (create folio, generate key)
- ✅ Check-out flow (settle folio, revoke key)
- ✅ Simple folio with charges
- ✅ Manual settlement (no payment gateway)
- ✅ Front desk dashboard
- ✅ Folio UI and printing

### Week 13-14: Polish & Testing
- ✅ Dashboard with stats
- ✅ Reports (occupancy, revenue)
- ✅ Data export (CSV, PDF)
- ✅ Error handling and validation
- ✅ Unit tests for critical paths
- ✅ Integration testing
- ✅ User acceptance testing (UAT)
- ✅ Bug fixes

### Week 15-16: Deployment & Training
- ✅ Production deployment (AWS/Azure)
- ✅ Database migration to production
- ✅ SSL certificates
- ✅ Monitoring setup
- ✅ User documentation
- ✅ Staff training
- ✅ Go live! 🚀

---

## MVP Features Breakdown

### 1. Manual Billing Workflow (No Payment Gateway)

**Check-in Process:**
```
1. Front desk searches/creates guest
2. Assigns room to reservation
3. Clicks "Check In"
4. System:
   - Creates folio
   - Adds room charge for stay duration
   - Generates TTLock key
   - Changes room status to OCCUPIED
5. Guest receives key (mobile app or physical card)
```

**During Stay:**
```
1. Guest uses services (restaurant, bar, spa)
2. Staff posts charges to folio
   - "Restaurant - Dinner: $50"
   - "Bar - Drinks: $25"
3. Folio balance updates automatically
```

**Check-out Process:**
```
1. Front desk clicks "Check Out"
2. System shows folio with all charges
3. Guest reviews charges
4. Front desk selects payment method:
   - "Cash"
   - "Credit Card"
   - "Bank Transfer"
   - "Corporate Account"
5. Front desk manually processes payment outside system
6. Front desk marks folio as "SETTLED_CASH" or "SETTLED_CARD"
7. Adds note: "Paid by Visa ending 1234"
8. System:
   - Revokes TTLock key
   - Changes room status to DIRTY
   - Closes reservation
   - Prints receipt
```

**Key Point:** No actual payment processing, just manual recording of payment receipt.

---

## Technical Decisions for Phase 1

### Keep It Simple - Avoid Over-Engineering:

#### ✅ Do This:
- Simple Express.js controllers/services pattern
- Prisma ORM for PostgreSQL
- Basic JWT auth (no OAuth yet)
- Simple role checking (no complex permissions)
- Direct API calls (no message queues)
- Manual charges (no automated billing)
- Basic React components (no complex state management yet)
- Simple CSS/Tailwind (no design system yet)

#### ❌ Don't Do This (Save for Later):
- ❌ Microservices (use modular monolith)
- ❌ Complex state management (Redux can wait)
- ❌ GraphQL (REST is fine for MVP)
- ❌ Message queues (BullMQ later)
- ❌ Advanced caching strategies
- ❌ Elasticsearch (PostgreSQL full-text search is enough)
- ❌ WebSockets (polling is fine for MVP)
- ❌ Mobile apps (web-only for now)

### Database Strategy:

**Phase 1: MongoDB Only (Pure MERN)**
- Use MongoDB for everything
- Simpler to manage one database
- No Docker required - local MongoDB installation
- MongoDB Atlas free tier for production

```
MongoDB: Users, Properties, Rooms, Guests, Reservations, Locks, Folios, Sessions
Redis: Not needed (use MongoDB for sessions)
PostgreSQL: Not needed
```

**MongoDB Transaction Support:**
- Use sessions for multi-document transactions
- Critical operations (check-in, check-out, billing) wrapped in transactions
- Ensures data consistency without PostgreSQL

---

## Minimum Viable Features

### What "Good Enough" Looks Like:

**Reservations:**
- ✅ Create, view, edit, cancel
- ✅ Prevent double-booking
- ❌ No automated emails yet (manual notification)
- ❌ No online booking (walk-in or phone only)

**Room Management:**
- ✅ Add/edit rooms
- ✅ Set rates
- ✅ Track status (clean, dirty, occupied)
- ❌ No dynamic pricing
- ❌ No automated status updates

**TTLock:**
- ✅ Generate keys on check-in
- ✅ Revoke on check-out
- ✅ View access logs
- ❌ No mobile app yet (use TTLock app or physical cards)
- ❌ No remote unlock from admin panel

**Billing:**
- ✅ Add charges to folio
- ✅ Calculate totals
- ✅ Manual settlement
- ✅ Print folio
- ❌ No payment gateway
- ❌ No invoicing
- ❌ No refunds

**Reports:**
- ✅ Occupancy list
- ✅ Revenue summary (manual settlements)
- ✅ Guest list
- ✅ Export CSV
- ❌ No advanced analytics
- ❌ No charts/graphs (just tables)

---

## Success Criteria for Phase 1

### Ready for Production When:

1. ✅ Hotel can manage all reservations
2. ✅ Front desk can check in/out guests
3. ✅ Room keys generate automatically via TTLock
4. ✅ Staff can track room status
5. ✅ Charges can be posted to guest folios
6. ✅ Folios can be settled manually
7. ✅ System is stable (no crashes)
8. ✅ Data is secure (auth, validation)
9. ✅ Basic reports available
10. ✅ Staff trained and comfortable

### Can Go Live If:
- 1-2 hotels willing to pilot
- Staff can handle manual payment recording
- Physical key cards available as backup
- IT support available for issues

---

## What Happens After Phase 1?

### Immediate Next Steps (Phase 2):
1. Add housekeeping module (room cleaning tasks)
2. Add basic restaurant POS (menu, orders, post to room)
3. Improve reporting and analytics
4. Add real-time room status updates
5. Build staff mobile app

### Then Phase 4 (Billing):
1. Integrate payment gateway (Stripe)
2. Automated payment processing
3. Online payments
4. Invoice generation
5. Refund processing
6. PCI compliance

---

## Risk Mitigation

### What Could Go Wrong:

| Risk | Mitigation |
|------|------------|
| TTLock gateway fails | Have physical key cards as backup |
| Manual billing errors | Double-check before settling, audit logs |
| Double-booking | Robust availability check, database constraints |
| Staff resistance | Training, gradual rollout, simple UI |
| Data loss | Daily backups, transaction logging |
| Performance issues | Database indexes, simple queries for MVP |

---

## Development Resources Needed

### Team:
- 1 Backend Developer (Express.js, PostgreSQL)
- 1 Frontend Developer (React)
- 1 Full-stack Developer (can do both)
- 1 Part-time DevOps (deployment, monitoring)

### Tools & Services:
- GitHub (code repository)
- AWS/DigitalOcean (hosting - ~$100-200/month)
- PostgreSQL (RDS or managed)
- Redis (ElastiCache or managed)
- Cloudflare (CDN, SSL)
- Sentry (error tracking)
- Postman (API testing)

### Estimated Costs (3 months):
- Development team: $30k-60k (depending on location/rates)
- Infrastructure: $300-600
- Tools/services: $100-300
- **Total: $30k-61k**

---

## Ready to Start?

### Next Immediate Actions:

1. ✅ **Approve this plan**
2. ✅ **Initialize project structure** (I can do this now)
3. ✅ **Setup development environment** (Docker, databases)
4. ✅ **Start Week 1: Project scaffolding**

**Should I initialize the project structure now?** I can create:
- Backend folder with Express.js + TypeScript setup
- Frontend folder with React + Vite
- Docker Compose for databases
- Prisma schema scaffold
- Basic authentication module

Just say "yes" and I'll get started! 🚀
