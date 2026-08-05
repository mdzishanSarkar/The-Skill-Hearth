import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  submitReport,
  listReports,
  getReportDetail,
  assignReport,
  resolveReport,
} from '../controllers/reports';

const router = Router();

router.post('/', authenticate, submitReport);

const adminOnly = [authenticate, requireRole('admin')] as const;

router.get('/', ...adminOnly, listReports);
router.get('/:id', ...adminOnly, getReportDetail);
router.patch('/:id/assign', ...adminOnly, assignReport);
router.patch('/:id/resolve', ...adminOnly, resolveReport);

export default router;
