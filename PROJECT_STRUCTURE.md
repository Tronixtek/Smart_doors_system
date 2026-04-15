# Hotel Management System - Recommended Project Structure

## Multi-Repository Strategy (Monorepo vs Polyrepo)

### **Recommended: Monorepo** ✅
Using a monorepo with workspaces for better code sharing and consistency.

```
hotel-management-system/
├── packages/
│   ├── backend/              # NestJS backend API
│   ├── admin-web/            # React admin panel
│   ├── public-web/           # Next.js public website
│   ├── mobile/               # React Native mobile app
│   ├── shared/               # Shared TypeScript types, utils
│   └── database/             # Database migrations, seeds
├── infrastructure/           # Docker, K8s configs
├── docs/                     # Documentation
└── tools/                    # Scripts, dev tools
```

---

## Detailed Structure

### Root Level
```
hotel-management-system/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── deploy.yml
├── packages/
│   ├── backend/
│   ├── admin-web/
│   ├── public-web/
│   ├── mobile/
│   ├── shared/
│   └── database/
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.admin
│   │   └── Dockerfile.public
│   ├── kubernetes/
│   │   ├── backend-deployment.yml
│   │   ├── postgres-statefulset.yml
│   │   ├── redis-deployment.yml
│   │   └── ingress.yml
│   └── terraform/           # Infrastructure as Code
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── USER_GUIDE.md
├── scripts/
│   ├── setup-dev.sh
│   ├── migrate-db.sh
│   └── seed-data.sh
├── .gitignore
├── .npmrc
├── package.json             # Root package.json (workspaces)
├── tsconfig.json            # Base TypeScript config
├── .eslintrc.js             # Shared ESLint config
├── .prettierrc              # Shared Prettier config
└── README.md
```

---

## Backend Structure (NestJS)

