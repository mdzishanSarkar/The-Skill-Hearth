import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getFeed, getUserFeed, reactToEvent } from '../controllers/feed';

const router = Router();

router.use(authenticate);

router.get('/', getFeed);
router.get('/user/:userId', getUserFeed);
router.post('/:eventId/react', reactToEvent);

export default router;
