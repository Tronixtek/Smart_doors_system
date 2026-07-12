import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import { Organization } from '../models/Organization';
import { generateToken } from '../utils/jwt';
import { syncUserOrganizations } from '../utils/organizations';

const router = Router();

router.post('/register-org', async (req, res) => {
  try {
    const { orgName, orgSlug, adminEmail, adminPassword, firstName, lastName } = req.body;

    const existingOrg = await Organization.findOne({ slug: orgSlug });
    if (existingOrg) return res.status(400).json({ message: 'Organization slug already exists' });

    const organization = await Organization.create({
      name: orgName,
      slug: orgSlug,
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const user = await User.create({
      organizationId: organization._id,
      organizationIds: [organization._id],
      email: adminEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role: UserRole.ORG_ADMIN,
    });

    organization.ownerId = user._id;
    await organization.save();

    const token = generateToken({ id: user._id, orgId: organization._id, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName,
        lastName,
        role: user.role,
        organizationId: organization._id,
        organizationIds: [organization._id],
      },
      organization,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      organizationIds: [],
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: UserRole.ORG_ADMIN, // Default to admin for their own future org
    });

    const token = generateToken({ id: user._id, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationIds: user.organizationIds || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log('Login failed: User is inactive');
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await syncUserOrganizations(user);
    const token = generateToken({ id: user._id, orgId: user.organizationId, role: user.role });
    console.log('Login successful for user:', user.email);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationIds: user.organizationIds || [],
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
