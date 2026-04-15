import { Router, Request, Response } from 'express';
import { Space, SpaceStatus, SpaceType, Visit, VisitStatus } from '../models';
import { verifyToken, requireStaff, requireAdmin, requireAdminOrManager, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

router.use(verifyToken);

router.get('/', requireStaff, async (req: Request, res: Response) => {
  try {
    const { site, floor, type, status, department, q, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (site) query.site = site;
    if (floor) query.floor = parseInt(floor as string, 10);
    if (type) query.type = type;
    if (status) query.status = status;
    if (department) query.department = department;
    if (q) {
      query.$or = [
        { name: { $regex: q as string, $options: 'i' } },
        { code: { $regex: q as string, $options: 'i' } },
      ];
    }

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    const spaces = await Space.find(query)
      .populate('linkedLockId', 'lockName lockMac status')
      .sort({ site: 1, floor: 1, name: 1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Space.countDocuments(query);

    res.json({
      data: spaces,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get office spaces error:', error);
    res.status(500).json({ error: 'Failed to fetch office spaces' });
  }
});

router.get('/active', requireStaff, async (req: Request, res: Response) => {
  try {
    const spaces = await Space.find({ status: SpaceStatus.ACTIVE })
      .sort({ site: 1, floor: 1, name: 1 });

    res.json({ data: spaces, total: spaces.length });
  } catch (error) {
    console.error('Get active office spaces error:', error);
    res.status(500).json({ error: 'Failed to fetch active office spaces' });
  }
});

router.get('/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const space = await Space.findById(req.params.id)
      .populate('linkedLockId', 'lockName lockMac lockData status features');

    if (!space) {
      return res.status(404).json({ error: 'Office space not found' });
    }

    res.json({ data: space });
  } catch (error) {
    console.error('Get office space error:', error);
    res.status(500).json({ error: 'Failed to fetch office space' });
  }
});

router.post(
  '/',
  requireAdminOrManager,
  auditLog(AuditAction.SPACE_CREATED, (req) => `Office space created: ${req.body.code || req.body.name}`),
  async (req: Request, res: Response) => {
    try {
      const { code, type } = req.body;

      if (type && !Object.values(SpaceType).includes(type)) {
        return res.status(400).json({ error: 'Invalid space type', validTypes: Object.values(SpaceType) });
      }

      const existingSpace = await Space.findOne({ code: String(code).toUpperCase() });
      if (existingSpace) {
        return res.status(409).json({ error: 'Space code already exists' });
      }

      const space = await Space.create(req.body);
      res.status(201).json({ data: space });
    } catch (error: any) {
      console.error('Create office space error:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Space code already exists' });
      }
      res.status(500).json({ error: 'Failed to create office space' });
    }
  }
);

router.patch(
  '/:id/status',
  requireAdminOrManager,
  auditLog(AuditAction.SPACE_UPDATED, (req) => `Office space ${req.params.id} status updated`),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      if (!Object.values(SpaceStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status', validStatuses: Object.values(SpaceStatus) });
      }

      const space = await Space.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
      if (!space) {
        return res.status(404).json({ error: 'Office space not found' });
      }

      res.json({ data: space });
    } catch (error) {
      console.error('Update office space status error:', error);
      res.status(500).json({ error: 'Failed to update office space status' });
    }
  }
);

router.patch(
  '/:id',
  requireAdminOrManager,
  auditLog(AuditAction.SPACE_UPDATED, (req) => `Office space ${req.params.id} updated`),
  async (req: Request, res: Response) => {
    try {
      const updates = { ...req.body };
      delete updates.code;

      if (updates.type && !Object.values(SpaceType).includes(updates.type)) {
        return res.status(400).json({ error: 'Invalid space type', validTypes: Object.values(SpaceType) });
      }

      const space = await Space.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!space) {
        return res.status(404).json({ error: 'Office space not found' });
      }

      res.json({ data: space });
    } catch (error) {
      console.error('Update office space error:', error);
      res.status(500).json({ error: 'Failed to update office space' });
    }
  }
);

router.delete(
  '/:id',
  requireAdmin,
  auditLog(AuditAction.SPACE_DELETED, (req) => `Office space ${req.params.id} deleted`),
  async (req: Request, res: Response) => {
    try {
      const activeVisits = await Visit.countDocuments({
        spaceId: req.params.id,
        status: { $in: [VisitStatus.SCHEDULED, VisitStatus.CHECKED_IN] },
      });

      if (activeVisits > 0) {
        return res.status(409).json({ error: 'Cannot delete a space with active or upcoming visits' });
      }

      const space = await Space.findByIdAndDelete(req.params.id);
      if (!space) {
        return res.status(404).json({ error: 'Office space not found' });
      }

      res.json({ message: 'Office space deleted successfully' });
    } catch (error) {
      console.error('Delete office space error:', error);
      res.status(500).json({ error: 'Failed to delete office space' });
    }
  }
);

export default router;
