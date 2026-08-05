import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMe,
  updateMe,
  getUser,
  uploadAvatar,
  completeOnboarding,
  getProfileCompleteness,
  exportData,
  requestAccountDeletion,
} from '../controllers/users';
import { handleUpload } from '../utils/upload';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.post('/me/onboarding', authenticate, completeOnboarding);
router.post('/me/avatar', authenticate, handleUpload('avatar'), uploadAvatar);
router.get('/me/completeness', authenticate, getProfileCompleteness);
router.get('/me/export', authenticate, exportData);
router.delete('/me', authenticate, requestAccountDeletion);
router.get('/:id', getUser);

export default router;
