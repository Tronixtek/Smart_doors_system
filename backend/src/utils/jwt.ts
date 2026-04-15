import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from '../models';
import { UserRole } from '../models/User';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Generate JWT access token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m') as SignOptions['expiresIn'];
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn }
  );
};

/**
 * Generate refresh token (long-lived, stored in DB)
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  // Generate a secure random token
  const token = crypto.randomBytes(64).toString('hex');
  
  // Calculate expiry date
  const expiryDays = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY?.replace('d', '') || '7');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Store in database
  await RefreshToken.create({
    token,
    userId,
    expiresAt,
    isRevoked: false,
  });

  return token;
};

/**
 * Verify and validate refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<{ userId: string } | null> => {
  try {
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken) {
      return null;
    }

    // Check if token is revoked
    if (refreshToken.isRevoked) {
      return null;
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      return null;
    }

    return { userId: refreshToken.userId.toString() };
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
};

/**
 * Revoke a refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<boolean> => {
  try {
    const result = await RefreshToken.updateOne(
      { token },
      { isRevoked: true }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Refresh token revocation error:', error);
    return false;
  }
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export const revokeAllUserTokens = async (userId: string): Promise<boolean> => {
  try {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
    return true;
  } catch (error) {
    console.error('Revoke all tokens error:', error);
    return false;
  }
};

/**
 * Clean up expired refresh tokens (run periodically)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Token cleanup error:', error);
    return 0;
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = async (
  userId: string,
  email: string,
  role: UserRole
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = generateAccessToken({ userId, email, role });
  const refreshToken = await generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};
