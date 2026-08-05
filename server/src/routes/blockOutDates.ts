import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBlockOutDates,
  addBlockOutDate,
  removeBlockOutDate,
} from '../controllers/blockOutDate';

const router = Router();

router.get('/', authenticate, getBlockOutDates);
router.post('/', authenticate, addBlockOutDate);
router.delete('/:id', authenticate, removeBlockOutDate);

export default router;
