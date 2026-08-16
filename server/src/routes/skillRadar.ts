import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getRadar,
  getIntents,
  patchIntentStatus,
  getIntentMatches,
  postSignal,
  postManual,
  deleteManual,
} from '../controllers/skillRadar';

const router = Router();

router.get('/', authenticate, getRadar);
router.get('/intents', authenticate, getIntents);
router.get('/intents/:category/matches', authenticate, getIntentMatches);
router.patch('/intents/:category/status', authenticate, patchIntentStatus);
router.post('/signals', authenticate, postSignal);
router.post('/manual', authenticate, postManual);
router.delete('/manual/:id', authenticate, deleteManual);

export default router;
