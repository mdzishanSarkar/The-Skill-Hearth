import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { reportMessage } from '../controllers/messages';

const router = Router();

router.post('/:messageId/report', authenticate, reportMessage);

export default router;