```
packages/backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── config/                      # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── ttlock.config.ts
│   ├── common/                      # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── modules/
│   │   ├── auth/                    # Authentication & Authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── users/                   # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── properties/              # Property/Hotel management
│   │   │   ├── properties.module.ts
│   │   │   ├── properties.controller.ts
│   │   │   ├── properties.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── property.entity.ts
│   │   │   │   ├── room.entity.ts
│   │   │   │   └── room-type.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── reservations/            # Booking & Reservations
│   │   │   ├── reservations.module.ts
│   │   │   ├── reservations.controller.ts
│   │   │   ├── reservations.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── reservation.entity.ts
│   │   │   │   └── reservation-room.entity.ts
│   │   │   ├── dto/
│   │   │   └── events/             # Event handlers
│   │   │
│   │   ├── guests/                  # Guest management
│   │   │   ├── guests.module.ts
│   │   │   ├── guests.controller.ts
│   │   │   ├── guests.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── guest.entity.ts
│   │   │   │   └── guest-document.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── front-desk/              # Check-in/Check-out
│   │   │   ├── front-desk.module.ts
│   │   │   ├── front-desk.controller.ts
│   │   │   ├── front-desk.service.ts
│   │   │   └── dto/
│   │   │       ├── check-in.dto.ts
│   │   │       └── check-out.dto.ts
│   │   │
│   │   ├── access-control/          # TTLock integration
│   │   │   ├── access-control.module.ts
│   │   │   ├── access-control.controller.ts
│   │   │   ├── access-control.service.ts
│   │   │   ├── ttlock/
│   │   │   │   ├── ttlock.service.ts
│   │   │   │   ├── ttlock-gateway.service.ts
│   │   │   │   └── ttlock-api.client.ts
│   │   │   ├── entities/
│   │   │   │   ├── door-lock.entity.ts
│   │   │   │   ├── access-key.entity.ts
│   │   │   │   └── access-log.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── billing/                 # Billing & Invoicing
│   │   │   ├── billing.module.ts
│   │   │   ├── billing.controller.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── folio.entity.ts
│   │   │   │   ├── transaction.entity.ts
│   │   │   │   ├── payment.entity.ts
│   │   │   │   └── invoice.entity.ts
│   │   │   ├── dto/
│   │   │   └── payment-gateways/
│   │   │       ├── stripe.service.ts
│   │   │       └── paypal.service.ts
│   │   │
│   │   ├── restaurant/              # Restaurant & Bar
│   │   │   ├── restaurant.module.ts
│   │   │   ├── restaurant.controller.ts
│   │   │   ├── restaurant.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── table.entity.ts
│   │   │   │   ├── menu-item.entity.ts
│   │   │   │   ├── order.entity.ts
│   │   │   │   └── order-item.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── housekeeping/            # Housekeeping
│   │   │   ├── housekeeping.module.ts
│   │   │   ├── housekeeping.controller.ts
│   │   │   ├── housekeeping.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── cleaning-task.entity.ts
│   │   │   │   ├── room-status.entity.ts
│   │   │   │   └── maintenance-request.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── crm/                     # Customer Relationship Management
│   │   │   ├── crm.module.ts
│   │   │   ├── crm.controller.ts
│   │   │   ├── crm.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── loyalty-program.entity.ts
│   │   │   │   ├── guest-preference.entity.ts
│   │   │   │   └── communication-log.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── cms/                     # Content Management
│   │   │   ├── cms.module.ts
│   │   │   ├── cms.controller.ts
│   │   │   ├── cms.service.ts
│   │   │   └── schemas/            # MongoDB schemas
│   │   │       ├── page.schema.ts
│   │   │       └── content.schema.ts
│   │   │
│   │   ├── analytics/               # Reporting & Analytics
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── reports/
│   │   │       ├── occupancy.report.ts
│   │   │       ├── revenue.report.ts
│   │   │       └── financial.report.ts
│   │   │
│   │   ├── notifications/           # Email, SMS, Push
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── email/
│   │   │   │   ├── email.service.ts
│   │   │   │   └── templates/
│   │   │   ├── sms/
│   │   │   │   └── sms.service.ts
│   │   │   └── push/
│   │   │       └── push.service.ts
│   │   │
│   │   ├── integrations/            # External integrations
│   │   │   ├── channel-manager/
│   │   │   ├── accounting/
│   │   │   └── ota/
│   │   │
│   │   └── websockets/              # Real-time updates
│   │       ├── websockets.gateway.ts
│   │       └── events/
│   │
│   ├── database/                    # Database related
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── factories/
│   │
│   └── shared/                      # Shared across modules
│       ├── interfaces/
│       ├── types/
│       ├── constants/
│       └── enums/
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.development
├── .env.production
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## Admin Web Structure (React)

```
packages/admin-web/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── index.tsx                    # App entry
│   ├── App.tsx                      # Root component
│   ├── routes.tsx                   # Route definitions
│   ├── api/                         # API client
│   │   ├── api.client.ts
│   │   ├── auth.api.ts
│   │   ├── reservations.api.ts
│   │   └── ...
│   ├── components/                  # Reusable components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Table/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── widgets/
│   │       ├── OccupancyChart.tsx
│   │       └── RevenueChart.tsx
│   ├── pages/                       # Page components
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── FrontDesk/
│   │   │   ├── CheckIn.tsx
│   │   │   ├── CheckOut.tsx
│   │   │   └── Reservations.tsx
│   │   ├── Rooms/
│   │   │   ├── RoomList.tsx
│   │   │   └── RoomStatus.tsx
│   │   ├── Guests/
│   │   │   ├── GuestList.tsx
│   │   │   └── GuestProfile.tsx
│   │   ├── Billing/
│   │   │   ├── Invoices.tsx
│   │   │   └── Payments.tsx
│   │   ├── Restaurant/
│   │   │   ├── Orders.tsx
│   │   │   └── Menu.tsx
│   │   ├── Housekeeping/
│   │   │   ├── Tasks.tsx
│   │   │   └── RoomStatus.tsx
│   │   ├── AccessControl/
│   │   │   ├── Locks.tsx
│   │   │   └── AccessLogs.tsx
│   │   ├── Reports/
│   │   │   └── Reports.tsx
│   │   └── Settings/
│   │       └── Settings.tsx
│   ├── store/                       # Redux store
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── auth.slice.ts
│   │   │   ├── reservations.slice.ts
│   │   │   └── ...
│   │   └── hooks.ts
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useReservations.ts
│   │   └── ...
│   ├── utils/                       # Utilities
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/                       # TypeScript types
│   │   └── index.ts
│   └── styles/                      # Global styles
│       ├── theme.ts
│       └── global.css
├── .env.development
├── .env.production
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Public Web Structure (Next.js)

