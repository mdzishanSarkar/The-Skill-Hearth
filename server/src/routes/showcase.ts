import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createShowcase,
  listShowcases,
  getShowcase,
  likeShowcase,
  deleteShowcase,
} from '../controllers/showcase';

const router = Router();

router.get('/', optionalAuth, listShowcases);
router.get('/:id', optionalAuth, getShowcase);
router.post('/', authenticate, createShowcase);
router.post('/:id/like', authenticate, likeShowcase);
router.delete('/:id', authenticate, deleteShowcase);

export default router;
