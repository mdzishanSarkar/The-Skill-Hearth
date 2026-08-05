import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSuggestions,
  createSwap,
  acceptSwap,
  declineSwap,
  listSwaps,
} from '../controllers/swap';

const router = Router();

router.get('/suggestions', authenticate, getSuggestions);
router.post('/', authenticate, createSwap);
router.post('/:id/accept', authenticate, acceptSwap);
router.post('/:id/decline', authenticate, declineSwap);
router.get('/', authenticate, listSwaps);

export default router;
