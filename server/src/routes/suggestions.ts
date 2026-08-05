import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  submitSuggestion,
  voteOnSuggestion,
  listPendingSuggestions,
  listAllSuggestions,
  approveSuggestion,
  rejectSuggestion,
} from '../controllers/suggestion';

const router = Router();

router.post('/', authenticate, submitSuggestion);
router.post('/:id/vote', authenticate, voteOnSuggestion);
router.get('/pending', listPendingSuggestions);
router.get('/', authenticate, requireRole('admin', 'moderator'), listAllSuggestions);
router.patch('/:id/approve', authenticate, requireRole('admin', 'moderator'), approveSuggestion);
router.patch('/:id/reject', authenticate, requireRole('admin', 'moderator'), rejectSuggestion);

export default router;
