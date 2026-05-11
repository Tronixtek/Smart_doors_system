import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus, AuditLog, AuditAction } from '../models';
import { generateTokenPair, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/jwt';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status === UserStatus.INACTIVE) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({ error: `Account is locked. Try again in ${minutesLeft} minutes` });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt
      await AuditLog.create({
        userId: user._id,
        action: AuditAction.LOGIN_FAILED,
        resource: 'Authentication',
        details: { email, reason: 'Invalid password' },
        ipAddress: req.ip || req.socket.remoteAddress,
      }).catch(err => console.error('Failed to log login attempt:', err));

      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
      
      if (user.failedLoginAttempts >= maxAttempts) {
        const lockoutMinutes = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30');
        user.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60000);
        await user.save();
        return res.status(403).json({ error: `Account locked due to too many failed attempts. Try again in ${lockoutMinutes} minutes` });
      }
      
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Log successful login
    await AuditLog.create({
      userId: user._id,
      action: AuditAction.LOGIN,
      resource: 'Authentication',
      details: { email, role: user.role },
      ipAddress: req.ip || req.socket.remoteAddress,
    }).catch(err => console.error('Failed to log login:', err));

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateTokenPair(
      user._id.toString(),
      user.email,
      user.role
    );

    // Return user data and tokens
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };
    
    res.json({
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/v1/auth/register
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || '').trim();
    const { password, firstName, lastName, phoneNumber, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(password, rounds);

    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.FRONT_DESK,
      phoneNumber: phoneNumber || '',
      status: UserStatus.ACTIVE,
    });

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateTokenPair(
      newUser._id.toString(),
      newUser.email,
      newUser.role
    );

    // Return user data and tokens
    const userResponse = {
      id: newUser._id.toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      phoneNumber: newUser.phoneNumber,
    };
    
    res.status(201).json({
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber,
      status: user.status,
      lastLogin: user.lastLoginAt,
    };
    
    res.json({ data: userResponse });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const tokenData = await verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const user = await User.findById(tokenData.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === UserStatus.INACTIVE) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(refreshToken);

    // Generate new token pair
    const newTokens = await generateTokenPair(
      user._id.toString(),
      user.email,
      user.role
    );

    res.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout and revoke refresh token
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Revoke the refresh token
    const revoked = await revokeRefreshToken(refreshToken);

    // Log logout
    const tokenData = await verifyRefreshToken(refreshToken);
    if (tokenData) {
      await AuditLog.create({
        userId: tokenData.userId,
        action: AuditAction.LOGOUT,
        resource: 'Authentication',
        details: { method: 'logout' },
        ipAddress: req.ip || req.socket.remoteAddress,
      }).catch(err => console.error('Failed to log logout:', err));
    }

    res.json({ 
      message: revoked ? 'Logged out successfully' : 'Token already revoked or invalid' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * POST /api/v1/auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(userId);

    // Log logout from all devices
    await AuditLog.create({
      userId,
      action: AuditAction.LOGOUT,
      resource: 'Authentication',
      details: { method: 'logout-all-devices' },
      ipAddress: req.ip || req.socket.remoteAddress,
    }).catch(err => console.error('Failed to log logout-all:', err));

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

export default router;
