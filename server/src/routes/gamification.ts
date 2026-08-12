import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProfile,
  getPublicProfile,
  getLeaderboard,
  useStreakFreeze,
  getFriendsStreaks,
} from '../controllers/gamification';

const router = Router();

router.get('/public/:userId', getPublicProfile);

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/friends-streaks', getFriendsStreaks);
router.post('/streak/freeze', useStreakFreeze);

export default router;
