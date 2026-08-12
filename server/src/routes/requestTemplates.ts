import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/requestTemplate';

const router = Router();

router.get('/', optionalAuth, listTemplates);
router.get('/:id', optionalAuth, getTemplate);
router.post('/', authenticate, requireRole('admin'), createTemplate);
router.put('/:id', authenticate, requireRole('admin'), updateTemplate);
router.delete('/:id', authenticate, requireRole('admin'), deleteTemplate);

export default router;
