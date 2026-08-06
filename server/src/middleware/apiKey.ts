import { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../services/publicApi';
import { HttpError } from '../utils/errors';

export async function requireApiKey(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new HttpError(401, 'MISSING_KEY', 'Authorization: Bearer <api_key> required'));
  }
  const key = authHeader.slice(7);
  try {
    const apiKey = await validateApiKey(key);
    (req as any).apiKey = apiKey;
    next();
  } catch (err) {
    next(err);
  }
}
