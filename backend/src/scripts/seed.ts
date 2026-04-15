import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Room, Reservation, UserRole, UserStatus, RoomType, RoomStatus, ReservationStatus } from '../models';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/hotel_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Room.deleteMany({});
    await Reservation.deleteMany({});

    // Create Users
    console.log('👤 Creating users...');
    
    const users = await User.insertMany([
      {
        email: 'admin@hotel.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phoneNumber: '+1-555-0001',
      },
      {
        email: 'frontdesk@hotel.com',
        password: await bcrypt.hash('staff123', 10),
        firstName: 'Front Desk',
        lastName: 'Staff',
        role: UserRole.FRONT_DESK,
        status: UserStatus.ACTIVE,
        phoneNumber: '+1-555-0002',
      },
      {
        email: 'manager@hotel.com',
        password: await bcrypt.hash('staff123', 10),
        firstName: 'Hotel',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        phoneNumber: '+1-555-0003',
      },
      {
        email: 'housekeeping@hotel.com',
        password: await bcrypt.hash('staff123', 10),
        firstName: 'Housekeeping',
        lastName: 'Staff',
        role: UserRole.HOUSEKEEPING,
        status: UserStatus.ACTIVE,
        phoneNumber: '+1-555-0004',
      },
    ]);
    console.log(`✓ Created ${users.length} users`);

    // Create Rooms
    console.log('🚪 Creating rooms...');
    
    const rooms = [];
    
    // Floor 1: Standard Rooms (101-110)
    for (let i = 101; i <= 110; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 1,
        roomType: RoomType.STANDARD,
        status: RoomStatus.AVAILABLE,
        basePrice: 99.99,
        maxOccupancy: 2,
        hasBalcony: false,
        hasKitchen: false,
        isSmoking: false,
      });
    }

    // Floor 2: Deluxe Rooms (201-210)
    for (let i = 201; i <= 210; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 2,
        roomType: RoomType.DELUXE,
        status: RoomStatus.AVAILABLE,
        basePrice: 149.99,
        maxOccupancy: 3,
        hasBalcony: true,
        hasKitchen: false,
        isSmoking: i % 5 === 0,
      });
    }

    // Floor 3: Suites (301-305)
    for (let i = 301; i <= 305; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 3,
        roomType: RoomType.SUITE,
        status: RoomStatus.AVAILABLE,
        basePrice: 249.99,
        maxOccupancy: 4,
        hasBalcony: true,
        hasKitchen: true,
        isSmoking: false,
      });
    }

    // Floor 3: Executive Suites (306-308)
    for (let i = 306; i <= 308; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 3,
        roomType: RoomType.EXECUTIVE,
        status: RoomStatus.AVAILABLE,
        basePrice: 349.99,
        maxOccupancy: 4,
        hasBalcony: true,
        hasKitchen: true,
        isSmoking: false,
      });
    }

    // Floor 4: Presidential Suite
    rooms.push({
      roomNumber: '401',
      floor: 4,
      roomType: RoomType.PRESIDENTIAL,
      status: RoomStatus.AVAILABLE,
      basePrice: 599.99,
      maxOccupancy: 6,
      hasBalcony: true,
      hasKitchen: true,
      isSmoking: false,
    });

    const createdRooms = await Room.insertMany(rooms);
    console.log(`✓ Created ${createdRooms.length} rooms`);

    // Create Sample Reservations
    console.log('📅 Creating sample reservations...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);

    const checkOutDate = new Date(tomorrow);
    checkOutDate.setDate(checkOutDate.getDate() + 3);
    checkOutDate.setHours(11, 0, 0, 0);

    const room101 = await Room.findOne({ roomNumber: '101' });
    const room201 = await Room.findOne({ roomNumber: '201' });

    const reservations = [];
    
    if (room101) {
      reservations.push({
        guestName: 'John Doe',
        guestEmail: 'john.doe@email.com',
        guestPhone: '+1-555-1001',
        guestIdNumber: 'DL12345678',
        numberOfGuests: 2,
        roomId: room101._id,
        checkInDate: tomorrow,
        checkOutDate: checkOutDate,
        status: ReservationStatus.CONFIRMED,
        totalAmount: 299.97,
        paidAmount: 100.00,
        specialRequests: 'Late check-in requested',
      });
    }

    if (room201) {
      reservations.push({
        guestName: 'Jane Smith',
        guestEmail: 'jane.smith@email.com',
        guestPhone: '+1-555-1002',
        numberOfGuests: 1,
        roomId: room201._id,
        checkInDate: tomorrow,
        checkOutDate: checkOutDate,
        status: ReservationStatus.PENDING,
        totalAmount: 449.97,
        paidAmount: 0,
      });
    }

    const createdReservations = await Reservation.insertMany(reservations);
    console.log(`✓ Created ${createdReservations.length} reservations`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Default Credentials:');
    console.log('   Admin:        admin@hotel.com / admin123');
    console.log('   Front Desk:   frontdesk@hotel.com / staff123');
    console.log('   Manager:      manager@hotel.com / staff123');
    console.log('   Housekeeping: housekeeping@hotel.com / staff123');
    console.log('\n📊 Created:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${createdRooms.length} rooms`);
    console.log(`   - ${createdReservations.length} reservations`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
