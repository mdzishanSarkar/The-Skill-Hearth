import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTip,
  confirmTip,
  promoteSkill,
  getImpactReport,
} from '../controllers/billing';

const router = Router();

router.post('/tips', authenticate, createTip);
router.post('/tips/:id/confirm', authenticate, confirmTip);

router.post('/promote', authenticate, promoteSkill);

router.get('/impact', authenticate, getImpactReport);

export default router;
