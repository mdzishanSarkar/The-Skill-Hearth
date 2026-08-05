import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as discoveryEnhanced from '../services/discoveryEnhanced';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const getNeighborhoodPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const city = String(req.query.city || '');
  const neighborhood = req.query.neighborhood ? String(req.query.neighborhood) : undefined;
  if (!city) {
    res.status(400).json({ success: false, error: { code: 'MISSING_CITY', message: 'city query param is required' } });
    return;
  }
  const page = await discoveryEnhanced.getNeighborhoodPage(city, neighborhood);
  res.json({ success: true, data: page });
});

export const getNeighborhoodList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await discoveryEnhanced.getNeighborhoodList();
  res.json({ success: true, data: { neighborhoods: list } });
});

export const createLearnerRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillName, categoryName, description, city, neighborhood, format, availability } = req.body || {};
  if (!skillName || !categoryName || !city) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'skillName, categoryName, and city are required' } });
    return;
  }
  const request = await discoveryEnhanced.createLearnerRequest({
    authorId: String(req.userId),
    skillName, categoryName, description, city, neighborhood, format, availability,
  });
  res.status(201).json({ success: true, data: { request } });
});

export const listLearnerRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, city, categoryName, format } = req.query;
  const result = await discoveryEnhanced.listLearnerRequests(
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    { city: city as string, categoryName: categoryName as string, format: format as string },
  );
  res.json({ success: true, data: result });
});

export const respondToLearnerRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await discoveryEnhanced.respondToLearnerRequest(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: { request } });
});

export const closeLearnerRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await discoveryEnhanced.closeLearnerRequest(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: { request } });
});

export const getSmartMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const matches = await discoveryEnhanced.getSmartMatches(String(req.userId), limit);
  res.json({ success: true, data: { matches } });
});
