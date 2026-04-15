# MERN+ Hotel Management System - Implementation Guide

## Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MERN+ Stack                          │
├─────────────────────────────────────────────────────────┤
│  MongoDB      - CMS, logs, analytics, preferences       │
│  Express.js   - REST API framework (TypeScript)         │
│  React        - Admin UI + Public website (Next.js)     │
│  Node.js      - Runtime environment                     │
│  PostgreSQL   - Reservations, billing, users, rooms     │
│  Redis        - Cache, sessions, job queue              │
└─────────────────────────────────────────────────────────┘
```

---

## Database Strategy - Hybrid Approach

### PostgreSQL - Transactional Data (ACID Critical)

**Use For:**
- ✅ User accounts & authentication
- ✅ Properties & rooms (inventory)
- ✅ Reservations (prevent double-booking)
- ✅ Guests & documents
- ✅ Billing & invoicing (financial transactions)
- ✅ Payments & refunds
- ✅ Folios (guest accounts)
- ✅ Door locks & access keys
- ✅ Access control logs (audit trail)
- ✅ Restaurant orders (charge to room)
- ✅ Housekeeping tasks

**Why PostgreSQL:**
- ACID transactions for financial integrity
- Foreign keys enforce referential integrity
- Battle-tested for money/inventory
- Better for complex queries (JOIN operations)
- Row-level locking for concurrency

### MongoDB - Flexible Schema Data

**Use For:**
- ✅ CMS content (pages, blogs, promotions)
- ✅ System logs & events
- ✅ Analytics & metrics
- ✅ Guest preferences & notes (freeform)
- ✅ Email/SMS communication logs
- ✅ Reviews & feedback
- ✅ Multi-language content
- ✅ Notification templates
- ✅ Reports cache

**Why MongoDB:**
- Flexible schema (no migrations for content)
- Better for document-style data
- Faster writes for logs
- Better for hierarchical data
- Easier JSON storage

### Redis - High-Speed Cache & Queue

**Use For:**
- ✅ Session storage
- ✅ Room availability cache
- ✅ Rate limiting
- ✅ Job queues (emails, reports)
- ✅ Real-time data (room status)
- ✅ WebSocket connections
- ✅ Temporary locks (prevent double-booking)

---

## Express.js Backend Structure

### Directory Structure

```
backend/
├── src/
│   ├── server.ts                    # Entry point
│   ├── app.ts                       # Express app config
│   ├── config/                      # Configuration
│   │   ├── database.ts              # PostgreSQL config
│   │   ├── mongodb.ts               # MongoDB config
│   │   ├── redis.ts                 # Redis config
│   │   ├── jwt.ts                   # JWT config
│   │   └── ttlock.ts                # TTLock API config
│   │
│   ├── models/                      # Database models
│   │   ├── postgres/                # Prisma models (auto-generated)
│   │   │   └── schema.prisma
│   │   └── mongodb/                 # Mongoose schemas
│   │       ├── content.model.ts
│   │       ├── log.model.ts
│   │       └── analytics.model.ts
│   │
│   ├── routes/                      # API routes
│   │   ├── index.ts                 # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── properties.routes.ts
│   │   ├── reservations.routes.ts
│   │   ├── guests.routes.ts
│   │   ├── rooms.routes.ts
│   │   ├── billing.routes.ts
│   │   ├── restaurant.routes.ts
│   │   ├── housekeeping.routes.ts
│   │   ├── access-control.routes.ts
│   │   ├── crm.routes.ts
│   │   ├── cms.routes.ts
│   │   └── analytics.routes.ts
│   │
│   ├── controllers/                 # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── properties.controller.ts
│   │   ├── reservations.controller.ts
│   │   ├── guests.controller.ts
│   │   ├── rooms.controller.ts
│   │   ├── billing.controller.ts
│   │   ├── restaurant.controller.ts
│   │   ├── housekeeping.controller.ts
│   │   ├── access-control.controller.ts
│   │   ├── crm.controller.ts
│   │   ├── cms.controller.ts
│   │   └── analytics.controller.ts
│   │
│   ├── services/                    # Business logic
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── properties.service.ts
│   │   ├── reservations.service.ts
│   │   ├── guests.service.ts
│   │   ├── rooms.service.ts
│   │   ├── billing.service.ts
│   │   ├── restaurant.service.ts
│   │   ├── housekeeping.service.ts
│   │   ├── access-control.service.ts
│   │   ├── ttlock/                  # TTLock integration
│   │   │   ├── ttlock.service.ts
│   │   │   ├── gateway.service.ts
│   │   │   └── key-manager.service.ts
│   │   ├── payments/                # Payment integrations
│   │   │   ├── stripe.service.ts
│   │   │   └── paypal.service.ts
│   │   ├── notifications/
│   │   │   ├── email.service.ts
│   │   │   ├── sms.service.ts
│   │   │   └── push.service.ts
│   │   ├── crm.service.ts
│   │   ├── cms.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── validate.middleware.ts   # Request validation
│   │   ├── error.middleware.ts      # Error handling
│   │   ├── logger.middleware.ts     # Logging
│   │   ├── ratelimit.middleware.ts  # Rate limiting
│   │   └── permissions.middleware.ts # RBAC
│   │
│   ├── validators/                  # Request validators (Joi/Zod)
│   │   ├── auth.validator.ts
│   │   ├── reservation.validator.ts
│   │   ├── billing.validator.ts
│   │   └── ...
│   │
│   ├── utils/                       # Utilities
│   │   ├── logger.ts                # Winston logger
│   │   ├── errors.ts                # Custom error classes
│   │   ├── response.ts              # Standard API response
│   │   ├── crypto.ts                # Encryption utilities
│   │   └── helpers.ts               # General helpers
│   │
│   ├── types/                       # TypeScript types
│   │   ├── express.d.ts             # Express type extensions
│   │   ├── auth.types.ts
│   │   ├── reservation.types.ts
│   │   ├── billing.types.ts
│   │   └── index.ts
│   │
│   ├── jobs/                        # Background jobs (BullMQ)
│   │   ├── queues/
│   │   │   ├── email.queue.ts
│   │   │   ├── sms.queue.ts
│   │   │   └── report.queue.ts
│   │   ├── workers/
│   │   │   ├── email.worker.ts
│   │   │   ├── sms.worker.ts
│   │   │   └── report.worker.ts
│   │   └── index.ts
│   │
│   ├── websockets/                  # Socket.io
│   │   ├── socket.ts                # Socket.io setup
│   │   ├── handlers/
│   │   │   ├── room-status.handler.ts
│   │   │   └── notification.handler.ts
│   │   └── middleware/
│   │       └── auth.middleware.ts
│   │
│   └── database/                    # Database utilities
│       ├── prisma.ts                # Prisma client
│       ├── mongoose.ts              # Mongoose connection
│       ├── redis.ts                 # Redis client
│       ├── migrations/              # SQL migrations
│       └── seeders/                 # Seed data
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .env.development
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
├── jest.config.js
└── README.md
```

---

## Key Implementation Files

### 1. Entry Point - `server.ts`

```typescript
import app from './app';
import { logger } from './utils/logger';
import { connectPostgres } from './database/prisma';
import { connectMongoDB } from './database/mongoose';
import { connectRedis } from './database/redis';
import { initSocketIO } from './websockets/socket';
import http from 'http';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to databases
    await connectPostgres();
    logger.info('✅ PostgreSQL connected');
    
    await connectMongoDB();
    logger.info('✅ MongoDB connected');
    
    await connectRedis();
    logger.info('✅ Redis connected');

    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize WebSocket
    initSocketIO(server);
    logger.info('✅ WebSocket initialized');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 2. Express App - `app.ts`

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { rateLimitMiddleware } from './middleware/ratelimit.middleware';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
}));

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Performance middleware
app.use(compression());

