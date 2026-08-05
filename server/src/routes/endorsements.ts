import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  endorse,
  removeEndorsement,
  getSkillEndorsements,
  getUserEndorsements,
  checkEndorsed,
} from '../controllers/endorsement';

const router = Router();

router.post('/', authenticate, endorse);
router.delete('/:id', authenticate, removeEndorsement);
router.get('/skill/:skillId', getSkillEndorsements);
router.get('/user/:userId', getUserEndorsements);
router.get('/check', authenticate, checkEndorsed);

export default router;
