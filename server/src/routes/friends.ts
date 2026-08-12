import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listFriends,
  getIncomingRequests,
  getOutgoingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  setFriendTier,
  updateFriendPrivacy,
  getMutualFriends,
  getSuggestions,
  getFriendsOnline,
  getFriendStatus,
} from '../controllers/friends';

const router = Router();

router.use(authenticate);

router.get('/', listFriends);
router.get('/requests/incoming', getIncomingRequests);
router.get('/requests/outgoing', getOutgoingRequests);
router.post('/requests/:userId', sendFriendRequest);
router.put('/requests/:id/accept', acceptFriendRequest);
router.put('/requests/:id/decline', declineFriendRequest);
router.delete('/requests/:id', cancelFriendRequest);
router.get('/suggestions', getSuggestions);
router.get('/online', getFriendsOnline);
router.get('/status/:userId', getFriendStatus);
router.get('/:userId/mutual', getMutualFriends);
router.delete('/:userId', unfriend);
router.put('/:userId/tier', setFriendTier);
router.put('/:userId/privacy', updateFriendPrivacy);

export default router;
