import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { submitReport } from '../controllers/reports';

const router = Router();

router.post('/', authenticate, submitReport);

export default router;
