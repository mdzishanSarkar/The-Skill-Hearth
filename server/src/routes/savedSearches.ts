import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  saveSearch,
  listSavedSearches,
  updateSavedSearch,
  deleteSavedSearch,
} from '../controllers/savedSearch';

const router = Router();

router.post('/', authenticate, saveSearch);
router.get('/', authenticate, listSavedSearches);
router.patch('/:id', authenticate, updateSavedSearch);
router.delete('/:id', authenticate, deleteSavedSearch);

export default router;
