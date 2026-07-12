import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import organizationRoutes from './routes/organization';
import accessPointRoutes from './routes/accessPoints';
import lockRoutes from './routes/locks';
import ratesRoutes from './routes/rates';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mako Access API' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/access-points', accessPointRoutes);
app.use('/api/v1/locks', lockRoutes);
app.use('/api/v1/rates', ratesRoutes);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mako-access')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Mako Access Backend running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
