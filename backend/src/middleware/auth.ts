import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole, UserStatus, AuditLog, AuditAction } from '../models';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default-secret'
    ) as { userId: string; email: string; role: UserRole };

    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status === UserStatus.INACTIVE) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      AuditLog.create({
        userId: req.user.userId,
        action: AuditAction.UNAUTHORIZED_ACCESS,
        resource: `${req.method} ${req.originalUrl}`,
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
        ipAddress: req.ip || req.socket.remoteAddress,
      }).catch(err => console.error('Failed to log unauthorized access:', err));

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        details: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to require admin role only
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware to require admin or manager roles
 */
export const requireAdminOrManager = requireRole([UserRole.ADMIN, UserRole.MANAGER]);

/**
 * Middleware to require staff roles (front desk, admin, manager, housekeeping)
 */
export const requireStaff = requireRole([
  UserRole.ADMIN, 
  UserRole.MANAGER, 
  UserRole.FRONT_DESK,
  UserRole.HOUSEKEEPING
]);

/**
 * Middleware to log successful protected route access
 */
export const auditLog = (action: AuditAction, getResourceName?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    try {
      const resource = getResourceName 
        ? getResourceName(req) 
        : `${req.method} ${req.originalUrl}`;

      await AuditLog.create({
        userId: req.user.userId,
        action,
        resource,
        details: {
          method: req.method,
          path: req.originalUrl,
          body: req.method !== 'GET' ? req.body : undefined,
          query: req.query,
        },
        ipAddress: req.ip || req.socket.remoteAddress,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't block the request if audit logging fails
    }

    next();
  };
};
