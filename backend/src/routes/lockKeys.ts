import { Router, Request, Response } from 'express';
import { LockKey, LockKeyType, LockKeyStatus } from '../models/LockKey';
import { Lock } from '../models/Lock';
import { Reservation, ReservationStatus } from '../models/Reservation';
import { verifyToken, auditLog } from '../middleware/auth';
import { UserRole } from '../models/User';
import { AuditAction } from '../models/AuditLog';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   POST /api/v1/lock-keys
 * @desc    Create a new lock key (passcode, card, etc.)
 * @access  Private
 */
router.post('/', auditLog(AuditAction.KEY_GENERATED, (req) => `Key ${req.body.keyType} generated for reservation ${req.body.reservationId}`), async (req: Request, res: Response) => {
  try {
    const {
      lockId,
      roomId,
      reservationId,
      guestName,
      keyType,
      keyIdentifier,
      startDate,
      endDate,
      metadata,
    } = req.body;

    // Validate required fields
    if (!lockId || !roomId || !reservationId || !guestName || !keyType || !keyIdentifier || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify lock exists
    const lock = await Lock.findById(lockId);
    if (!lock) {
      return res.status(404).json({ error: 'Lock not found' });
    }

    // Verify reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Create lock key
    const lockKey = await LockKey.create({
      lockId,
      roomId,
      reservationId,
      guestName,
      keyType,
      keyIdentifier,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: LockKeyStatus.ACTIVE,
      createdBy: req.user!.userId,
      metadata,
    });

    const populatedKey = await LockKey.findById(lockKey._id)
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({ data: populatedKey });
  } catch (error: any) {
    console.error('Create lock key error:', error);
    res.status(500).json({ error: 'Failed to create lock key', message: error.message });
  }
});

/**
 * @route   GET /api/v1/lock-keys
 * @desc    Get all lock keys with filters
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, lockId, roomId, reservationId, keyType } = req.query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (lockId) {
      filter.lockId = lockId;
    }

    if (roomId) {
      filter.roomId = roomId;
    }

    if (reservationId) {
      filter.reservationId = reservationId;
    }

    if (keyType) {
      filter.keyType = keyType;
    }

    const lockKeys = await LockKey.find(filter)
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber guestName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ data: lockKeys });
  } catch (error: any) {
    console.error('Get lock keys error:', error);
    res.status(500).json({ error: 'Failed to fetch lock keys', message: error.message });
  }
});

/**
 * @route   GET /api/v1/lock-keys/:id
 * @desc    Get lock key by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lockKey = await LockKey.findById(req.params.id)
      .populate('lockId', 'lockName lockMac lockData')
      .populate('roomId', 'roomNumber roomType floor')
      .populate('reservationId', 'confirmationNumber guestName checkInDate checkOutDate')
      .populate('createdBy', 'firstName lastName email')
      .populate('revokedBy', 'firstName lastName email');

    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    res.json({ data: lockKey });
  } catch (error: any) {
    console.error('Get lock key error:', error);
    res.status(500).json({ error: 'Failed to fetch lock key', message: error.message });
  }
});

/**
 * @route   GET /api/v1/lock-keys/reservation/:reservationId
 * @desc    Get all lock keys for a reservation
 * @access  Private
 */
router.get('/reservation/:reservationId', async (req: Request, res: Response) => {
  try {
    const lockKeys = await LockKey.find({ reservationId: req.params.reservationId })
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ data: lockKeys });
  } catch (error: any) {
    console.error('Get reservation lock keys error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation lock keys', message: error.message });
  }
});

/**
 * @route   GET /api/v1/lock-keys/active
 * @desc    Get all currently active lock keys
 * @access  Private
 */
router.get('/active/list', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const activeLockKeys = await LockKey.find({
      status: LockKeyStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber guestName')
      .sort({ endDate: 1 });

    res.json({ data: activeLockKeys });
  } catch (error: any) {
    console.error('Get active lock keys error:', error);
    res.status(500).json({ error: 'Failed to fetch active lock keys', message: error.message });
  }
});

