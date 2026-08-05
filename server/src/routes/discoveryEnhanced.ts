import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNeighborhoodPage,
  getNeighborhoodList,
  createLearnerRequest,
  listLearnerRequests,
  respondToLearnerRequest,
  closeLearnerRequest,
  getSmartMatches,
} from '../controllers/discoveryEnhanced';

const router = Router();

router.get('/neighborhoods', getNeighborhoodList);
router.get('/neighborhood', getNeighborhoodPage);
router.post('/learner-requests', authenticate, createLearnerRequest);
router.get('/learner-requests', listLearnerRequests);
router.post('/learner-requests/:id/respond', authenticate, respondToLearnerRequest);
router.patch('/learner-requests/:id/close', authenticate, closeLearnerRequest);
router.get('/smart-matches', authenticate, getSmartMatches);

export default router;
