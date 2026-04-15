import { Router, Request, Response } from 'express';
import { Lock, LockStatus } from '../models/Lock';
import { LockKey, LockKeyType, LockKeyStatus } from '../models/LockKey';
import { Room, RoomStatus } from '../models/Room';
import { verifyToken, auditLog } from '../middleware/auth';
import { UserRole } from '../models/User';
import { AuditAction } from '../models/AuditLog';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

// Middleware to require admin or manager role
const requireManagement = (req: Request, res: Response, next: Function) => {
  if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.MANAGER) {
    return res.status(403).json({ message: 'Access denied. Admin or Manager role required.' });
  }
  next();
};

/**
 * @route   POST /api/v1/locks
 * @desc    Register a new lock (pair lock with room)
 * @access  Private (Admin/Manager)
 */
router.post('/', requireManagement, auditLog(AuditAction.LOCK_INITIALIZED, (req) => `Lock ${req.body.lockName} registered`), async (req: Request, res: Response) => {
  try {
    const { lockMac, lockName, lockData, lockVersion, roomId, batteryLevel, features, metadata } = req.body;

    // Validate required fields
    if (!lockMac || !lockName || !lockData || !lockVersion || !roomId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if lock with this MAC already exists
    const existingLock = await Lock.findOne({ lockMac: lockMac.toUpperCase() });
    if (existingLock) {
      return res.status(409).json({ error: 'Lock with this MAC address already registered' });
    }

    // Check if room already has a lock
    const existingRoomLock = await Lock.findOne({ roomId });
    if (existingRoomLock) {
      return res.status(409).json({ error: 'Room already has a lock assigned' });
    }

    // Create lock
    const lock = await Lock.create({
      lockMac: lockMac.toUpperCase(),
      lockName,
      lockData,
      lockVersion,
      roomId,
      status: LockStatus.ACTIVE,
      batteryLevel,
      features,
      metadata: {
        ...metadata,
        installDate: new Date(),
      },
      lastConnected: new Date(),
    });

    const populatedLock = await Lock.findById(lock._id).populate('roomId', 'roomNumber roomType floor');

    res.status(201).json({ data: populatedLock });
  } catch (error: any) {
    console.error('Register lock error:', error);
    res.status(500).json({ error: 'Failed to register lock', message: error.message });
  }
});

/**
 * @route   GET /api/v1/locks
 * @desc    Get all locks with filters
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, roomId, lowBattery } = req.query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (roomId) {
      filter.roomId = roomId;
    }

    if (lowBattery === 'true') {
      filter.batteryLevel = { $lte: 20 }; // Low battery threshold
    }

    const locks = await Lock.find(filter)
      .populate('roomId', 'roomNumber roomType floor status')
      .sort({ roomId: 1 });

    res.json({ data: locks });
  } catch (error: any) {
    console.error('Get locks error:', error);
    res.status(500).json({ error: 'Failed to fetch locks', message: error.message });
  }
});

/**
 * @route   GET /api/v1/locks/:id
 * @desc    Get lock by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lock = await Lock.findById(req.params.id)
      .populate('roomId', 'roomNumber roomType floor status');

    if (!lock) {
      return res.status(404).json({ error: 'Lock not found' });
    }

    res.json({ data: lock });
  } catch (error: any) {
    console.error('Get lock error:', error);
    res.status(500).json({ error: 'Failed to fetch lock', message: error.message });
  }
});

/**
 * @route   GET /api/v1/locks/room/:roomId
 * @desc    Get lock by room ID
 * @access  Private
 */
router.get('/room/:roomId', async (req: Request, res: Response) => {
  try {
    const lock = await Lock.findOne({ roomId: req.params.roomId })
      .populate('roomId', 'roomNumber roomType floor status');

    if (!lock) {
      return res.status(404).json({ error: 'No lock found for this room' });
    }

    res.json({ data: lock });
  } catch (error: any) {
    console.error('Get lock by room error:', error);
    res.status(500).json({ error: 'Failed to fetch lock', message: error.message });
  }
});

/**
 * @route   PATCH /api/v1/locks/:id
 * @desc    Update lock information
 * @access  Private (Admin/Manager)
 */
router.patch('/:id', requireManagement, auditLog(AuditAction.ROOM_UPDATED, (req) => `Lock ${req.params.id} updated`), async (req: Request, res: Response) => {
  try {
    const { lockName, status, batteryLevel, features, metadata, lastConnected } = req.body;

    const lock = await Lock.findById(req.params.id);
    if (!lock) {
      return res.status(404).json({ error: 'Lock not found' });
    }

    // Update fields
    if (lockName) lock.lockName = lockName;
    if (status) lock.status = status;
    if (batteryLevel !== undefined) lock.batteryLevel = batteryLevel;
    if (features) lock.features = { ...lock.features, ...features };
    if (metadata) lock.metadata = { ...lock.metadata, ...metadata };
    if (lastConnected) lock.lastConnected = new Date(lastConnected);

    await lock.save();

    const updatedLock = await Lock.findById(lock._id)
      .populate('roomId', 'roomNumber roomType floor status');

    res.json({ data: updatedLock });
  } catch (error: any) {
    console.error('Update lock error:', error);
    res.status(500).json({ error: 'Failed to update lock', message: error.message });
  }
});

/**
 * @route   PATCH /api/v1/locks/:id/status
 * @desc    Update lock status
 * @access  Private (Admin/Manager)
 */
router.patch('/:id/status', requireManagement, auditLog(AuditAction.ROOM_UPDATED, (req) => `Lock ${req.params.id} status updated to ${req.body.status}`), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !Object.values(LockStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid lock status' });
    }

    const lock = await Lock.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('roomId', 'roomNumber roomType floor status');

    if (!lock) {
      return res.status(404).json({ error: 'Lock not found' });
    }

    res.json({ data: lock });
  } catch (error: any) {
    console.error('Update lock status error:', error);
    res.status(500).json({ error: 'Failed to update lock status', message: error.message });
  }
});

