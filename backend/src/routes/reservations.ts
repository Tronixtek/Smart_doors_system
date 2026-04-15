import { Router, Request, Response } from 'express';
import { Reservation, ReservationStatus, Room, RoomStatus } from '../models';
import { verifyToken, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

// All reservation routes require authentication
router.use(verifyToken);

/**
 * GET /api/v1/reservations
 * Get all reservations (with pagination and filters)
 */
router.get('/', requireStaff, async (req: Request, res: Response) => {
  try {
    const { status, checkInDate, checkOutDate, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (checkInDate) query.checkInDate = { $gte: new Date(checkInDate as string) };
    if (checkOutDate) query.checkOutDate = { $lte: new Date(checkOutDate as string) };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const reservations = await Reservation.find(query)
      .populate('roomId', 'roomNumber roomType floor')
      .sort({ checkInDate: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Reservation.countDocuments(query);

    res.json({ 
      data: reservations, 
      total,
      page: parseInt(page as string),
      pages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

/**
 * GET /api/v1/reservations/today-checkins
 * Get today's check-ins
 */
router.get('/today-checkins', requireStaff, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await Reservation.find({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] }
    })
      .populate('roomId', 'roomNumber roomType floor')
      .sort({ checkInDate: 1 });

    res.json({ data: reservations, total: reservations.length });
  } catch (error) {
    console.error('Get today check-ins error:', error);
    res.status(500).json({ error: 'Failed to fetch today check-ins' });
  }
});

/**
 * GET /api/v1/reservations/today-checkouts
 * Get today's check-outs
 */
router.get('/today-checkouts', requireStaff, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await Reservation.find({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: ReservationStatus.CHECKED_IN
    })
      .populate('roomId', 'roomNumber roomType floor')
      .sort({ checkOutDate: 1 });

    res.json({ data: reservations, total: reservations.length });
  } catch (error) {
    console.error('Get today check-outs error:', error);
    res.status(500).json({ error: 'Failed to fetch today check-outs' });
  }
});

/**
 * GET /api/v1/reservations/:id
 * Get single reservation by ID
 */
router.get('/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('roomId', 'roomNumber roomType floor status');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ data: reservation });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

/**
 * POST /api/v1/reservations
 * Create new reservation
 */
router.post(
  '/',
  requireStaff,
  auditLog(AuditAction.RESERVATION_CREATED, (req) => `Reservation created for ${req.body.guestFirstName} ${req.body.guestLastName}`),
  async (req: Request, res: Response) => {
    try {
      const reservationData = req.body;

      // Validate dates
      const checkIn = new Date(reservationData.checkInDate);
      const checkOut = new Date(reservationData.checkOutDate);
      
      if (checkOut <= checkIn) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date' });
      }

      // If roomId is provided, check if room is available
      if (reservationData.roomId) {
        const room = await Room.findById(reservationData.roomId);
        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }

        // Check for overlapping reservations
        const overlapping = await Reservation.findOne({
          roomId: reservationData.roomId,
          status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
          $or: [
            { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
          ]
        });

        if (overlapping) {
          return res.status(409).json({ error: 'Room is not available for the selected dates' });
        }
      }

      const reservation = await Reservation.create(reservationData);
      
      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('roomId', 'roomNumber roomType floor');

      res.status(201).json({ data: populatedReservation });
    } catch (error) {
      console.error('Create reservation error:', error);
      res.status(500).json({ error: 'Failed to create reservation' });
    }
  }
);

/**
 * PATCH /api/v1/reservations/:id
 * Update reservation
 */
router.patch(
  '/:id',
  requireStaff,
  auditLog(AuditAction.RESERVATION_UPDATED, (req) => `Reservation ${req.params.id} updated`),
  async (req: Request, res: Response) => {
    try {
      const updates = req.body;

      const reservation = await Reservation.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).populate('roomId', 'roomNumber roomType floor');

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json({ data: reservation });
    } catch (error) {
      console.error('Update reservation error:', error);
      res.status(500).json({ error: 'Failed to update reservation' });
    }
  }
);

/**
 * PATCH /api/v1/reservations/:id/cancel
 * Cancel reservation
 */
router.patch(
  '/:id/cancel',
  requireStaff,
  auditLog(AuditAction.RESERVATION_CANCELLED, (req) => `Reservation ${req.params.id} cancelled`),
  async (req: Request, res: Response) => {
    try {
      const reservation = await Reservation.findById(req.params.id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      if (reservation.status === ReservationStatus.CHECKED_OUT) {
        return res.status(400).json({ error: 'Cannot cancel a checked-out reservation' });
      }

      reservation.status = ReservationStatus.CANCELLED;
      await reservation.save();

      // If room was assigned, make it available again
      if (reservation.roomId) {
        await Room.findByIdAndUpdate(reservation.roomId, {
          status: RoomStatus.AVAILABLE
        });
      }

      res.json({ data: reservation });
    } catch (error) {
      console.error('Cancel reservation error:', error);
      res.status(500).json({ error: 'Failed to cancel reservation' });
    }
  }
);

export default router;
