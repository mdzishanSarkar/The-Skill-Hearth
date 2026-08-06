import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createChallenge,
  listChallenges,
  getChallenge,
  joinChallenge,
  updateProgress,
  getLeaderboard,
} from '../controllers/challenges';

const router = Router();

router.get('/', optionalAuth, listChallenges);
router.get('/:id', optionalAuth, getChallenge);
router.get('/:id/leaderboard', optionalAuth, getLeaderboard);
router.post('/', authenticate, createChallenge);
router.post('/:id/join', authenticate, joinChallenge);
router.put('/:id/progress', authenticate, updateProgress);

export default router;
