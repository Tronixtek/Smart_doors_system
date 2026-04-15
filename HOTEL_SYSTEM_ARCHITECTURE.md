# Enterprise Hotel Management System - Architecture Document

## System Overview
**Project:** Comprehensive Hotel Management System with TTLock Integration  
**Scope:** Front Desk, Access Control, CRM, CMS, Billing, Restaurant/Bar, Housekeeping  
**Target:** Enterprise-grade, Multi-property support, High availability

---

## 1. SYSTEM MODULES & FEATURES

### Core Modules
1. **Front Desk Management**
   - Guest check-in/check-out
   - Reservation management (individual, group, corporate)
   - Room assignment & availability
   - Walk-in handling
   - Early check-in/late check-out
   - Guest profile management

2. **Access Control (TTLock Integration)**
   - Dynamic room key generation
   - Check-in auto-key generation
   - Checkout auto-revocation
   - Staff access management (master keys, floor keys)
   - Temporary access for housekeeping
   - Key sharing for multiple guests
   - Remote unlock capability
   - Access logs & audit trails

3. **CRM (Customer Relationship Management)**
   - Guest profiles & preferences
   - Stay history
   - Loyalty programs
   - VIP/Corporate client management
   - Marketing automation
   - Feedback & review management
   - Guest communication (email, SMS, push)

4. **CMS (Content Management System)**
   - Website content management
   - Booking engine integration
   - Multi-language support
   - Room/facility showcase
   - Promotions & packages
   - Blog/news management

5. **Billing & Invoicing**
   - Folio management (guest accounts)
   - Multiple payment methods (card, cash, mobile, crypto)
   - Split billing
   - Credit limit management
   - Tax automation
   - Invoice generation & printing
   - Payment gateway integration
   - Refund processing
   - Financial reporting

6. **Restaurant & Bar Management**
   - Table management & reservations
   - Menu management
   - Order taking (dine-in, room service)
   - Kitchen display system (KDS)
   - Bar inventory
   - Recipe costing
   - POS integration
   - Post to room charges

7. **Housekeeping Management**
   - Room status tracking (clean, dirty, inspected, out-of-order)
   - Task assignment & scheduling
   - Cleaning checklists
   - Lost & found
   - Maintenance requests
   - Inventory management (linens, supplies)
   - Performance tracking

### Supporting Modules
8. **Analytics & Reporting**
   - Occupancy reports
   - Revenue management
   - ADR, RevPAR calculations
   - Forecasting
   - Custom dashboards

9. **Multi-property Management**
   - Centralized control
   - Cross-property reservations
   - Consolidated reporting

10. **Integrations**
    - Channel Manager (OTAs - Booking.com, Expedia, etc.)
    - Payment gateways
    - Accounting software
    - Email/SMS gateways
    - Door lock systems (TTLock)

---

## 2. ARCHITECTURE DECISIONS & TRADE-OFFS

### Architecture Style: **Modular Monolith → Microservices (Hybrid)**

#### Decision Rationale:
| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Monolithic** | Simple deployment, easier development, data consistency | Hard to scale specific modules, technology lock-in | ❌ Not enterprise-grade |
| **Microservices** | Independent scaling, technology flexibility, fault isolation | Complex deployment, distributed data, network overhead | ⚠️ Overkill for initial phase |
| **Modular Monolith** | Easy to start, can extract to microservices later, simpler | Still shares database, scaling limitations | ✅ **START HERE** |
| **Hybrid (Recommended)** | Best of both - core as monolith, specific services separate | Needs careful boundary definition | ✅ **TARGET STATE** |

#### **Recommended Hybrid Approach:**

**Monolith Core:**
- Front Desk Management
- Billing & Invoicing
- Housekeeping
- Restaurant/Bar Management

**Separate Microservices:**
- **Access Control Service** (TTLock) - Needs real-time, high availability
- **Notification Service** (Email/SMS) - High volume, can fail independently
- **Analytics Service** - Resource intensive, separate scaling
- **CMS/Website** - Public-facing, different security posture
- **Payment Processing** - PCI compliance isolation

---

## 3. TECHNOLOGY STACK RECOMMENDATIONS

### Backend Stack Options:

