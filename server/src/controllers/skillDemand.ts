import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { getLatestSnapshot } from '../services/skillDemand.service';

export const getHeatmap = asyncHandler(async (_req: Request, res: Response) => {
  const snapshot = await getLatestSnapshot();
  res.json({
    success: true,
    data: {
      skills: snapshot.skills,
      windowStart: snapshot.windowStart,
      windowEnd: snapshot.windowEnd,
      generatedAt: snapshot.createdAt,
    },
  });
});