/**
 * @route   DELETE /api/v1/locks/:id
 * @desc    Remove lock (unpair from room)
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Only admin can delete locks
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const lock = await Lock.findById(req.params.id);
    if (!lock) {
      return res.status(404).json({ error: 'Lock not found' });
    }

    // Check if there are active keys for this lock
    const activeKeys = await LockKey.countDocuments({
      lockId: lock._id,
      status: LockKeyStatus.ACTIVE,
      endDate: { $gte: new Date() },
    });

    if (activeKeys > 0) {
      return res.status(400).json({
        error: 'Cannot delete lock with active keys',
        message: `There are ${activeKeys} active keys. Revoke all keys before deleting the lock.`,
      });
    }

    await lock.deleteOne();

    res.json({ message: 'Lock deleted successfully' });
  } catch (error: any) {
    console.error('Delete lock error:', error);
    res.status(500).json({ error: 'Failed to delete lock', message: error.message });
  }
});

/**
 * @route   GET /api/v1/locks/stats/overview
 * @desc    Get lock statistics
 * @access  Private (Admin/Manager)
 */
router.get('/stats/overview', requireManagement, async (req: Request, res: Response) => {
  try {
    const totalLocks = await Lock.countDocuments();
    const activeLocks = await Lock.countDocuments({ status: LockStatus.ACTIVE });
    const maintenanceLocks = await Lock.countDocuments({ status: LockStatus.MAINTENANCE });
    const lowBatteryLocks = await Lock.countDocuments({
      batteryLevel: { $lte: 20, $exists: true },
    });

    const averageBattery = await Lock.aggregate([
      { $match: { batteryLevel: { $exists: true } } },
      { $group: { _id: null, avgBattery: { $avg: '$batteryLevel' } } },
    ]);

    res.json({
      data: {
        totalLocks,
        activeLocks,
        maintenanceLocks,
        lowBatteryLocks,
        averageBatteryLevel: averageBattery[0]?.avgBattery || 0,
      },
    });
  } catch (error: any) {
    console.error('Get lock stats error:', error);
    res.status(500).json({ error: 'Failed to fetch lock statistics', message: error.message });
  }
});

export default router;
