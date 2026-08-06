import { Response, Request } from 'express';
import * as publicApiService from '../services/publicApi';

export const publicQuerySkills = async (req: Request, res: Response) => {
  const { q, category, city, page, limit } = req.query;
  const result = await publicApiService.querySkills({
    q: q ? String(q) : undefined,
    category: category ? String(category) : undefined,
    city: city ? String(city) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, data: result });
};

export const publicGetStats = async (_req: Request, res: Response) => {
  const stats = await publicApiService.getPlatformStats();
  res.json({ success: true, data: stats });
};
