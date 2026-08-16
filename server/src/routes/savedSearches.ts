import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listSavedSearches,
  saveSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchMatches,
} from '../controllers/savedSearch';

const router = Router();

router.get('/', authenticate, listSavedSearches);
router.post('/', authenticate, saveSearch);
router.get('/:id/matches', authenticate, getSearchMatches);
router.patch('/:id', authenticate, updateSavedSearch);
router.delete('/:id', authenticate, deleteSavedSearch);

export default router;
