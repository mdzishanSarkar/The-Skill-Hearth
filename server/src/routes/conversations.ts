import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listConversations,
  searchConversations,
  getConversation,
  updateSettings,
  markRead,
  clearHistory,
} from '../controllers/conversations';

const router = Router();

router.get('/', authenticate, listConversations);
router.get('/search', authenticate, searchConversations);
router.get('/:id', authenticate, getConversation);
router.put('/:id/settings', authenticate, updateSettings);
router.put('/:id/read', authenticate, markRead);
router.delete('/:id/history', authenticate, clearHistory);

export default router;
