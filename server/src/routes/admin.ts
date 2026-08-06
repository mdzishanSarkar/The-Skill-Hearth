import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listUsers,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
  listReports,
  getReportDetail,
  assignReport,
  resolveReport,
  warnUser,
  suspendUser,
  banUser,
  reactivateUser,
  removeSkill,
  removeReview,
  deleteMessage,
  getModerationStats,
  shadowBanUser,
  removeShadowBan,
  removePost,
  detectSuspiciousActivity,
} from '../controllers/admin';

const router = Router();

const adminOnly = [authenticate, requireRole('admin')];

router.get('/users', ...adminOnly, listUsers);
router.get('/users/:id', ...adminOnly, getUserDetail);
router.patch('/users/:id/status', ...adminOnly, updateUserStatus);
router.patch('/users/:id/role', ...adminOnly, updateUserRole);
router.post('/users/:id/warn', ...adminOnly, warnUser);
router.post('/users/:id/suspend', ...adminOnly, suspendUser);
router.post('/users/:id/ban', ...adminOnly, banUser);
router.post('/users/:id/reactivate', ...adminOnly, reactivateUser);

router.get('/stats', ...adminOnly, getModerationStats);

router.get('/reports', ...adminOnly, listReports);
router.get('/reports/:id', ...adminOnly, getReportDetail);
router.patch('/reports/:id/assign', ...adminOnly, assignReport);
router.patch('/reports/:id/resolve', ...adminOnly, resolveReport);

router.post('/skills/:id/remove', ...adminOnly, removeSkill);
router.post('/reviews/:id/remove', ...adminOnly, removeReview);
router.post('/messages/:id/remove', ...adminOnly, deleteMessage);
router.post('/posts/:id/remove', ...adminOnly, removePost);

router.post('/users/:id/shadow-ban', ...adminOnly, shadowBanUser);
router.post('/users/:id/remove-shadow-ban', ...adminOnly, removeShadowBan);
router.get('/suspicious-activity', ...adminOnly, detectSuspiciousActivity);

export default router;