// Logging
app.use(loggerMiddleware);

// Rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/v1', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
```

### 3. Routes - `routes/index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import propertiesRoutes from './properties.routes';
import reservationsRoutes from './reservations.routes';
import guestsRoutes from './guests.routes';
import roomsRoutes from './rooms.routes';
import billingRoutes from './billing.routes';
import restaurantRoutes from './restaurant.routes';
import housekeepingRoutes from './housekeeping.routes';
import accessControlRoutes from './access-control.routes';
import crmRoutes from './crm.routes';
import cmsRoutes from './cms.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/properties', propertiesRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/guests', guestsRoutes);
router.use('/rooms', roomsRoutes);
router.use('/billing', billingRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/housekeeping', housekeepingRoutes);
router.use('/access-control', accessControlRoutes);
router.use('/crm', crmRoutes);
router.use('/cms', cmsRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
```

### 4. Example Route - `routes/reservations.routes.ts`

```typescript
import { Router } from 'express';
import { ReservationsController } from '../controllers/reservations.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createReservationSchema, updateReservationSchema } from '../validators/reservation.validator';

const router = Router();
const controller = new ReservationsController();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/reservations
router.get('/', controller.getAll);

// GET /api/v1/reservations/:id
router.get('/:id', controller.getById);

// POST /api/v1/reservations
router.post('/', validateRequest(createReservationSchema), controller.create);

// PUT /api/v1/reservations/:id
router.put('/:id', validateRequest(updateReservationSchema), controller.update);

// DELETE /api/v1/reservations/:id
router.delete('/:id', controller.delete);

// POST /api/v1/reservations/:id/check-in
router.post('/:id/check-in', controller.checkIn);

// POST /api/v1/reservations/:id/check-out
router.post('/:id/check-out', controller.checkOut);

export default router;
```

### 5. Controller - `controllers/reservations.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ReservationsService } from '../services/reservations.service';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../types/express';

export class ReservationsController {
  private service = new ReservationsService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, status, startDate, endDate } = req.query;
      const reservations = await this.service.findAll({
        propertyId: propertyId as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(successResponse('Reservations retrieved', reservations));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reservation = await this.service.findById(id);
      res.json(successResponse('Reservation retrieved', reservation));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const userId = req.user?.id;
      const reservation = await this.service.create(data, userId);
      res.status(201).json(successResponse('Reservation created', reservation));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const reservation = await this.service.update(id, data);
      res.json(successResponse('Reservation updated', reservation));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.json(successResponse('Reservation deleted'));
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const result = await this.service.checkIn(id, userId);
      res.json(successResponse('Check-in successful', result));
    } catch (error) {
      next(error);
    }
  };

  checkOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const result = await this.service.checkOut(id, userId);
      res.json(successResponse('Check-out successful', result));
    } catch (error) {
      next(error);
    }
  };
}
```

### 6. Service - `services/reservations.service.ts`

```typescript
import { prisma } from '../database/prisma';
import { AccessControlService } from './access-control.service';
import { BillingService } from './billing.service';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class ReservationsService {
  private accessControlService = new AccessControlService();
  private billingService = new BillingService();

  async findAll(filters: any) {
    const { propertyId, status, startDate, endDate } = filters;
    
    return await prisma.reservation.findMany({
      where: {
        ...(propertyId && { propertyId }),
        ...(status && { status }),
        ...(startDate && { checkInDate: { gte: new Date(startDate) } }),
        ...(endDate && { checkOutDate: { lte: new Date(endDate) } }),
      },
      include: {
        guest: true,
        rooms: {
          include: {
            room: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'asc',
      },
    });
  }

  async findById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        rooms: {
          include: {
            room: true,
          },
        },
        folio: true,
      },
    });

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    return reservation;
  }

  async create(data: any, userId: string) {
    // Check room availability
    const availability = await this.checkAvailability(
      data.propertyId,
      data.roomIds,
      data.checkInDate,
      data.checkOutDate
    );

    if (!availability.available) {
      throw new BadRequestError('Selected rooms are not available');
    }

    // Create reservation with rooms in transaction
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          propertyId: data.propertyId,
          guestId: data.guestId,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          adults: data.adults,
          children: data.children,
          status: 'CONFIRMED',
          totalAmount: data.totalAmount,
          createdBy: userId,
          rooms: {
            create: data.roomIds.map((roomId: string) => ({
              roomId,
            })),
          },
        },
        include: {
          guest: true,
          rooms: {
            include: {
              room: true,
            },
          },
        },
      });

      // Create folio
      await this.billingService.createFolio(reservation.id, tx);

      return reservation;
    });
  }

  async update(id: string, data: any) {
    const existing = await this.findById(id);

    return await prisma.reservation.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        guest: true,
        rooms: {
          include: {
            room: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const reservation = await this.findById(id);

    if (reservation.status !== 'CANCELLED') {
      throw new BadRequestError('Only cancelled reservations can be deleted');
    }

    await prisma.reservation.delete({
      where: { id },
    });
  }

  async checkIn(reservationId: string, userId: string) {
    const reservation = await this.findById(reservationId);

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestError('Only confirmed reservations can be checked in');
    }

    return await prisma.$transaction(async (tx) => {
      // Update reservation status
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CHECKED_IN',
          actualCheckInDate: new Date(),
        },
      });

      // Generate room keys for all assigned rooms
      for (const reservationRoom of reservation.rooms) {
        await this.accessControlService.generateGuestKey(
          reservationRoom.roomId,
          reservation.guestId,
          reservationId,
          reservation.checkInDate,
          reservation.checkOutDate,
          tx
        );
      }

      return updated;
    });
  }

  async checkOut(reservationId: string, userId: string) {
    const reservation = await this.findById(reservationId);

    if (reservation.status !== 'CHECKED_IN') {
      throw new BadRequestError('Only checked-in guests can be checked out');
    }

    // Check if folio is settled
    const folioBalance = await this.billingService.getFolioBalance(reservationId);
    if (folioBalance > 0) {
      throw new BadRequestError('Please settle the folio before checkout');
    }

    return await prisma.$transaction(async (tx) => {
      // Update reservation status
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CHECKED_OUT',
          actualCheckOutDate: new Date(),
        },
      });

      // Revoke all room keys
      await this.accessControlService.revokeGuestKeys(reservationId, tx);

      // Update room status to dirty
      for (const reservationRoom of reservation.rooms) {
        await tx.room.update({
          where: { id: reservationRoom.roomId },
          data: { status: 'DIRTY' },
        });
      }

      return updated;
    });
  }

  private async checkAvailability(
    propertyId: string,
    roomIds: string[],
    checkIn: Date,
    checkOut: Date
  ) {
    // Check for overlapping reservations
    const conflicts = await prisma.reservation.findMany({
      where: {
        propertyId,
        rooms: {
          some: {
            roomId: { in: roomIds },
          },
        },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [
          {
            AND: [
              { checkInDate: { lte: checkIn } },
              { checkOutDate: { gt: checkIn } },
            ],
          },
          {
            AND: [
              { checkInDate: { lt: checkOut } },
              { checkOutDate: { gte: checkOut } },
            ],
          },
          {
            AND: [
              { checkInDate: { gte: checkIn } },
              { checkOutDate: { lte: checkOut } },
            ],
          },
        ],
      },
    });

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }
}
```

### 7. Prisma Schema - `models/postgres/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  firstName     String
  lastName      String
  role          Role     @default(STAFF)
  propertyId    String?
  property      Property? @relation(fields: [propertyId], references: [id])
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("users")
}

