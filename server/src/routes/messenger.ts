import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getHistory,
  sendMessage,
  sendImageMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  removeReaction,
  reportMessage,
  getMedia,
  searchMessages,
} from '../controllers/messenger';
import { handleUpload } from '../utils/upload';

const router = Router();

router.get('/:conversationId', authenticate, getHistory);
router.post('/:conversationId', authenticate, sendMessage);
router.post('/:conversationId/image', authenticate, handleUpload('image'), sendImageMessage);
router.get('/:conversationId/media', authenticate, getMedia);
router.get('/:conversationId/search', authenticate, searchMessages);

router.put('/:messageId', authenticate, editMessage);
router.delete('/:messageId', authenticate, deleteMessage);
router.post('/:messageId/react', authenticate, toggleReaction);
router.delete('/:messageId/react', authenticate, removeReaction);
router.post('/:messageId/report', authenticate, reportMessage);

export default router;
