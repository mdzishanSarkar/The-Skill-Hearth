import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createBundle,
  listBundles,
  getBundle,
  voteOnBundle,
  deleteBundle,
} from '../controllers/bundle';

const router = Router();

router.post('/', authenticate, createBundle);
router.get('/', listBundles);
router.get('/:id', getBundle);
router.post('/:id/vote', authenticate, voteOnBundle);
router.delete('/:id', authenticate, deleteBundle);

export default router;
