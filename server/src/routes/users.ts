import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, updateMe, getUser, uploadAvatar } from '../controllers/users';
import { handleUpload } from '../utils/upload';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.post('/me/avatar', authenticate, handleUpload('avatar'), uploadAvatar);
router.get('/:id', getUser);

export default router;
