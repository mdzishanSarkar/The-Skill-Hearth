import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createSession,
  listSessions,
  getSession,
  joinSession,
  leaveSession,
  completeSession,
  cancelSession,
  updateSession,
} from '../controllers/groupSessions';

const router = Router();

router.get('/', authenticate, listSessions);
router.get('/:id', authenticate, getSession);
router.post('/', authenticate, createSession);
router.post('/:id/join', authenticate, joinSession);
router.delete('/:id/leave', authenticate, leaveSession);
router.put('/:id', authenticate, updateSession);
router.put('/:id/complete', authenticate, completeSession);
router.delete('/:id', authenticate, cancelSession);

export default router;
