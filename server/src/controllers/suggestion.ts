import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as suggestionService from '../services/suggestion';
import { asyncHandler } from '../utils/errors';

export const submitSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillName, categoryName, description } = req.body;
  if (!skillName || !categoryName) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'skillName and categoryName are required' } });
    return;
  }
  const suggestion = await suggestionService.submitSuggestion(req.userId!, skillName, categoryName, description || '');
  res.status(201).json({ success: true, data: { suggestion } });
});

export const voteOnSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await suggestionService.voteOnSuggestion(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const listPendingSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = await suggestionService.listPendingSuggestions(
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
  );
  res.json({ success: true, data: result });
});

export const listAllSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, status } = req.query;
  const result = await suggestionService.listAllSuggestions(
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    status as string,
  );
  res.json({ success: true, data: result });
});

export const approveSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { adminNotes } = req.body;
  const suggestion = await suggestionService.approveSuggestion(String(req.params.id), req.userId!, adminNotes);
  res.json({ success: true, data: { suggestion } });
});

export const rejectSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { adminNotes } = req.body;
  const suggestion = await suggestionService.rejectSuggestion(String(req.params.id), req.userId!, adminNotes);
  res.json({ success: true, data: { suggestion } });
});
