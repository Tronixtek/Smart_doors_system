import { Router, Request, Response } from 'express';
import { Reservation, Room, ReservationStatus, RoomStatus } from '../models';
import { verifyToken, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';
import { Lock } from '../models/Lock';
import { LockKey, LockKeyType, LockKeyStatus } from '../models/LockKey';

const router = Router();

// All check-in routes require authentication
router.use(verifyToken);
router.use(requireStaff);

/**
 * POST /api/v1/checkin
 * Check in a guest
 */
router.post(
  '/',
  auditLog(AuditAction.CHECK_IN, (req) => `Check-in for reservation ${req.body.reservationId}`),
  async (req: Request, res: Response) => {
    try {
      const {
        reservationId,
        roomId,
        actualCheckInTime,
        guestIdVerified,
        depositAmount,
        notes,
        generateKey,
      } = req.body;

      // Validate required fields
      if (!reservationId || !roomId) {
        return res.status(400).json({
          error: 'Reservation ID and Room ID are required',
        });
      }

      // Get reservation
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Check if already checked in
      if (reservation.status === ReservationStatus.CHECKED_IN) {
        return res.status(400).json({
          error: 'Guest is already checked in',
        });
      }

      // Check if reservation is confirmed
      if (reservation.status !== ReservationStatus.CONFIRMED) {
        return res.status(400).json({
          error: 'Only confirmed reservations can be checked in',
        });
      }

      // Get and validate room
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if room is available
      if (room.status !== RoomStatus.AVAILABLE) {
        return res.status(400).json({
          error: `Room ${room.roomNumber} is not available (status: ${room.status})`,
        });
      }

      // Update reservation
      reservation.roomId = room._id;
      reservation.status = ReservationStatus.CHECKED_IN;
      if (depositAmount) {
        reservation.paidAmount = (reservation.paidAmount || 0) + depositAmount;
      }
      if (notes) {
        reservation.notes = notes;
      }
      await reservation.save();

      // Update room status
      room.status = RoomStatus.OCCUPIED;
      await room.save();

      // Generate digital key if requested
      let keyCode = null;
      let lockKey = null;
      
      if (generateKey) {
        // Find lock associated with the room
        const lock = await Lock.findOne({ roomId: room._id });
        
        if (lock) {
          // Generate a random 6-digit passcode
          const passcode = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Calculate validity period (check-in to check-out dates)
          const startDate = actualCheckInTime ? new Date(actualCheckInTime) : new Date();
          const endDate = new Date(reservation.checkOutDate);
          
          // Create lock key record (status: PENDING until programmed into physical lock)
          lockKey = await LockKey.create({
            lockId: lock._id,
            roomId: room._id,
            reservationId: reservation._id,
            guestName: reservation.guestName,
            keyType: LockKeyType.PASSCODE,
            keyIdentifier: passcode,
            startDate,
            endDate,
            status: LockKeyStatus.PENDING,
            createdBy: req.user!.userId,
            metadata: {
              passcode,
              deliveryMethod: 'IN_PERSON',
              deliveredAt: new Date(),
            },
          });
          
          keyCode = passcode;
        } else {
          console.warn(`No lock found for room ${room.roomNumber} (${room._id})`);
        }
      }

      // Populate and return
      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('roomId', 'roomNumber roomType floor status');

      res.json({
        success: true,
        data: {
          reservation: populatedReservation,
          room: {
            id: room._id,
            roomNumber: room.roomNumber,
            floor: room.floor,
          },
          checkInTime: actualCheckInTime || new Date().toISOString(),
          depositCollected: depositAmount || 0,
          keyGenerated: !!generateKey,
          keyCode,
          lockKeyId: lockKey?._id,
        },
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: 'Failed to process check-in' });
    }
  }
);

/**
 * POST /api/v1/checkin/checkout
 * Check out a guest
 */
router.post(
  '/checkout',
  auditLog(AuditAction.CHECK_OUT, (req) => `Check-out for reservation ${req.body.reservationId}`),
  async (req: Request, res: Response) => {
    try {
      const {
        reservationId,
        actualCheckOutTime,
        finalCharges,
        paymentMethod,
        roomCondition,
        revokeKey,
        notes,
      } = req.body;

      // Validate required fields
      if (!reservationId) {
        return res.status(400).json({ error: 'Reservation ID is required' });
      }

      // Get reservation
      const reservation = await Reservation.findById(reservationId).populate('roomId');
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Check if already checked out
      if (reservation.status === ReservationStatus.CHECKED_OUT) {
        return res.status(400).json({
          error: 'Guest is already checked out',
        });
      }

      // Check if checked in
      if (reservation.status !== ReservationStatus.CHECKED_IN) {
        return res.status(400).json({
          error: 'Guest must be checked in before checking out',
        });
      }

      // Update reservation
      reservation.status = ReservationStatus.CHECKED_OUT;
      if (finalCharges !== undefined) {
        reservation.totalAmount = finalCharges;
      }
      if (notes) {
        reservation.notes = reservation.notes
          ? `${reservation.notes}\n\nCheck-out: ${notes}`
          : notes;
      }
      await reservation.save();

      // Update room status
      if (reservation.roomId) {
        const room = await Room.findById(reservation.roomId);
        if (room) {
          // Set room to maintenance if damaged, otherwise available
          room.status = roomCondition === 'clean' ? RoomStatus.AVAILABLE : RoomStatus.MAINTENANCE;
          await room.save();
        }
      }

      // Revoke digital keys if requested
      let keyRevoked = false;
      let revokedKeysCount = 0;
      
      if (revokeKey) {
        // Find all active keys for this reservation
        const activeKeys = await LockKey.find({
          reservationId: reservation._id,
          status: { $in: [LockKeyStatus.ACTIVE, LockKeyStatus.PENDING] },
        });
        
        // Revoke each key
        for (const key of activeKeys) {
          key.status = LockKeyStatus.REVOKED;
          key.revokedAt = new Date();
          key.revokedBy = req.user!.userId as any;
          await key.save();
          revokedKeysCount++;
        }
        
        keyRevoked = revokedKeysCount > 0;
      }

      // Calculate final balance
      const balance = reservation.totalAmount - (reservation.paidAmount || 0);

      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('roomId', 'roomNumber roomType floor status');

      res.json({
        success: true,
        data: {
          reservation: populatedReservation,
          checkOutTime: actualCheckOutTime || new Date().toISOString(),
          finalCharges: reservation.totalAmount,
          amountPaid: reservation.paidAmount || 0,
          balance,
          paymentMethod,
          keyRevoked,
        },
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({ error: 'Failed to process check-out' });
    }
  }
);

export default router;
