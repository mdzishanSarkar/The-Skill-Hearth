import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listEntries,
  getEntry,
  getConnectionEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../controllers/journal';

const router = Router();

router.get('/', authenticate, listEntries);
router.get('/connection/:connectionId', authenticate, getConnectionEntries);
router.get('/:entryId', authenticate, getEntry);
router.post('/', authenticate, createEntry);
router.put('/:entryId', authenticate, updateEntry);
router.delete('/:entryId', authenticate, deleteEntry);

export default router;
