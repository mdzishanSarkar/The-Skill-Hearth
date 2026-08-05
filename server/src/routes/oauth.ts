import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getGoogleAuthUrl,
  googleCallback,
  getAppleAuthUrl,
  appleCallback,
  getLinkedProviders,
  unlinkProvider,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
} from '../controllers/oauth';

const router = Router();

router.get('/google/url', authenticate, getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.post('/apple/callback', appleCallback);
router.get('/apple/url', authenticate, getAppleAuthUrl);
router.get('/providers', authenticate, getLinkedProviders);
router.delete('/providers/:provider', authenticate, unlinkProvider);
router.post('/2fa/setup', authenticate, setupTwoFactor);
router.post('/2fa/verify', authenticate, verifyAndEnableTwoFactor);
router.post('/2fa/validate', verifyTwoFactor);
router.post('/2fa/disable', authenticate, disableTwoFactor);
router.get('/2fa/status', authenticate, getTwoFactorStatus);

export default router;