/**
 * @route   PATCH /api/v1/lock-keys/:id
 * @desc    Update lock key properties (e.g., status)
 * @access  Private
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const lockKey = await LockKey.findById(req.params.id);
    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    // Update status if provided
    if (status) {
      if (!Object.values(LockKeyStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      lockKey.status = status;
    }

    await lockKey.save();

    const updatedKey = await LockKey.findById(lockKey._id)
      .populate('lockId', 'lockName lockMac lockData')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber');

    res.json({ data: updatedKey });
  } catch (error: any) {
    console.error('Update lock key error:', error);
    res.status(500).json({ error: 'Failed to update lock key', message: error.message });
  }
});

/**
 * @route   PATCH /api/v1/lock-keys/:id/revoke
 * @desc    Revoke a lock key
 * @access  Private
 */
router.patch('/:id/revoke', auditLog(AuditAction.KEY_REVOKED, (req) => `Key ${req.params.id} revoked`), async (req: Request, res: Response) => {
  try {
    const lockKey = await LockKey.findById(req.params.id);

    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    if (lockKey.status === LockKeyStatus.REVOKED) {
      return res.status(400).json({ error: 'Lock key already revoked' });
    }

    lockKey.status = LockKeyStatus.REVOKED;
    lockKey.revokedAt = new Date();
    lockKey.revokedBy = req.user!.userId as any; // Mongoose will convert string to ObjectId

    await lockKey.save();

    const updatedKey = await LockKey.findById(lockKey._id)
      .populate('lockId', 'lockName lockMac lockData')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber')
      .populate('revokedBy', 'firstName lastName');

    res.json({ data: updatedKey });
  } catch (error: any) {
    console.error('Revoke lock key error:', error);
    res.status(500).json({ error: 'Failed to revoke lock key', message: error.message });
  }
});

/**
 * @route   PATCH /api/v1/lock-keys/:id/extend
 * @desc    Extend lock key validity period
 * @access  Private
 */
router.patch('/:id/extend', auditLog(AuditAction.ROOM_UPDATED, (req) => `Key ${req.params.id} validity extended`), async (req: Request, res: Response) => {
  try {
    const { newEndDate } = req.body;

    if (!newEndDate) {
      return res.status(400).json({ error: 'New end date is required' });
    }

    const lockKey = await LockKey.findById(req.params.id);

    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    if (lockKey.status !== LockKeyStatus.ACTIVE) {
      return res.status(400).json({ error: 'Can only extend active lock keys' });
    }

    const newEnd = new Date(newEndDate);
    if (newEnd <= lockKey.endDate) {
      return res.status(400).json({ error: 'New end date must be after current end date' });
    }

    lockKey.endDate = newEnd;
    await lockKey.save();

    const updatedKey = await LockKey.findById(lockKey._id)
      .populate('lockId', 'lockName lockMac lockData')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber');

    res.json({ data: updatedKey });
  } catch (error: any) {
    console.error('Extend lock key error:', error);
    res.status(500).json({ error: 'Failed to extend lock key', message: error.message });
  }
});

/**
 * @route   DELETE /api/v1/lock-keys/:id
 * @desc    Delete a lock key
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Only admin can delete lock keys
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const lockKey = await LockKey.findById(req.params.id);
    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    await lockKey.deleteOne();

    res.json({ message: 'Lock key deleted successfully' });
  } catch (error: any) {
    console.error('Delete lock key error:', error);
    res.status(500).json({ error: 'Failed to delete lock key', message: error.message });
  }
});

/**
 * @route   GET /api/v1/lock-keys/stats/overview
 * @desc    Get lock key statistics
 * @access  Private
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const totalKeys = await LockKey.countDocuments();
    const activeKeys = await LockKey.countDocuments({
      status: LockKeyStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    const expiredKeys = await LockKey.countDocuments({
      $or: [
        { status: LockKeyStatus.EXPIRED },
        { status: LockKeyStatus.ACTIVE, endDate: { $lt: now } },
      ],
    });
    const revokedKeys = await LockKey.countDocuments({ status: LockKeyStatus.REVOKED });

    // Keys by type
    const keysByType = await LockKey.aggregate([
      { $group: { _id: '$keyType', count: { $sum: 1 } } },
    ]);

    res.json({
      data: {
        totalKeys,
        activeKeys,
        expiredKeys,
        revokedKeys,
        keysByType,
      },
    });
  } catch (error: any) {
    console.error('Get lock key stats error:', error);
    res.status(500).json({ error: 'Failed to fetch lock key statistics', message: error.message });
  }
});

export default router;
