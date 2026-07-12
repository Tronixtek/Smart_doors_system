import { Router } from 'express';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getAccessibleOrganizations, syncUserOrganizations } from '../utils/organizations';

const router = Router();
router.use(authenticate);

/**
 * List organizations owned by the current user.
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    await syncUserOrganizations(req.user);
    const organizations = await getAccessibleOrganizations(req.user);
    res.json(organizations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create a new organization and link it to the current user
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, slug, type } = req.body;

    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) return res.status(400).json({ message: 'Slug already in use' });

    const organization = await Organization.create({
      ownerId: req.user._id,
      name,
      slug,
      type,
    });

    await User.findByIdAndUpdate(req.user._id, {
      organizationId: organization._id,
      $addToSet: { organizationIds: organization._id },
    });

    res.status(201).json(organization);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get current user's organization
 */
router.get('/me', async (req: AuthRequest, res) => {
  try {
    await syncUserOrganizations(req.user);
    const organizations = await getAccessibleOrganizations(req.user);
    if (organizations.length === 0) {
      return res.status(404).json({ message: 'No organization found for this user' });
    }
    res.json(organizations[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update an organization
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const organization = await Organization.findOneAndUpdate(
      { _id: id, ownerId: req.user._id },
      { name, type },
      { new: true }
    );

    if (!organization) return res.status(404).json({ message: 'Organization not found or unauthorized' });

    res.json(organization);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete an organization
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findOneAndDelete({ _id: id, ownerId: req.user._id });
    if (!organization) return res.status(404).json({ message: 'Organization not found or unauthorized' });

    // Also delete associated access points and locks? 
    // For safety, maybe just delete the org and let cascades handle or leave orphaned?
    // Let's at least clear from user's list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { organizationIds: id }
    });

    res.json({ message: 'Organization deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
