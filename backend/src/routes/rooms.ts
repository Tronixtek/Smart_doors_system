import { Router, Request, Response } from 'express';
import { Room, RoomStatus } from '../models';
import { verifyToken, requireStaff, requireAdminOrManager, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

// All room routes require authentication
router.use(verifyToken);

/**
 * GET /api/v1/rooms
 * Get all rooms (with pagination and filters)
 */
router.get('/', requireStaff, async (req: Request, res: Response) => {
  try {
    const { floor, roomType, status, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (floor) query.floor = parseInt(floor as string);
    if (roomType) query.roomType = roomType;
    if (status) query.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const rooms = await Room.find(query)
      .sort({ floor: 1, roomNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Room.countDocuments(query);

    res.json({ 
      data: rooms, 
      total,
      page: parseInt(page as string),
      pages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

/**
 * GET /api/v1/rooms/available
 * Get available rooms only
 */
router.get('/available', requireStaff, async (req: Request, res: Response) => {
  try {
    const { roomType } = req.query;
    
    const query: any = { status: RoomStatus.AVAILABLE };
    if (roomType) query.roomType = roomType;

    const rooms = await Room.find(query).sort({ floor: 1, roomNumber: 1 });

    res.json({ data: rooms, total: rooms.length });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch available rooms' });
  }
});

/**
 * GET /api/v1/rooms/:id
 * Get single room by ID
 */
router.get('/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ data: room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

/**
 * POST /api/v1/rooms
 * Create new room (Admin/Manager only)
 */
router.post(
  '/', 
  requireAdminOrManager,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Room created: ${req.body.roomNumber}`),
  async (req: Request, res: Response) => {
    try {
      const roomData = req.body;

      // Check if room number already exists
      const existingRoom = await Room.findOne({ roomNumber: roomData.roomNumber });
      if (existingRoom) {
        return res.status(409).json({ error: 'Room number already exists' });
      }

      const room = await Room.create(roomData);

      res.status(201).json({ data: room });
    } catch (error: any) {
      console.error('Create room error:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Room number already exists' });
      }
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
);

/**
 * PATCH /api/v1/rooms/:id/status
 * Update room status (all staff can update)
 */
router.patch(
  '/:id/status',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Room ${req.params.id} status updated`),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      if (!Object.values(RoomStatus).includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          validStatuses: Object.values(RoomStatus)
        });
      }

      const room = await Room.findByIdAndUpdate(
        req.params.id,
        { status, lastStatusChange: new Date() },
        { new: true }
      );

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({ data: room });
    } catch (error) {
      console.error('Update room status error:', error);
      res.status(500).json({ error: 'Failed to update room status' });
    }
  }
);

/**
 * PATCH /api/v1/rooms/:id
 * Update room details (Admin/Manager only)
 */
router.patch(
  '/:id',
  requireAdminOrManager,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Room ${req.params.id} updated`),
  async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      // Don't allow updating roomNumber via this route to prevent conflicts
      delete updates.roomNumber;

      const room = await Room.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({ data: room });
    } catch (error) {
      console.error('Update room error:', error);
      res.status(500).json({ error: 'Failed to update room' });
    }
  }
);

/**
 * DELETE /api/v1/rooms/:id
 * Delete room (Admin only)
 */
router.delete(
  '/:id',
  requireAdminOrManager,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Room ${req.params.id} deleted`),
  async (req: Request, res: Response) => {
    try {
      const room = await Room.findByIdAndDelete(req.params.id);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Delete room error:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  }
);

export default router;
