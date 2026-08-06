import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  requestMentorship,
  respondToMentorship,
  addCheckIn,
  updateGoal,
  completeMentorship,
  getMyMentorships,
} from '../controllers/mentorships';

const router = Router();

router.get('/my', authenticate, getMyMentorships);
router.post('/', authenticate, requestMentorship);
router.post('/:id/respond', authenticate, respondToMentorship);
router.post('/:id/check-in', authenticate, addCheckIn);
router.put('/:id/goal', authenticate, updateGoal);
router.post('/:id/complete', authenticate, completeMentorship);

export default router;
