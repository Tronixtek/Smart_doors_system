import { Router, Request, Response } from 'express';
import { MaintenanceTask, MaintenanceStatus, MaintenancePriority, MaintenanceIssueType } from '../models/MaintenanceTask';
import { Room, RoomStatus } from '../models/Room';
import { verifyToken, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

// All maintenance routes require authentication
router.use(verifyToken);

/**
 * POST /api/v1/maintenance/tasks
 * Create a new maintenance task
 */
router.post(
  '/tasks',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Maintenance task created for room ${req.body.roomId}`),
  async (req: Request, res: Response) => {
    try {
      const {
        roomId,
        assignedTo,
        priority,
        issueType,
        description,
        scheduledDate,
        estimatedDuration,
      } = req.body;

      // Validate room exists
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Create task
      const task = await MaintenanceTask.create({
        roomId,
        assignedTo,
        priority: priority || MaintenancePriority.NORMAL,
        issueType,
        description,
        scheduledDate,
        estimatedDuration: estimatedDuration || 60,
        status: MaintenanceStatus.SCHEDULED,
        reportedBy: req.user?.userId,
      });

      // Populate room and user details
      await task.populate([
        { path: 'roomId', select: 'roomNumber floor roomType status' },
        { path: 'assignedTo', select: 'firstName lastName email' },
        { path: 'reportedBy', select: 'firstName lastName email' },
      ]);

      res.status(201).json({ data: task });
    } catch (error) {
      console.error('Create maintenance task error:', error);
      res.status(500).json({ error: 'Failed to create maintenance task' });
    }
  }
);

/**
 * GET /api/v1/maintenance/tasks
 * Get all maintenance tasks with filters
 */
router.get('/tasks', requireStaff, async (req: Request, res: Response) => {
  try {
    const { status, assignedTo, priority, issueType, roomId } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (issueType) query.issueType = issueType;
    if (roomId) query.roomId = roomId;

    const tasks = await MaintenanceTask.find(query)
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ priority: -1, scheduledDate: 1, createdAt: -1 })
      .lean();

    res.json({ data: tasks });
  } catch (error) {
    console.error('Get maintenance tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance tasks' });
  }
});

/**
 * GET /api/v1/maintenance/tasks/scheduled
 * Get scheduled maintenance tasks
 */
router.get('/tasks/scheduled', requireStaff, async (req: Request, res: Response) => {
  try {
    const tasks = await MaintenanceTask.find({
      status: MaintenanceStatus.SCHEDULED,
    })
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ priority: -1, scheduledDate: 1 })
      .lean();

    res.json({ data: tasks });
  } catch (error) {
    console.error('Get scheduled tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled tasks' });
  }
});

/**
 * GET /api/v1/maintenance/tasks/urgent
 * Get urgent maintenance tasks
 */
router.get('/tasks/urgent', requireStaff, async (req: Request, res: Response) => {
  try {
    const tasks = await MaintenanceTask.find({
      priority: { $in: [MaintenancePriority.HIGH, MaintenancePriority.URGENT] },
      status: { $ne: MaintenanceStatus.COMPLETED },
    })
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ priority: -1, scheduledDate: 1 })
      .lean();

    res.json({ data: tasks });
  } catch (error) {
    console.error('Get urgent tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch urgent tasks' });
  }
});

/**
 * GET /api/v1/maintenance/tasks/:id
 * Get a single maintenance task by ID
 */
router.get('/tasks/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const task = await MaintenanceTask.findById(req.params.id)
      .populate('roomId', 'roomNumber floor roomType status')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reportedBy', 'firstName lastName email')
      .lean();

    if (!task) {
      return res.status(404).json({ error: 'Maintenance task not found' });
    }

    res.json({ data: task });
  } catch (error) {
    console.error('Get maintenance task error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance task' });
  }
});

/**
 * PATCH /api/v1/maintenance/tasks/:id/status
 * Update maintenance task status
 */
router.patch(
  '/tasks/:id/status',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Maintenance task ${req.params.id} status updated to ${req.body.status}`),
  async (req: Request, res: Response) => {
    try {
      const { status, resolutionNotes, actualDuration } = req.body;

      if (!Object.values(MaintenanceStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const task = await MaintenanceTask.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Maintenance task not found' });
      }

      const updateData: any = { status };

      // Set timestamps based on status
      if (status === MaintenanceStatus.IN_PROGRESS && !task.startedAt) {
        updateData.startedAt = new Date();
      }

      if (status === MaintenanceStatus.COMPLETED) {
        updateData.completedAt = new Date();
        if (resolutionNotes) {
          updateData.resolutionNotes = resolutionNotes;
        }
        if (actualDuration) {
          updateData.actualDuration = actualDuration;
        }

        // Update room status back to AVAILABLE when maintenance is completed
        const room = await Room.findById(task.roomId);
        if (room && room.status === RoomStatus.MAINTENANCE) {
          room.status = RoomStatus.AVAILABLE;
          await room.save();
        }
      }

      const updatedTask = await MaintenanceTask.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      )
        .populate('roomId', 'roomNumber floor roomType status')
        .populate('assignedTo', 'firstName lastName email')
        .populate('reportedBy', 'firstName lastName email')
        .lean();

      res.json({ data: updatedTask });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }
);

/**
 * PATCH /api/v1/maintenance/tasks/:id/assign
 * Assign maintenance task to a staff member
 */
router.patch(
  '/tasks/:id/assign',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Maintenance task ${req.params.id} assigned to ${req.body.assignedTo}`),
  async (req: Request, res: Response) => {
    try {
      const { assignedTo } = req.body;

      const updatedTask = await MaintenanceTask.findByIdAndUpdate(
        req.params.id,
        { assignedTo },
        { new: true }
      )
        .populate('roomId', 'roomNumber floor roomType status')
        .populate('assignedTo', 'firstName lastName email')
        .populate('reportedBy', 'firstName lastName email')
        .lean();

      if (!updatedTask) {
        return res.status(404).json({ error: 'Maintenance task not found' });
      }

      res.json({ data: updatedTask });
    } catch (error) {
      console.error('Assign task error:', error);
      res.status(500).json({ error: 'Failed to assign task' });
    }
  }
);

/**
 * DELETE /api/v1/maintenance/tasks/:id
 * Delete a maintenance task
 */
router.delete(
  '/tasks/:id',
  requireStaff,
  auditLog(AuditAction.ROOM_UPDATED, (req) => `Maintenance task ${req.params.id} deleted`),
  async (req: Request, res: Response) => {
    try {
      const task = await MaintenanceTask.findByIdAndDelete(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Maintenance task not found' });
      }

      res.json({ message: 'Maintenance task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

/**
 * GET /api/v1/maintenance/stats
 * Get maintenance statistics
 */
router.get('/stats', requireStaff, async (req: Request, res: Response) => {
  try {
    const [
      totalTasks,
      scheduledTasks,
      inProgressTasks,
      urgentTasks,
      completedToday,
    ] = await Promise.all([
      MaintenanceTask.countDocuments({
        status: { $ne: MaintenanceStatus.COMPLETED },
      }),
      MaintenanceTask.countDocuments({ status: MaintenanceStatus.SCHEDULED }),
      MaintenanceTask.countDocuments({ status: MaintenanceStatus.IN_PROGRESS }),
      MaintenanceTask.countDocuments({
        priority: { $in: [MaintenancePriority.HIGH, MaintenancePriority.URGENT] },
        status: { $ne: MaintenanceStatus.COMPLETED },
      }),
      MaintenanceTask.countDocuments({
        status: MaintenanceStatus.COMPLETED,
        completedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
    ]);

    res.json({
      data: {
        totalTasks,
        scheduledTasks,
        inProgressTasks,
        urgentTasks,
        completedToday,
      },
    });
  } catch (error) {
    console.error('Get maintenance stats error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance statistics' });
  }
});

export default router;
