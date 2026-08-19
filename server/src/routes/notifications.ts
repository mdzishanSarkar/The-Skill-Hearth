import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  getUnreadCount,
  getUnreadRadarCount,
} from '../controllers/notifications';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread', authenticate, getUnreadCount);
router.get('/unread-radar', authenticate, getUnreadRadarCount);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/:id/unread', authenticate, markAsUnread);
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
