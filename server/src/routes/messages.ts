import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendMessage,
  getMessages,
  markAsRead,
  markAsDelivered,
  getUnreadCount,
  reportMessage,
} from '../controllers/messages';

const router = Router();

router.post('/', authenticate, sendMessage);
router.get('/unread', authenticate, getUnreadCount);
router.get('/:connectionId', authenticate, getMessages);
router.patch('/:connectionId/read', authenticate, markAsRead);
router.patch('/:messageId/deliver', authenticate, markAsDelivered);
router.post('/:messageId/report', authenticate, reportMessage);

export default router;
