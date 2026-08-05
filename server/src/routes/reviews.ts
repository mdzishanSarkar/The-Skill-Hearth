import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  submitReview,
  updateReview,
  getMyConnectionReview,
  getReviewableConnections,
  getUserReviews,
} from '../controllers/reviews';

const router = Router();

router.post('/', authenticate, submitReview);
router.get('/mine/connections', authenticate, getReviewableConnections);
router.get('/connection/:connectionId', authenticate, getMyConnectionReview);
router.get('/user/:userId', getUserReviews);
router.patch('/:id', authenticate, updateReview);

export default router;
