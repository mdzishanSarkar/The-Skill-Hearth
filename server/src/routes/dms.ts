import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getConversations,
  getConversation,
  sendMessage,
  markRead,
  getUnreadCount,
} from '../controllers/dms';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getConversation);
router.post('/:userId', sendMessage);
router.post('/:userId/read', markRead);

export default router;
