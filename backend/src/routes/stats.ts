import { Router, Request, Response } from 'express';
import { Room, Reservation, RoomStatus, ReservationStatus } from '../models';
import { verifyToken, requireStaff } from '../middleware/auth';

const router = Router();

// All stats routes require authentication
router.use(verifyToken);
router.use(requireStaff);

/**
 * GET /api/v1/stats/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total rooms and status breakdown
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: RoomStatus.OCCUPIED });
    const availableRooms = await Room.countDocuments({ status: RoomStatus.AVAILABLE });
    const maintenanceRooms = await Room.countDocuments({ status: RoomStatus.MAINTENANCE });
    
    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Today's check-ins (confirmed reservations with check-in date today)
    const todayCheckIns = await Reservation.countDocuments({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] }
    });

    // Today's check-outs (checked-in reservations with check-out date today)
    const todayCheckOuts = await Reservation.countDocuments({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: ReservationStatus.CHECKED_IN
    });

    // Current active reservations
    const activeReservations = await Reservation.countDocuments({
      status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] }
    });

    // Revenue statistics
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // This month's revenue (completed/checked-out reservations)
    const monthlyRevenueResult = await Reservation.aggregate([
      {
        $match: {
          checkOutDate: { $gte: currentMonth, $lt: nextMonth },
          status: ReservationStatus.CHECKED_OUT
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          paid: { $sum: '$paidAmount' }
        }
      }
    ]);

    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;
    const monthlyPaid = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].paid : 0;

    // Today's revenue
    const todayRevenueResult = await Reservation.aggregate([
      {
        $match: {
          checkOutDate: { $gte: today, $lt: tomorrow },
          status: ReservationStatus.CHECKED_OUT
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    // Upcoming arrivals (next 7 days)
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    
    const upcomingArrivals = await Reservation.countDocuments({
      checkInDate: { $gte: tomorrow, $lt: next7Days },
      status: ReservationStatus.CONFIRMED
    });

    // Recent reservations (last 5)
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('roomId', 'roomNumber roomType')
      .select('confirmationNumber guestName checkInDate checkOutDate status totalAmount');

    res.json({
      data: {
        rooms: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms,
          maintenance: maintenanceRooms,
          occupancyRate: Math.round(occupancyRate * 10) / 10 // Round to 1 decimal
        },
        reservations: {
          active: activeReservations,
          todayCheckIns,
          todayCheckOuts,
          upcomingArrivals
        },
        revenue: {
          today: todayRevenue,
          monthly: monthlyRevenue,
          monthlyPaid: monthlyPaid,
          monthlyPending: monthlyRevenue - monthlyPaid
        },
        recentReservations
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/v1/stats/occupancy
 * Get occupancy statistics by date range
 */
router.get('/occupancy', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get daily occupancy for the date range
    const occupancyData = await Reservation.aggregate([
      {
        $match: {
          status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.CHECKED_OUT] },
          $or: [
            { checkInDate: { $gte: start, $lte: end } },
            { checkOutDate: { $gte: start, $lte: end } },
            { checkInDate: { $lte: start }, checkOutDate: { $gte: end } }
          ]
        }
      },
      {
        $group: {
          _id: '$checkInDate',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalRooms = await Room.countDocuments();

    res.json({
      data: {
        totalRooms,
        occupancyData
      }
    });
  } catch (error) {
    console.error('Get occupancy stats error:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy statistics' });
  }
});

/**
 * GET /api/v1/stats/revenue
 * Get revenue statistics by date range
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    let dateFormat: any;
    switch (groupBy) {
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$checkOutDate' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$checkOutDate' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$checkOutDate' } };
    }

    const revenueData = await Reservation.aggregate([
      {
        $match: {
          checkOutDate: { $gte: start, $lte: end },
          status: ReservationStatus.CHECKED_OUT
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalRevenue: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          reservationCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ data: revenueData });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

export default router;