#### **Option A: MERN+ Stack (Hybrid)** ✅ RECOMMENDED FOR YOUR PROJECT
```
Runtime: Node.js (v20 LTS)
Framework: Express.js + TypeScript (with enterprise pattern structure)
Database: PostgreSQL (transactional data) + MongoDB (flexible content)
Cache: Redis (sessions, locks, rate limiting)
Message Queue: BullMQ (Redis-based) or RabbitMQ
Real-time: Socket.io
ORM: Prisma (PostgreSQL) + Mongoose (MongoDB)
Validation: Joi or Zod
```
**Pros:**
- ✅ JavaScript/TypeScript across entire stack
- ✅ Fast development, HUGE ecosystem
- ✅ Excellent real-time support (Socket.io native)
- ✅ Easy developers to find (MERN is popular)
- ✅ Cost-effective (all open source)
- ✅ Flexible (MongoDB) + Reliable (PostgreSQL)
- ✅ TTLock SDK examples exist (react-native)

**Cons:**
- ⚠️ Requires disciplined architecture (no NestJS structure)
- ⚠️ Need to build enterprise patterns manually
- ⚠️ Managing two databases adds complexity

**Why Hybrid DB Strategy:**
- PostgreSQL: Reservations, billing, users, rooms (ACID transactions)
- MongoDB: CMS, logs, analytics, preferences (flexible schema)

#### **Option B: Pure MERN Stack** ⚠️ ACCEPTABLE WITH CAUTIONS
```
Runtime: Node.js (v20 LTS)
Framework: Express.js + TypeScript
Database: MongoDB ONLY (with transactions enabled)
Cache: Redis
ORM: Mongoose
```
**Pros:**
- ✅ True MERN simplicity
- ✅ Single database to manage
- ✅ JSON everywhere
- ✅ Very fast prototyping

**Cons:**
- ❌ MongoDB transactions more complex than PostgreSQL
- ❌ Relational data requires careful modeling
- ❌ Financial data in MongoDB is non-standard (riskier)
- ❌ Harder to enforce data integrity

**Verdict:** CAN work if you're experienced with MongoDB transactions and design schemas carefully for ACID requirements.

#### **Option C: NestJS Ecosystem** (Original Recommendation)
```
Runtime: Node.js (v20 LTS)
Framework: NestJS (enterprise structure, TypeScript, microservices ready)
Database: PostgreSQL (primary) + MongoDB (CMS, logs)
Cache: Redis (sessions, locks, rate limiting)
Message Queue: RabbitMQ or Redis Pub/Sub
Real-time: Socket.io or WebSockets
ORM: Prisma or TypeORM
```
**Pros:**
- ✅ Built-in enterprise architecture (DI, modules, guards)
- ✅ Microservices ready out of box
- ✅ Enforced TypeScript and best practices
- ✅ Excellent documentation
- ✅ Swagger/OpenAPI auto-generation

**Cons:**
- ⚠️ Steeper learning curve than Express
- ⚠️ More opinionated (less flexibility)
- ⚠️ Slightly slower development initially

#### **Option B: Python Ecosystem**
```
Framework: Django or FastAPI
Database: PostgreSQL
Cache: Redis
Celery for background jobs
```
**Pros:**
- Excellent for data analytics
- Great ML libraries (future AI features)
- Django admin panel

**Cons:**
- Slower than Node for I/O
- Less real-time support out of box

#### **Option C: Java/Spring Boot**
```
Framework: Spring Boot
Database: PostgreSQL
Cache: Redis
Message Queue: Kafka
```
**Pros:**
- Enterprise standard
- Excellent scalability
- Strong typing
- TTLock has Android SDK

**Cons:**
- Slower development
- More verbose code
- Higher resource usage

### Frontend Stack:

#### **Web Application (Staff)**
```
Framework: React or Next.js
UI Library: Ant Design Pro / Material-UI (enterprise components)
State Management: Redux Toolkit or Zustand
Real-time: Socket.io client
Build: Vite or Next.js
TypeScript: Mandatory
```

#### **Guest Mobile App**
```
Framework: React Native (reuse TTLock integration)
State: Redux Toolkit
Navigation: React Navigation
```

#### **Staff Mobile App (Optional)**
```
Framework: React Native (shared codebase)
Offline support: WatermelonDB or Realm
```

#### **Public Website**
```
Framework: Next.js (SSR/SSG for SEO)
CMS: Headless CMS (Strapi or Contentful)
Booking Engine: Custom + Payment Gateway
```

---

## 4. DATABASE STRATEGY

### Primary Database: **PostgreSQL** ✅

