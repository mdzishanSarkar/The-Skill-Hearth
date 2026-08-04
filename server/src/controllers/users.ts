import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import * as userService from '../services/user';
import { AuthRequest } from '../middleware/auth';

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getProfile(req.userId!);
  res.json({ success: true, data: { user } });
});

export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.updateProfile(req.userId!, req.body || {});
  res.json({ success: true, data: { user } });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getPublicProfile(String(req.params.id));
  res.json({ success: true, data: { user } });
});

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No image uploaded' },
    });
    return;
  }
  const user = await userService.updateAvatar(req.userId!, file);
  res.json({ success: true, data: { user } });
});
