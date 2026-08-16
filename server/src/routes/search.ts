import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { searchNatural } from '../controllers/search';

const router = Router();

router.post('/natural', authenticate, searchNatural);

export default router;