**Schema Strategy: Hybrid**
- Multi-tenant: Single database, schema per property OR row-level tenant_id
- Shared tables: System config, users, roles
- Isolated tables: Guest data, transactions, reservations

### Database Structure:

```sql
-- Core Schemas
- public (shared system data)
- property_1 (property specific)
- property_2 (property specific)
OR
- All in one schema with property_id column (simpler)
```

### Recommended Tables (Simplified):

**Properties Module:**
- properties
- rooms
- room_types
- room_rates
- amenities

**Reservations Module:**
- reservations
- reservation_rooms
- guests
- guest_documents

**Billing Module:**
- folios
- folio_transactions
- payments
- invoices
- tax_configs

**Access Control Module:**
- door_locks
- access_keys
- access_logs
- key_permissions

**CRM Module:**
- guest_profiles
- loyalty_accounts
- preferences
- communication_logs

**Restaurant Module:**
- tables
- menu_items
- orders
- order_items

**Housekeeping Module:**
- cleaning_tasks
- room_status
- maintenance_requests
- inventory

**System Module:**
- users
- roles
- permissions
- audit_logs

### Secondary Database: **MongoDB**
**Use for:**
- CMS content (flexible schema)
- System logs
- Analytics events
- Guest feedback/reviews

### Cache Layer: **Redis**
**Use for:**
- Session management
- Room availability cache
- Rate limiting
- Real-time room status
- WebSocket connections
- Job queues

---

## 5. TTLOCK INTEGRATION STRATEGY

### Challenge: TTLock is Bluetooth-based, Web is Network-based

### **Solution Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Platform                        │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Backend    │◄────►│  TTLock API  │                │
│  │   Server     │      │   Gateway    │                │
│  └──────────────┘      └──────────────┘                │
└─────────────────────────────────────────────────────────┘
         ▲                        ▲
         │                        │
         │                        │
    ┌────┴────┐              ┌───┴────┐
    │   Web   │              │ Mobile │
    │  Admin  │              │  App   │
    └─────────┘              └────────┘
                                  │ Bluetooth
                                  ▼
                             ┌─────────┐
                             │ TTLock  │
                             │  Door   │
                             └─────────┘
