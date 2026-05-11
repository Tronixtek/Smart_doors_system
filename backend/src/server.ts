import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import reservationRoutes from './routes/reservations';
import roomRoutes from './routes/rooms';
import checkinRoutes from './routes/checkin';
import statsRoutes from './routes/stats';
import housekeepingRoutes from './routes/housekeeping';
import maintenanceRoutes from './routes/maintenance';
import staffRoutes from './routes/staff';
import lockRoutes from './routes/locks';
import lockKeyRoutes from './routes/lockKeys';
import billingRoutes from './routes/billing';
import restaurantRoutes from './routes/restaurant';
import officeSpaceRoutes from './routes/officeSpaces';
import officePeopleRoutes from './routes/officePeople';
import officeVisitRoutes from './routes/officeVisits';
import officeAccessEventRoutes from './routes/officeAccessEvents';
import { cleanupExpiredTokens } from './utils/jwt';
import { emitDataSync, initializeRealtime } from './realtime';

dotenv.config();

connectDB();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();
const corsOrigins =
  rawCorsOrigin && rawCorsOrigin !== '*'
    ? rawCorsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : undefined;

const inferRealtimeEntity = (path: string) => {
  if (path.startsWith('/api/v1/office/access-events')) return { domain: 'office' as const, entity: 'access-events' };
  if (path.startsWith('/api/v1/office/visits')) return { domain: 'office' as const, entity: 'visits' };
  if (path.startsWith('/api/v1/office/people')) return { domain: 'office' as const, entity: 'people' };
  if (path.startsWith('/api/v1/office/spaces')) return { domain: 'office' as const, entity: 'spaces' };
  if (path.startsWith('/api/v1/reservations')) return { domain: 'hotel' as const, entity: 'reservations' };
  if (path.startsWith('/api/v1/rooms')) return { domain: 'hotel' as const, entity: 'rooms' };
  if (path.startsWith('/api/v1/staff')) return { domain: 'hotel' as const, entity: 'staff' };
  if (path.startsWith('/api/v1/housekeeping')) return { domain: 'hotel' as const, entity: 'housekeeping' };
  if (path.startsWith('/api/v1/maintenance')) return { domain: 'hotel' as const, entity: 'maintenance' };
  if (path.startsWith('/api/v1/locks') || path.startsWith('/api/v1/lock-keys')) return { domain: 'hotel' as const, entity: 'locks' };
  if (path.startsWith('/api/v1/billing')) return { domain: 'hotel' as const, entity: 'billing' };
  if (path.startsWith('/api/v1/restaurant')) return { domain: 'hotel' as const, entity: 'restaurant' };
  if (path.startsWith('/api/v1/checkin')) return { domain: 'hotel' as const, entity: 'checkin' };
  return null;
};

app.set('trust proxy', 1);
app.use(
  cors(
    corsOrigins
      ? {
          origin: corsOrigins,
        }
      : undefined
  )
);
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use((req, res, next) => {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      return;
    }

    const target = inferRealtimeEntity(req.originalUrl || req.path);
    if (!target) {
      return;
    }

    emitDataSync(target.domain, target.entity, req.method, req.originalUrl || req.path);
  });

  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/checkin', checkinRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/housekeeping', housekeepingRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/locks', lockRoutes);
app.use('/api/v1/lock-keys', lockKeyRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/office/spaces', officeSpaceRoutes);
app.use('/api/v1/office/people', officePeopleRoutes);
app.use('/api/v1/office/visits', officeVisitRoutes);
app.use('/api/v1/office/access-events', officeAccessEventRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('SmartDoor Backend API Server');
  console.log(`Server running on ${PUBLIC_BASE_URL}`);
  console.log(`API base: ${PUBLIC_BASE_URL}/api/v1`);
  console.log('Default credentials: admin@hotel.com / admin123');
  console.log('='.repeat(50));

  cleanupExpiredTokens()
    .then((count) => {
      if (count > 0) {
        console.log(`Cleanup removed ${count} expired refresh tokens`);
      }
    })
    .catch((err) => console.error('Token cleanup error:', err));

  setInterval(async () => {
    try {
      const count = await cleanupExpiredTokens();
      if (count > 0) {
        console.log(`Scheduled cleanup removed ${count} expired refresh tokens`);
      }
    } catch (err) {
      console.error('Scheduled token cleanup error:', err);
    }
  }, 24 * 60 * 60 * 1000);
});

initializeRealtime(server, corsOrigins);

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('SIGINT shutdown error:', error);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('SIGTERM shutdown error:', error);
    process.exit(1);
  });
});
