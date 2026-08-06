import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createPost,
  listPosts,
  getPost,
  deletePost,
  votePost,
} from '../controllers/community';

const router = Router();

router.get('/:city/:neighborhood?', optionalAuth, listPosts);
router.get('/posts/:id', optionalAuth, getPost);
router.post('/', authenticate, createPost);
router.delete('/posts/:id', authenticate, deletePost);
router.put('/posts/:id/vote', authenticate, votePost);

export default router;
