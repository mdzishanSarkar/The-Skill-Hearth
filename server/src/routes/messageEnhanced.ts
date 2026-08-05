import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendImageMessage, addReaction, searchMessages } from '../controllers/messageEnhanced';
import { handleUpload } from '../utils/upload';

const router = Router();

router.post('/:connectionId/image', authenticate, handleUpload('image'), sendImageMessage);
router.post('/:id/reactions', authenticate, addReaction);
router.get('/:connectionId/search', authenticate, searchMessages);

export default router;
