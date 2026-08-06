import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  toggleWebhook,
} from '../controllers/webhooks';

const router = Router();

router.get('/', authenticate, listWebhooks);
router.post('/', authenticate, createWebhook);
router.delete('/:id', authenticate, deleteWebhook);
router.put('/:id/toggle', authenticate, toggleWebhook);

export default router;
