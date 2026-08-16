import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as savedSearchService from '../services/savedSearch';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const saveSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, filters, alertEnabled } = req.body || {};
  if (!name) {
    res.status(400).json({ success: false, error: { code: 'MISSING_NAME', message: 'name is required' } });
    return;
  }
  const search = await savedSearchService.saveSearch(String(req.userId), name, filters || {}, alertEnabled);
  res.status(201).json({ success: true, data: { search } });
});

export const listSavedSearches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const searches = await savedSearchService.listSavedSearches(String(req.userId));
  res.json({ success: true, data: { searches } });
});

export const updateSavedSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const search = await savedSearchService.updateSavedSearch(paramId(req.params.id), String(req.userId), req.body || {});
  res.json({ success: true, data: { search } });
});

export const deleteSavedSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await savedSearchService.deleteSavedSearch(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: result });
});

export const getSearchMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = await savedSearchService.getSearchMatches(
    paramId(req.params.id),
    String(req.userId),
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    },
  );
  res.json({ success: true, data: result });
});
