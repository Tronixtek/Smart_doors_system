import { Router, Request, Response } from 'express';
import { User, IUser, UserRole, UserStatus } from '../models/User';
import { verifyToken, auditLog } from '../middleware/auth';
import bcrypt from 'bcryptjs';

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
 * @route   GET /api/v1/staff
 * @desc    Get all staff members with filtering
 * @access  Private (Admin/Manager)
 * @query   role, isActive, search (name or email)
 */
router.get('/', requireManagement, async (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query;

    const filter: any = {};

    // Filter by role
    if (role) {
      filter.role = role;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const staff = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (error: any) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/v1/staff/by-role/:role
 * @desc    Get staff members by specific role
 * @access  Private
 */
router.get('/by-role/:role', async (req: Request, res: Response) => {
  try {
    const { role } = req.params;

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const staff = await User.find({ 
      role: role as UserRole,
      isActive: true
    })
      .select('firstName lastName email role')
      .sort({ firstName: 1 });

    res.json(staff);
  } catch (error: any) {
    console.error('Get staff by role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Get single staff member by ID
 * @access  Private (Admin/Manager)
 */
router.get('/:id', requireManagement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await User.findById(id).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error: any) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/v1/staff
 * @desc    Create a new staff member
 * @access  Private (Admin/Manager)
 */
router.post('/', requireManagement, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff member
    const newStaff = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phoneNumber,
      isActive: true
    });

    await newStaff.save();

    // Return staff without password
    const staffResponse = newStaff.toObject();
    (staffResponse as any).password = undefined;

    res.status(201).json(staffResponse);
  } catch (error: any) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PATCH /api/v1/staff/:id
 * @desc    Update staff member details
 * @access  Private (Admin/Manager)
 */
router.patch('/:id', requireManagement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, role } = req.body;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== staff.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const oldData = staff.toObject();

    // Update fields
    if (firstName !== undefined) staff.firstName = firstName;
    if (lastName !== undefined) staff.lastName = lastName;
    if (email !== undefined) staff.email = email;
    if (phoneNumber !== undefined) staff.phoneNumber = phoneNumber;
    if (role !== undefined) {
      // Only admin can change roles
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Only admins can change roles' });
      }
      staff.role = role;
    }

    await staff.save();

    // Audit log
    const staffResponse = staff.toObject();
    (staffResponse as any).password = undefined;

    res.json(staffResponse);
  } catch (error: any) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PATCH /api/v1/staff/:id/password
 * @desc    Change staff member password
 * @access  Private (Admin/Manager)
 */
router.patch('/:id/password', requireManagement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Hash new password
    staff.password = await bcrypt.hash(newPassword, 10);
    await staff.save();


    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PATCH /api/v1/staff/:id/status
 * @desc    Activate or deactivate a staff member
 * @access  Private (Admin only)
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    // Only admin can change staff status
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(UserStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Prevent admin from deactivating themselves
    if (staff._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    const oldStatus = staff.status;
    staff.status = status;
    await staff.save();

    const staffResponse = staff.toObject();
    (staffResponse as any).password = undefined;

    res.json(staffResponse);
  } catch (error: any) {
    console.error('Update staff status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/v1/staff/:id
 * @desc    Delete a staff member (soft delete by deactivating)
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Only admin can delete staff
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Prevent deleting yourself
    if (staff._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Soft delete - set status to INACTIVE
    staff.status = UserStatus.INACTIVE;
    await staff.save();

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/v1/staff/stats
 * @desc    Get staff statistics
 * @access  Private (Admin/Manager)
 */
router.get('/stats/overview', requireManagement, async (req: Request, res: Response) => {
  try {
    const totalStaff = await User.countDocuments();
    const activeStaff = await User.countDocuments({ status: UserStatus.ACTIVE });
    const inactiveStaff = await User.countDocuments({ status: UserStatus.INACTIVE });

    const staffByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalStaff,
      activeStaff,
      inactiveStaff,
      staffByRole: staffByRole.reduce((acc: any, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Get staff stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
