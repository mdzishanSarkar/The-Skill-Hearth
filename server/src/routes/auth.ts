import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { emailRateLimiter, loginRateLimiter } from '../middleware/rateLimit';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/auth';

const router = Router();

router.post('/register', register);
router.post('/verify-email/:token', verifyEmail);
router.post('/resend-verification', emailRateLimiter, resendVerification);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', emailRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);

export default router;