```
packages/public-web/
├── public/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                         # Next.js 13+ App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Home page
│   │   ├── rooms/
│   │   │   └── page.tsx
│   │   ├── booking/
│   │   │   └── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── api/                    # API routes
│   │       └── booking/
│   │           └── route.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── BookingWidget.tsx
│   │   └── RoomCard.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Mobile App Structure (React Native)

```
packages/mobile/
├── android/                         # Android native code
├── ios/                            # iOS native code
├── src/
│   ├── App.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ReservationsScreen.tsx
│   │   ├── RoomKeyScreen.tsx      # Digital room key
│   │   ├── ServicesScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── RoomKey.tsx
│   │   └── ServiceCard.tsx
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── ttlock.service.ts      # TTLock integration
│   │   └── storage.service.ts
│   ├── store/
│   │   └── redux setup
│   ├── utils/
│   └── types/
├── package.json
└── tsconfig.json
```

---

## Shared Package Structure

```
packages/shared/
├── src/
│   ├── types/                       # Shared TypeScript types
│   │   ├── user.types.ts
│   │   ├── reservation.types.ts
│   │   ├── room.types.ts
│   │   └── index.ts
│   ├── constants/                   # Shared constants
│   │   ├── roles.ts
│   │   ├── statuses.ts
│   │   └── index.ts
│   ├── utils/                       # Shared utilities
│   │   ├── date.utils.ts
│   │   ├── validation.utils.ts
│   │   └── index.ts
│   └── enums/                       # Shared enums
│       ├── payment.enum.ts
│       └── index.ts
├── package.json
└── tsconfig.json
```

---

## Database Package Structure

```
packages/database/
├── migrations/
│   ├── 001_create_users_table.sql
│   ├── 002_create_properties_table.sql
│   ├── 003_create_rooms_table.sql
│   └── ...
├── seeds/
│   ├── dev/
│   │   ├── users.seed.ts
│   │   └── properties.seed.ts
│   └── production/
│       └── initial.seed.ts
├── schema/
│   └── schema.sql                   # Full schema doc
├── scripts/
│   ├── migrate.ts
│   └── seed.ts
└── package.json
```

---

## Environment Variables Structure

### Backend `.env`
```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_management
DB_USER=postgres
DB_PASSWORD=your_password

# MongoDB
MONGO_URI=mongodb://localhost:27017/hotel_cms

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# TTLock
TTLOCK_CLIENT_ID=your_client_id
TTLOCK_CLIENT_SECRET=your_client_secret
TTLOCK_API_URL=https://euapi.ttlock.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password

# SMS
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=hotel-uploads

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

---

## Docker Compose Structure

```yaml
# infrastructure/docker/docker-compose.yml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: ../../packages/backend
      dockerfile: ../../infrastructure/docker/Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ../../packages/backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      - mongodb

  # PostgreSQL
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hotel_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # MongoDB
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Admin Panel
  admin-web:
    build:
      context: ../../packages/admin-web
      dockerfile: ../../infrastructure/docker/Dockerfile.admin
    ports:
      - "3001:3000"
    volumes:
      - ../../packages/admin-web:/app
      - /app/node_modules
    depends_on:
      - backend

  # Public Website
  public-web:
    build:
      context: ../../packages/public-web
      dockerfile: ../../infrastructure/docker/Dockerfile.public
    ports:
      - "3002:3000"
    volumes:
      - ../../packages/public-web:/app
      - /app/node_modules
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - admin-web
      - public-web

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

---

## Summary

This structure provides:
✅ **Separation of concerns** - Each package has specific responsibility  
✅ **Code reusability** - Shared package for common code  
✅ **Scalability** - Easy to extract services to microservices  
✅ **Maintainability** - Clear organization, easy to navigate  
✅ **Type safety** - TypeScript across all packages  
✅ **Developer experience** - Monorepo with workspaces, shared configs  
✅ **DevOps ready** - Docker, K8s configs included  

**Next:** Choose to implement this structure and start with MVP modules?
