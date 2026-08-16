import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { naturalSearch } from '../services/naturalSearch.service';

export const searchNatural = asyncHandler(async (req: AuthRequest, res: Response) => {
  const raw = typeof req.body?.query === 'string' ? req.body.query : '';
  if (!raw.trim()) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A query is required' } });
    return;
  }
  const result = await naturalSearch(raw, req.userId);
  res.json({ success: true, data: result });
});
