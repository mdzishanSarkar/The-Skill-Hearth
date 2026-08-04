import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import * as reviewService from '../services/review';
import { AuthRequest } from '../middleware/auth';

export const submitReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await reviewService.submitReview(
    req.userId!,
    String(req.body?.connectionId || ''),
    {
      rating: Number(req.body?.rating),
      content: String(req.body?.content ?? ''),
      tags: Array.isArray(req.body?.tags) ? (req.body.tags as string[]) : [],
      wouldRecommend:
        req.body?.wouldRecommend === undefined ? undefined : Boolean(req.body.wouldRecommend),
    }
  );
  res.status(201).json({ success: true, data: { review } });
});

export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await reviewService.updateReview(req.userId!, String(req.params.id), {
    rating: Number(req.body?.rating),
    content: String(req.body?.content ?? ''),
    tags: Array.isArray(req.body?.tags) ? (req.body.tags as string[]) : [],
    wouldRecommend:
      req.body?.wouldRecommend === undefined ? undefined : Boolean(req.body.wouldRecommend),
  });
  res.json({ success: true, data: { review } });
});

export const getMyConnectionReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await reviewService.getMyConnectionReview(
    req.userId!,
    String(req.params.connectionId)
  );
  res.json({ success: true, data: { review } });
});

export const getReviewableConnections = asyncHandler(async (req: AuthRequest, res: Response) => {
  const connections = await reviewService.getReviewableConnections(req.userId!);
  res.json({ success: true, data: { connections } });
});

export const getUserReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reviewService.getUserReviews(String(req.params.userId), {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 5,
  });
  res.json({ success: true, data });
});