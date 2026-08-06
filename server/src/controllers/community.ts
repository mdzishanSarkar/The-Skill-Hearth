import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as communityService from '../services/community.service';
import { asyncHandler } from '../utils/errors';

export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, city, neighborhood } = req.body || {};
  if (!content || !city) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'content and city are required' },
    });
    return;
  }
  const post = await communityService.createPost({
    authorId: req.userId!,
    content: String(content),
    city: String(city),
    neighborhood: neighborhood ? String(neighborhood) : undefined,
  });
  res.status(201).json({ success: true, data: { post } });
});

export const listPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { city, neighborhood, sort, page, limit } = req.query;
  if (!city) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'city query parameter is required' },
    });
    return;
  }
  const result = await communityService.listPosts({
    city: String(city),
    neighborhood: neighborhood ? String(neighborhood) : undefined,
    sort: sort === 'top' ? 'top' : 'new',
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    userId: req.userId,
  });
  res.json({ success: true, data: result });
});

export const getPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const post = await communityService.getPost(String(req.params.id), req.userId);
  res.json({ success: true, data: { post } });
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await communityService.deletePost(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const votePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vote } = req.body || {};
  if (!vote || !['up', 'down', 'remove'].includes(vote)) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'vote must be "up", "down", or "remove"' },
    });
    return;
  }
  const result = await communityService.votePost(
    String(req.params.id),
    req.userId!,
    vote
  );
  res.json({ success: true, data: result });
});
