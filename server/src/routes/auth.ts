import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
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

const limiterMessage = {
  success: false as const,
  error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limiterMessage,
});

const tokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limiterMessage,
});

const router = Router();

router.post('/register', authLimiter, register);
router.post('/verify-email/:token', tokenLimiter, verifyEmail);
router.post('/resend-verification', tokenLimiter, resendVerification);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', tokenLimiter, forgotPassword);
router.post('/reset-password', tokenLimiter, resetPassword);
router.get('/me', authenticate, me);

export default router;