enum Role {
  ADMIN
  MANAGER
  FRONT_DESK
  HOUSEKEEPING
  RESTAURANT
  MAINTENANCE
  STAFF
}

model Property {
  id            String   @id @default(uuid())
  name          String
  address       String
  city          String
  country       String
  phone         String
  email         String
  rooms         Room[]
  users         User[]
  reservations  Reservation[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("properties")
}

model Room {
  id            String   @id @default(uuid())
  propertyId    String
  property      Property @relation(fields: [propertyId], references: [id])
  roomNumber    String
  roomTypeId    String
  roomType      RoomType @relation(fields: [roomTypeId], references: [id])
  floor         Int
  status        RoomStatus @default(CLEAN)
  lockId        String?  @unique
  lock          DoorLock? @relation(fields: [lockId], references: [id])
  reservations  ReservationRoom[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([propertyId, roomNumber])
  @@map("rooms")
}

enum RoomStatus {
  CLEAN
  DIRTY
  INSPECTED
  OUT_OF_ORDER
  OCCUPIED
}

model RoomType {
  id            String   @id @default(uuid())
  name          String
  description   String?
  maxOccupancy  Int
  baseRate      Decimal  @db.Decimal(10, 2)
  rooms         Room[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("room_types")
}

model Guest {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  email         String?
  phone         String
  documentType  String?
  documentNumber String?
  nationality   String?
  dateOfBirth   DateTime?
  reservations  Reservation[]
  accessKeys    AccessKey[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("guests")
}

model Reservation {
  id                String   @id @default(uuid())
  propertyId        String
  property          Property @relation(fields: [propertyId], references: [id])
  guestId           String
  guest             Guest    @relation(fields: [guestId], references: [id])
  checkInDate       DateTime
  checkOutDate      DateTime
  actualCheckInDate DateTime?
  actualCheckOutDate DateTime?
  adults            Int
  children          Int      @default(0)
  status            ReservationStatus @default(CONFIRMED)
  totalAmount       Decimal  @db.Decimal(10, 2)
  rooms             ReservationRoom[]
  folio             Folio?
  accessKeys        AccessKey[]
  createdBy         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("reservations")
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

model ReservationRoom {
  id            String   @id @default(uuid())
  reservationId String
  reservation   Reservation @relation(fields: [reservationId], references: [id])
  roomId        String
  room          Room     @relation(fields: [roomId], references: [id])
  rate          Decimal  @db.Decimal(10, 2)
  createdAt     DateTime @default(now())

  @@unique([reservationId, roomId])
  @@map("reservation_rooms")
}

model DoorLock {
  id            String   @id @default(uuid())
  lockMac       String   @unique
  lockData      String   @db.Text
  lockVersion   String
  lockName      String
  batteryLevel  Int?
  lastSync      DateTime?
  status        LockStatus @default(ACTIVE)
  room          Room?
  accessKeys    AccessKey[]
  accessLogs    AccessLog[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("door_locks")
}

enum LockStatus {
  ACTIVE
  OFFLINE
  MAINTENANCE
  DEACTIVATED
}

model AccessKey {
  id            String   @id @default(uuid())
  lockId        String
  lock          DoorLock @relation(fields: [lockId], references: [id])
  guestId       String
  guest         Guest    @relation(fields: [guestId], references: [id])
  reservationId String
  reservation   Reservation @relation(fields: [reservationId], references: [id])
  keyType       KeyType
  keyData       String   @db.Text
  validFrom     DateTime
  validUntil    DateTime
  revoked       Boolean  @default(false)
  revokedAt     DateTime?
  createdAt     DateTime @default(now())

  @@map("access_keys")
}

enum KeyType {
  GUEST
  STAFF
  TEMPORARY
  MASTER
}

model AccessLog {
  id            String   @id @default(uuid())
  lockId        String
  lock          DoorLock @relation(fields: [lockId], references: [id])
  userId        String?
  action        AccessAction
  success       Boolean
  method        String
  timestamp     DateTime @default(now())

  @@map("access_logs")
}

enum AccessAction {
  UNLOCK
  LOCK
  DENIED
}

model Folio {
  id            String   @id @default(uuid())
  reservationId String   @unique
  reservation   Reservation @relation(fields: [reservationId], references: [id])
  balance       Decimal  @db.Decimal(10, 2) @default(0)
  status        FolioStatus @default(OPEN)
  transactions  Transaction[]
  payments      Payment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("folios")
}

enum FolioStatus {
  OPEN
  CLOSED
}

model Transaction {
  id            String   @id @default(uuid())
  folioId       String
  folio         Folio    @relation(fields: [folioId], references: [id])
  type          TransactionType
  description   String
  amount        Decimal  @db.Decimal(10, 2)
  quantity      Int      @default(1)
  createdBy     String
  createdAt     DateTime @default(now())

  @@map("transactions")
}

enum TransactionType {
  ROOM_CHARGE
  RESTAURANT
  BAR
  SERVICE
  TAX
  OTHER
}

model Payment {
  id            String   @id @default(uuid())
  folioId       String
  folio         Folio    @relation(fields: [folioId], references: [id])
  amount        Decimal  @db.Decimal(10, 2)
  method        PaymentMethod
  reference     String?
  status        PaymentStatus @default(PENDING)
  processedBy   String
  createdAt     DateTime @default(now())

  @@map("payments")
}

enum PaymentMethod {
  CASH
  CARD
  BANK_TRANSFER
  MOBILE_PAYMENT
  OTHER
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

### 8. Mongoose Schema Example - `models/mongodb/content.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  title: string;
  slug: string;
  content: any;
  type: 'page' | 'blog' | 'promotion';
  status: 'draft' | 'published' | 'archived';
  language: string;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
  };
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: Schema.Types.Mixed, required: true },
    type: { type: String, enum: ['page', 'blog', 'promotion'], required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    language: { type: String, default: 'en' },
    metadata: {
      description: String,
      keywords: [String],
      author: String,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

ContentSchema.index({ slug: 1, language: 1 }, { unique: true });
ContentSchema.index({ type: 1, status: 1 });

export const Content = mongoose.model<IContent>('Content', ContentSchema);
```

---

## Package.json

```json
{
  "name": "hotel-management-backend",
  "version": "1.0.0",
  "description": "MERN+ Hotel Management System Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "@prisma/client": "^5.9.0",
    "express": "^4.18.2",
    "mongoose": "^8.1.0",
    "ioredis": "^5.3.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.12.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "dotenv": "^16.4.1",
    "socket.io": "^4.6.1",
    "bullmq": "^5.1.9",
    "axios": "^1.6.5",
    "stripe": "^14.13.0",
    "nodemailer": "^6.9.8",
    "twilio": "^4.20.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/cookie-parser": "^1.4.6",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "nodemon": "^3.0.3",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "prisma": "^5.9.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1"
  }
}
```

---

## Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/hotel_management?schema=public"

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hotel_cms

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# TTLock API
TTLOCK_CLIENT_ID=your_ttlock_client_id
TTLOCK_CLIENT_SECRET=your_ttlock_client_secret
TTLOCK_API_URL=https://euapi.ttlock.com

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

---

## Docker Setup

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hotel_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7-alpine
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/hotel_management
      MONGODB_URI: mongodb://mongodb:27017/hotel_cms
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - mongodb
      - redis
    volumes:
      - ./src:/app/src
      - ./uploads:/app/uploads

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

---

## Development Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone <your-repo>
cd hotel-management-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configurations

# Start databases (Docker)
docker-compose up -d postgres mongodb redis

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

### 2. Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production
npm start

# Database migrations
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Prisma Studio (GUI)
npx prisma studio

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

## API Response Format

```typescript
// Success response
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error response
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "details": { ... }
}
```

---

## Next Steps

1. **Initialize project structure**
2. **Setup databases (PostgreSQL, MongoDB, Redis)**
3. **Implement authentication module**
4. **Build core modules** (Properties, Rooms, Reservations)
5. **Integrate TTLock API**
6. **Implement billing system**
7. **Add real-time features** (Socket.io)
8. **Write tests**
9. **Deploy to staging**

**Ready to start implementation?**
