import { Router, Request, Response } from 'express';
import { HousekeepingTask, TaskStatus, TaskPriority } from '../models/HousekeepingTask';
import { Room, RoomStatus } from '../models/Room';
import { verifyToken, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

// All housekeeping routes require authentication
router.use(verifyToken);

/**
 * POST /api/v1/housekeeping/tasks
 * Create a new housekeeping task
 */
router.post(
  '/tasks',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Housekeeping task created for room ${req.body.roomId}`),
  async (req: Request, res: Response) => {
    try {
      const { roomId, assignedTo, priority, taskType, notes, estimatedDuration } = req.body;

      // Validate room exists
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Create task
      const task = await HousekeepingTask.create({
        roomId,
        assignedTo,
        priority: priority || TaskPriority.NORMAL,
        taskType: taskType || 'CHECKOUT_CLEAN',
        notes,
        estimatedDuration,
        status: TaskStatus.PENDING,
      });

      // Populate room and assignedTo details
      await task.populate([
        { path: 'roomId', select: 'roomNumber floor roomType status' },
        { path: 'assignedTo', select: 'firstName lastName email' },
      ]);

      res.status(201).json({ data: task });
    } catch (error) {
      console.error('Create housekeeping task error:', error);
      res.status(500).json({ error: 'Failed to create housekeeping task' });
    }
  }
);

/**
 * GET /api/v1/housekeeping/tasks
 * Get all housekeeping tasks with filters
 */
router.get('/tasks', requireStaff, async (req: Request, res: Response) => {
  try {
    const { status, assignedTo, priority, roomId } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    if (roomId) filter.roomId = roomId;

    const tasks = await HousekeepingTask.find(filter)
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({ data: tasks });
  } catch (error) {
    console.error('Get housekeeping tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch housekeeping tasks' });
  }
});

/**
 * GET /api/v1/housekeeping/tasks/today
 * Get today's housekeeping tasks
 */
router.get('/tasks/today', requireStaff, async (req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await HousekeepingTask.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ priority: -1, status: 1, createdAt: 1 })
      .lean();

    res.json({ data: tasks });
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s tasks' });
  }
});

/**
 * GET /api/v1/housekeeping/tasks/pending
 * Get all pending housekeeping tasks
 */
router.get('/tasks/pending', requireStaff, async (req: Request, res: Response) => {
  try {
    const tasks = await HousekeepingTask.find({ status: TaskStatus.PENDING })
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    res.json({ data: tasks });
  } catch (error) {
    console.error('Get pending tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

/**
 * GET /api/v1/housekeeping/tasks/:id
 * Get a single housekeeping task
 */
router.get('/tasks/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id)
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ data: task });
  } catch (error) {
    console.error('Get housekeeping task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * PATCH /api/v1/housekeeping/tasks/:id/status
 * Update task status
 */
router.patch(
  '/tasks/:id/status',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Housekeeping task ${req.params.id} status updated to ${req.body.status}`),
  async (req: Request, res: Response) => {
    try {
      const { status, completionNotes } = req.body;

      if (!Object.values(TaskStatus).includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          validStatuses: Object.values(TaskStatus)
        });
      }

      const updateData: any = { status };

      // Set timestamps based on status
      if (status === TaskStatus.IN_PROGRESS && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }

      if (status === TaskStatus.COMPLETED) {
        updateData.completedAt = new Date();
        if (completionNotes) {
          updateData.completionNotes = completionNotes;
        }
      }

      const task = await HousekeepingTask.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      )
        .populate('roomId', 'roomNumber floor roomType status')
        .populate('assignedTo', 'firstName lastName email');

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // If task is completed, update room status to AVAILABLE
      if (status === TaskStatus.COMPLETED && task.roomId) {
        const roomId = typeof task.roomId === 'object' ? (task.roomId as any)._id : task.roomId;
        await Room.findByIdAndUpdate(roomId, { status: RoomStatus.AVAILABLE });
      }

      res.json({ data: task });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }
);

/**
 * PATCH /api/v1/housekeeping/tasks/:id/assign
 * Assign task to a staff member
 */
router.patch(
  '/tasks/:id/assign',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Housekeeping task ${req.params.id} assigned to ${req.body.assignedTo}`),
  async (req: Request, res: Response) => {
    try {
      const { assignedTo } = req.body;

      const task = await HousekeepingTask.findByIdAndUpdate(
        req.params.id,
        { assignedTo },
        { new: true }
      )
        .populate('roomId', 'roomNumber floor roomType status')
        .populate('assignedTo', 'firstName lastName email');

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ data: task });
    } catch (error) {
      console.error('Assign task error:', error);
      res.status(500).json({ error: 'Failed to assign task' });
    }
  }
);

/**
 * DELETE /api/v1/housekeeping/tasks/:id
 * Delete a housekeeping task
 */
router.delete(
  '/tasks/:id',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Housekeeping task ${req.params.id} deleted`),
  async (req: Request, res: Response) => {
    try {
      const task = await HousekeepingTask.findByIdAndDelete(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

/**
 * GET /api/v1/housekeeping/stats
 * Get housekeeping statistics
 */
router.get('/stats', requireStaff, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTasks, pendingTasks, inProgressTasks, completedToday] = await Promise.all([
      HousekeepingTask.countDocuments({ status: { $ne: TaskStatus.COMPLETED } }),
      HousekeepingTask.countDocuments({ status: TaskStatus.PENDING }),
      HousekeepingTask.countDocuments({ status: TaskStatus.IN_PROGRESS }),
      HousekeepingTask.countDocuments({
        status: TaskStatus.COMPLETED,
        completedAt: { $gte: today },
      }),
    ]);

    res.json({
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedToday,
      },
    });
  } catch (error) {
    console.error('Get housekeeping stats error:', error);
    res.status(500).json({ error: 'Failed to fetch housekeeping stats' });
  }
});

export default router;