```

### Implementation Options:

#### **Option 1: TTLock Gateway Hardware** ✅ RECOMMENDED
- Install TTLock WiFi Gateway at hotel
- Gateway bridges Bluetooth locks to Internet
- Backend uses TTLock REST API
- **Pros:** Web app can control locks, centralized management
- **Cons:** Additional hardware cost, gateway per property

#### **Option 2: Mobile App as Bridge**
- Staff mobile app with Bluetooth
- App relays lock commands from server
- **Pros:** No hardware needed
- **Cons:** Requires staff phone nearby, unreliable

#### **Option 3: Hybrid Approach** ✅ BEST
- Use Gateway for automated operations (check-in keys)
- Use Mobile app for on-demand (staff access, guest support)
- **Pros:** Reliability + flexibility
- **Cons:** Complex implementation

### TTLock Integration Points:

1. **Check-in Flow:**
   - Guest checks in → System generates access key
   - Key sent to TTLock Gateway → Lock programmed
   - Guest can use mobile app OR physical key card

2. **Check-out Flow:**
   - Guest checks out → Key revoked immediately
   - Lock permissions removed

3. **Housekeeping:**
   - Temporary time-based keys
   - Auto-expire after shift

4. **Staff Access:**
   - Master keys (managers)
   - Floor keys (housekeeping supervisors)
   - Maintenance keys
   - All with audit trails

### Lock Management Database:

```sql
CREATE TABLE door_locks (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL,
  room_id UUID NOT NULL,
  lock_mac VARCHAR(50) UNIQUE NOT NULL,
  lock_data TEXT NOT NULL, -- TTLock initialization data
  lock_version VARCHAR(20),
  lock_name VARCHAR(100),
  battery_level INT,
  last_sync TIMESTAMP,
  status VARCHAR(20), -- active, offline, maintenance
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE access_keys (
  id UUID PRIMARY KEY,
  lock_id UUID REFERENCES door_locks(id),
  guest_id UUID REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  key_type VARCHAR(20), -- guest, staff, temporary, master
  key_data TEXT NOT NULL, -- TTLock key data
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE access_logs (
  id UUID PRIMARY KEY,
  lock_id UUID REFERENCES door_locks(id),
  access_key_id UUID REFERENCES access_keys(id),
  user_id UUID, -- guest or staff
  action VARCHAR(20), -- unlock, lock, denied
  timestamp TIMESTAMP DEFAULT NOW(),
  success BOOLEAN,
  method VARCHAR(20) -- mobile_app, key_card, manual
);
```

---

## 6. SECURITY CONSIDERATIONS

### Authentication & Authorization:

1. **Multi-level Access Control:**
   - Role-based (RBAC): Admin, Manager, Front Desk, Housekeeping, Guest
   - Property-based: Users can access specific properties only
   - Resource-based: Fine-grained permissions

2. **Authentication:**
   - Staff: Email/password + 2FA (mandatory for admin)
   - Guests: Mobile number + OTP OR Email + password
   - JWT tokens with refresh mechanism
   - Session management in Redis

3. **Security Measures:**
   - PCI DSS compliance for payment data
   - Encrypt sensitive data (PII, payment info)
   - Rate limiting on APIs
   - CORS configuration
   - Input validation & sanitization
   - SQL injection prevention (ORM)
   - XSS protection
   - HTTPS only
   - Regular security audits

4. **TTLock Security:**
   - Lock credentials encrypted at rest
   - Keys transmitted over HTTPS
   - Time-limited access
   - Immediate revocation capability
   - Audit logs immutable

### Data Privacy:
- GDPR compliance (data retention, right to erasure)
- Data anonymization for analytics
- Consent management
- Privacy policy integration

---

## 7. SCALABILITY & PERFORMANCE

### Horizontal Scaling Strategy:

1. **Application Layer:**
   - Stateless backend (session in Redis)
   - Load balancer (Nginx or AWS ALB)
   - Auto-scaling based on CPU/memory

2. **Database Layer:**
   - Read replicas for reporting
   - Connection pooling
   - Index optimization
   - Partitioning (by property_id, date)

3. **Caching Strategy:**
   - Redis for hot data (room availability, rates)
   - CDN for static assets
   - API response caching (short TTL)

4. **Message Queue:**
   - Async operations (email, SMS, reports)
   - Event-driven architecture
   - Retry mechanisms

### Performance Optimizations:

- Database query optimization (proper indexes)
- Lazy loading for lists
- Pagination everywhere
- Image optimization (WebP, lazy load)
- Code splitting (frontend)
- API rate limiting
- Background jobs for heavy tasks

---

## 8. DEPLOYMENT STRATEGY

### Recommended: **Cloud-Native (AWS/Azure/GCP)**

#### AWS Architecture:
```
- EC2/ECS/EKS for backend
- RDS PostgreSQL (Multi-AZ)
- DocumentDB for MongoDB
- ElastiCache for Redis
- S3 for file storage
- CloudFront for CDN
- Route 53 for DNS
- Load Balancer
- AutoScaling Groups
- CloudWatch for monitoring
```

#### Docker Containers:
```yaml
Services:
  - backend-api (NestJS)
  - access-control-service
  - notification-service
  - analytics-service
  - cms-frontend (Next.js)
  - admin-panel (React)
  - nginx (reverse proxy)
```

#### CI/CD Pipeline:
```
GitHub/GitLab → CI Tests → Build Docker → Deploy to Staging → Manual approval → Deploy to Production
```

### Development Environments:
- **Local:** Docker Compose
- **Development:** Dedicated server
- **Staging:** Production mirror
- **Production:** High availability setup

---

## 9. MONITORING & OBSERVABILITY

### Tools:
- **Application Monitoring:** New Relic, DataDog, or Sentry
- **Logs:** ELK Stack (Elasticsearch, Logstash, Kibana) or CloudWatch
- **Metrics:** Prometheus + Grafana
- **Uptime:** Pingdom or UptimeRobot
- **Error Tracking:** Sentry

### Key Metrics:
- API response times
- Database query performance
- Lock operation success rate
- Payment success rate
- User session duration
- System uptime (99.9% SLA)

---

## 10. DEVELOPMENT ROADMAP

### Phase 1: Core MVP (2-3 months) 🎯 **START HERE**
**Goal:** Get hotel operations running without payment processing

- ✅ **User Management** - Authentication, roles, permissions
- ✅ **Property & Room Management** - Setup rooms, room types, rates
- ✅ **Guest Management** - Guest profiles, documents, history
- ✅ **Reservation System** - Booking, availability, room assignment
- ✅ **Front Desk Operations** - Check-in/check-out (manual billing)
- ✅ **TTLock Integration** - Auto-generate keys on check-in, revoke on check-out
- ✅ **Basic Admin Panel** - React dashboard for staff
- ✅ **Simple Folio** - Track charges (no payment processing yet)

**Deliverable:** Hotel can manage reservations, guests, and access control

---

### Phase 2: Operations & Staff Tools (2-3 months)
**Goal:** Complete daily operational tools

- ✅ **Housekeeping Module** - Room status, task assignment, cleaning checklists
- ✅ **Restaurant/Bar** - Basic POS, menu, orders, post to room
- ✅ **CRM Basics** - Guest preferences, notes, communication logs
- ✅ **Reporting** - Occupancy, revenue reports, access logs
- ✅ **Staff Mobile App** - Housekeeping tasks, room status updates
- ✅ **Real-time Updates** - WebSocket for room status changes
- ✅ **Multi-property Support** - Manage multiple hotel locations

**Deliverable:** Full operational system for hotel staff

---

### Phase 3: Guest Experience (1-2 months)
**Goal:** Guest-facing features

- ✅ **Guest Mobile App** - Digital room key, services, requests
- ✅ **Public Website** - Next.js site with hotel info
- ✅ **Online Booking Engine** - Direct reservations (no payment yet)
- ✅ **CMS** - Content management for website
- ✅ **Guest Portal** - View reservation, extend stay, request services
- ✅ **Notifications** - Email/SMS confirmations, reminders

**Deliverable:** Complete guest experience (pre-payment)

---

### Phase 4: Financial System (2-3 months) 💰 **BILLING COMES HERE**
**Goal:** Implement complete billing and payment processing

- ✅ **Full Billing System** - Folio management, charges, taxes
- ✅ **Payment Gateway Integration** - Stripe, PayPal, etc.
- ✅ **Invoicing** - Generate, send, print invoices
- ✅ **Split Billing** - Multiple payment methods, partial payments
- ✅ **Refunds** - Process refunds and adjustments
- ✅ **Financial Reporting** - Revenue, taxes, reconciliation
- ✅ **Online Payments** - Guest pay via website/app
- ✅ **Deposit Handling** - Pre-authorization, security deposits
- ✅ **Credit Management** - Credit limits, corporate accounts

**Deliverable:** Complete financial management with PCI compliance

---

### Phase 5: Advanced Integrations (2 months)
**Goal:** External system integrations

- ✅ **Channel Manager** - Sync with Booking.com, Expedia, Airbnb
- ✅ **Accounting Software** - QuickBooks, Xero integration
- ✅ **PMS Bridge** - APIs for third-party integrations
- ✅ **Marketing Automation** - Email campaigns, promotions
- ✅ **Review Management** - Collect and respond to reviews

**Deliverable:** Fully integrated ecosystem

---

### Phase 6: Enterprise & AI Features (Ongoing)
**Goal:** Advanced automation and intelligence

- ✅ **Dynamic Pricing** - AI-powered rate optimization
- ✅ **Predictive Analytics** - Forecast occupancy, revenue
- ✅ **Advanced CRM** - Loyalty programs, personalization
- ✅ **Automated Operations** - Smart task scheduling
- ✅ **White-label** - Multi-tenant with custom branding
- ✅ **Mobile Check-in** - Contactless check-in/out

**Deliverable:** Enterprise-grade intelligent system

---

## Timeline Summary

| Phase | Duration | Cumulative | Can Go Live? |
|-------|----------|------------|--------------|
| Phase 1 (Core MVP) | 2-3 months | 3 months | ✅ Yes (manual billing) |
| Phase 2 (Operations) | 2-3 months | 5-6 months | ✅ Yes (cash/manual payment) |
| Phase 3 (Guest Experience) | 1-2 months | 7-8 months | ✅ Yes (limited) |
| **Phase 4 (Billing)** 💰 | 2-3 months | **9-11 months** | ✅ **Full production** |
| Phase 5 (Integrations) | 2 months | 11-13 months | ✅ Yes (enhanced) |
| Phase 6 (Enterprise) | Ongoing | - | ✅ Yes (premium) |

**Key Insight:** You can go live after Phase 1-2 with manual billing, then add automated payments in Phase 4!

---

## 11. COST CONSIDERATIONS

### Development Costs:
- Team: 4-6 developers (Full-stack, Mobile, DevOps)
- Timeline: 9-12 months to full production
- Ongoing maintenance: 2-3 developers

### Infrastructure Costs (Monthly estimates for medium hotel):
- Cloud hosting: $500-2000
- Database: $200-500
- CDN: $50-200
- Monitoring tools: $100-300
- Email/SMS: $50-200
- Payment gateway fees: Variable (2-3% per transaction)
- TTLock Gateway hardware: One-time $100-300 per gateway

### Revenue Model:
- SaaS subscription (per room/per month)
- Setup fee
- Transaction fees (optional)
- Premium features
- Multi-property discounts

---

## 12. RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| TTLock service downtime | High | Mobile app fallback, physical keys backup |
| Payment gateway failure | High | Multiple payment providers, offline mode |
| Database failure | Critical | Regular backups, read replicas, point-in-time recovery |
| Security breach | Critical | Regular audits, encryption, penetration testing |
| Vendor lock-in | Medium | Abstract lock interface, support multiple lock brands |
| Staff resistance | Medium | Training program, gradual rollout, UX focus |
| Scalability issues | Medium | cloud auto-scaling, performance testing |

---

## FINAL RECOMMENDATION

### **Recommended Tech Stack (Pure MERN - Simplified):**

**Backend:**
- **Express.js** + **TypeScript** (Node.js framework)
- **MongoDB** (all data - with transactions enabled)
- **Mongoose** (ODM for MongoDB)
- ~~Redis~~ **Not required initially** (can use MongoDB for sessions)
- **No Docker** (local MongoDB installation)

**Frontend:**
- **React** (Admin panel with Ant Design or Material-UI)
- **Next.js** (Public website - optional for later)
- **React Native** (Mobile apps - Phase 3)

**Infrastructure:**
- **Local development** (no Docker needed)
- **MongoDB Atlas** (cloud MongoDB for production)
- **AWS** or **Vercel** (deployment later)
- **GitHub** (version control)

**TTLock Integration:**
- **WiFi Gateway** (primary - web control)
- **REST API** integration
- **Mobile app** (backup/manual operations - Phase 3)

### **Why Pure MERN (MongoDB Only):**
✅ **Single database** - Simpler to manage, no multi-DB complexity  
✅ **No Docker required** - Direct local MongoDB installation  
✅ **JavaScript everywhere** - True MERN stack consistency  
✅ **Fast development** - MongoDB flexibility speeds up iterations  
✅ **MongoDB transactions** - Support ACID for critical operations  
✅ **Easy hiring** - Pure MERN developers abundant  
✅ **Lower barrier** - Simpler setup, faster onboarding  
✅ **Cloud-ready** - MongoDB Atlas for production (free tier available)  

### **MongoDB Transaction Support:**
MongoDB 4.0+ supports multi-document ACID transactions, solving the financial integrity concern:
```javascript
// Example: Check-in with transaction
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Reservation.updateOne({_id}, {status: 'CHECKED_IN'}, {session});
  await Folio.create([{reservationId, ...}], {session});
  await AccessKey.create([{lockId, guestId, ...}], {session});
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### **Development Setup (No Docker):**
```bash
# Install MongoDB locally
# Windows: Download from mongodb.com or use:
winget install MongoDB.Server

# Start MongoDB service
net start MongoDB

# Install Node.js (v20 LTS)
# Download from nodejs.org

# Clone and setup project
git clone <repo>
npm install
npm run dev
```  

### **Alternative: Pure MERN (MongoDB Only)**
If you MUST use pure MERN:
- Ensure MongoDB replica set for transactions
- Design schemas carefully for relational data
- Use Mongoose with proper validation
- Implement manual ACID patterns for billing
- **Risk:** Less battle-tested for financial systems

### **Alternative: NestJS (More Enterprise)**
If you want maximum enterprise patterns:
- Use NestJS instead of Express
- Built-in architecture, DI, guards
- Microservices-ready out of box
- **Trade-off:** Steeper learning curve  

---

## NEXT STEPS

1. ✅ Review & approve architecture
2. Setup project repository structure
3. Initialize NestJS backend
4. Setup PostgreSQL schema
5. Implement authentication module
6. Build front desk MVP
7. Integrate TTLock gateway
8. Iterative development following roadmap

---

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Status:** Pending Approval
