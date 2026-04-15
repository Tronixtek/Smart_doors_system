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
import officeSpaceRoutes from './routes/officeSpaces';
import officePeopleRoutes from './routes/officePeople';
import officeVisitRoutes from './routes/officeVisits';
import { cleanupExpiredTokens } from './utils/jwt';

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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
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
app.use('/api/v1/office/spaces', officeSpaceRoutes);
app.use('/api/v1/office/people', officePeopleRoutes);
app.use('/api/v1/office/visits', officeVisitRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
