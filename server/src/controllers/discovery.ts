import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import * as discoveryService from '../services/discovery';

export const getMapDiscoveries = asyncHandler(async (req: Request, res: Response) => {
  const pins = await discoveryService.getMapPins({
    lat: req.query.lat !== undefined ? Number(req.query.lat) : undefined,
    lng: req.query.lng !== undefined ? Number(req.query.lng) : undefined,
    radiusKm: req.query.radiusKm !== undefined ? Number(req.query.radiusKm) : undefined,
    type: req.query.type as discoveryService.MapSkillType | undefined,
    availability: req.query.availability === 'true' || req.query.availability === '1',
    categoryIds:
      typeof req.query.categoryId === 'string' && req.query.categoryId
        ? req.query.categoryId.split(',')
        : undefined,
    limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
    viewerId: (req as unknown as { userId?: string }).userId,
  });
  res.json({ success: true, data: { pins, count: pins.length } });
});
