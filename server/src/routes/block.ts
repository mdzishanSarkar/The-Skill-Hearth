import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../controllers/block';

const router = Router();

router.get('/', authenticate, getBlockedUsers);
router.post('/:userId', authenticate, blockUser);
router.delete('/:userId', authenticate, unblockUser);

export default router;
