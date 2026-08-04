import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export function generateTokenId(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function signAccessToken(userId: string, tokenId = generateTokenId()): string {
  return jwt.sign({ userId, type: 'access', jti: tokenId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(userId: string, tokenId: string): string {
  return jwt.sign({ userId, type: 'refresh', jti: tokenId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(
  token: string
): { userId: string; tokenId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      type: string;
      jti?: string;
    };
    if (decoded.type !== 'access' || !decoded.jti) return null;
    return { userId: decoded.userId, tokenId: decoded.jti };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(
  token: string
): { userId: string; tokenId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      type: string;
      jti?: string;
    };
    if (decoded.type !== 'refresh' || !decoded.jti) return null;
    return { userId: decoded.userId, tokenId: decoded.jti };
  } catch {
    return null;
  }
}
