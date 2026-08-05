import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  proposeSchedule,
  confirmSchedule,
  downloadICS,
  getSessionNote,
  updateSessionNote,
  reportNoShow,
} from '../controllers/session';

const router = Router();

router.post('/:id/schedule/propose', authenticate, proposeSchedule);
router.post('/:id/schedule/confirm', authenticate, confirmSchedule);
router.get('/:id/schedule/ics', authenticate, downloadICS);
router.get('/:id/notes', authenticate, getSessionNote);
router.put('/:id/notes', authenticate, updateSessionNote);
router.post('/:id/no-show', authenticate, reportNoShow);

export default router;
