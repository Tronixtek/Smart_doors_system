import { Router } from 'express';
import { AccessPoint } from '../models/AccessPoint';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserOrganizationIds, syncUserOrganizations } from '../utils/organizations';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);
    const organizationId = req.query.organizationId as string | undefined;

    const filter: any = { organizationId: { $in: organizationIds } };
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    const points = await AccessPoint.find(filter).populate('organizationId');
    res.json(points);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);
    const { organizationId, ...rest } = req.body;

    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' });
    }

    const belongsToUser = organizationIds.some((id: any) => id.toString() === organizationId);
    if (!belongsToUser) {
      return res.status(403).json({ message: 'You do not have access to this organization' });
    }

    const point = await AccessPoint.create({
      ...rest,
      organizationId,
    });
    res.status(201).json(point);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update an access point
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const point = await AccessPoint.findOne({ _id: id, organizationId: { $in: organizationIds } });
    if (!point) return res.status(404).json({ message: 'Access point not found or unauthorized' });

    point.name = name || point.name;
    point.type = type || point.type;
    point.description = description !== undefined ? description : point.description;
    
    await point.save();
    res.json(point);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete an access point
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const point = await AccessPoint.findOneAndDelete({ _id: id, organizationId: { $in: organizationIds } });
    if (!point) return res.status(404).json({ message: 'Access point not found or unauthorized' });

    res.json({ message: 'Access point deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
