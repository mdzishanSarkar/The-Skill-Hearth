import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listMatches, propose, hide } from '../controllers/swapReadyMatch';

const router = Router();

router.get('/', authenticate, listMatches);
router.post('/:id/propose', authenticate, propose);
router.patch('/:id/hide', authenticate, hide);

export default router;
