import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import TokenBlacklist from '../models/TokenBlacklist';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

async function isBlacklisted(tokenId: string): Promise<boolean> {
  const entry = await TokenBlacklist.findOne({ tokenId, type: 'access' });
  return Boolean(entry);
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
    return;
  }

  if (await isBlacklisted(payload.tokenId)) {
    res.status(401).json({ success: false, error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked' } });
    return;
  }

  const user = await User.findById(payload.userId).select('status suspensionExpiresAt');
  if (!user) {
    res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }

  if (user.status === 'suspended' && user.suspensionExpiresAt && user.suspensionExpiresAt <= new Date()) {
    user.status = 'active';
    user.suspensionExpiresAt = undefined;
    await user.save();
  }

  if (user.status === 'banned') {
    res.status(403).json({ success: false, error: { code: 'ACCOUNT_BANNED', message: 'Your account has been banned' } });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended' } });
    return;
  }

  req.userId = payload.userId;
  next();
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (payload && !(await isBlacklisted(payload.tokenId))) {
      req.userId = payload.userId;
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const user = await User.findById(req.userId).select('role status');
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }

    if (user.status === 'banned') {
      res.status(403).json({ success: false, error: { code: 'ACCOUNT_BANNED', message: 'Account is banned' } });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended' } });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }

    req.user = user as IUser;
    next();
  };
}
