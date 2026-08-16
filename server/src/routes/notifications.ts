import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUnreadRadarCount,
} from '../controllers/notifications';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread', authenticate, getUnreadCount);
router.get('/unread-radar', authenticate, getUnreadRadarCount);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
