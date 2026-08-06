import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from '../controllers/apiKeys';
import { publicQuerySkills, publicGetStats } from '../controllers/publicApi';

const router = Router();

// Public read-only endpoints (require API key)
router.get('/skills', requireApiKey, publicQuerySkills);
router.get('/stats', requireApiKey, publicGetStats);

// Key management (requires authenticated user)
router.get('/keys', authenticate, listApiKeys);
router.post('/keys', authenticate, createApiKey);
router.delete('/keys/:id', authenticate, revokeApiKey);

export default router;
