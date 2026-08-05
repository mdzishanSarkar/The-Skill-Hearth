import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendRequest,
  respondToRequest,
  withdrawRequest,
  cancelConnection,
  markCompleted,
  getConnection,
  getInbox,
  getOutbox,
  getActiveChats,
} from '../controllers/connections';

const router = Router();

router.post('/', authenticate, sendRequest);
router.get('/inbox', authenticate, getInbox);
router.get('/outbox', authenticate, getOutbox);
router.get('/chats', authenticate, getActiveChats);
router.get('/:id', authenticate, getConnection);
router.patch('/:id/respond', authenticate, respondToRequest);
router.patch('/:id/withdraw', authenticate, withdrawRequest);
router.patch('/:id/cancel', authenticate, cancelConnection);
router.patch('/:id/complete', authenticate, markCompleted);

export default router;
