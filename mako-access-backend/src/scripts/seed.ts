import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Organization } from '../models/Organization';
import { User, UserRole } from '../models/User';
import { AccessPoint } from '../models/AccessPoint';

dotenv.config();

const seed = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mako-access';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data (optional - be careful in production)
    await Organization.deleteMany({});
    await User.deleteMany({});
    await AccessPoint.deleteMany({});

    // 1. Create Organization
    const organization = await Organization.create({
      name: 'Mako Access Demo HQ',
      slug: 'mako-demo',
      settings: {
        ttlockClientId: 'mock_client_id',
        ttlockClientSecret: 'mock_client_secret',
      },
    });
    console.log('Created Organization:', organization.name);

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await User.create({
      organizationId: organization._id,
      email: 'admin@mako.com',
      password: hashedPassword,
      firstName: 'Mako',
      lastName: 'Admin',
      role: UserRole.ORG_ADMIN,
    });
    console.log('Created Admin User: admin@mako.com / password123');

    // 3. Create some Access Points
    const accessPoints = await AccessPoint.create([
      {
        organizationId: organization._id,
        name: 'Main Entrance',
        type: 'DOOR',
        description: 'Primary office entrance',
      },
      {
        organizationId: organization._id,
        name: 'Server Room',
        type: 'DOOR',
        description: 'Restricted area',
      },
      {
        organizationId: organization._id,
        name: 'Parking Gate',
        type: 'GATE',
        description: 'Underground parking entrance',
      }
    ]);
    console.log(`Created ${accessPoints.length} Access Points`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
