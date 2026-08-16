import { Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../utils/errors';
import * as userService from '../services/user';
import { AuthRequest } from '../middleware/auth';
import { getImpact as getImpactData } from '../services/impact';
import { calculateProfileCompleteness } from '../utils/profileCompleteness';
import { exportUserData, deleteUserAccount } from '../utils/gdpr';
import { User } from '../models';
import { signalProfileView } from '../services/radarSignals';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

export const reverseGeocode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_COORDINATES', message: 'Invalid coordinates' },
    });
    return;
  }
  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: { format: 'jsonv2', lat, lon: lng, zoom: 14, addressdetails: 1 },
      timeout: 8000,
      headers: { 'User-Agent': 'TheSkillHearth/1.0 (skill-hearth app; localhost)' },
    });
    const address = response.data?.address || {};
    const city =
      address.city || address.town || address.village || address.municipality || address.county || '';
    const neighborhood =
      address.neighbourhood || address.suburb || address.quarter || address.hamlet || '';
    const zipCode = address.postcode || '';
    res.json({ success: true, data: { city, neighborhood, zipCode } });
  } catch {
    res.status(502).json({
      success: false,
      error: {
        code: 'GEOCODING_UNAVAILABLE',
        message: 'Could not resolve your location — type your city instead',
      },
    });
  }
});

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
  signalProfileView((req as unknown as { userId?: string }).userId);
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

export const completeOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.completeOnboarding(req.userId!, req.body || {});
  res.json({ success: true, data: { user } });
});

export const skipOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.skipOnboarding(req.userId!, req.body || {});
  res.json({ success: true, data: { user } });
});

export const getProfileCompleteness = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId!);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  const completeness = calculateProfileCompleteness(user);
  res.json({ success: true, data: completeness });
});

export const exportData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await exportUserData(req.userId!);
  res.setHeader('Content-Disposition', 'attachment; filename="skill-hearth-data.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
});

export const requestAccountDeletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteUserAccount(req.userId!);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true, data: { message: 'Account deleted successfully' } });
});

export const getImpact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const impact = await getImpactData(req.userId!);
  res.json({ success: true, data: { impact } });
});
