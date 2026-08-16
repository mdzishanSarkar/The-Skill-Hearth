import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  listCategories,
  createSkill,
  listMySkills,
  getSkill,
  updateSkill,
  deleteSkill,
  toggleSkill,
  listSkills,
  listSkillReviews,
  addSkillMedia,
  removeSkillMedia,
} from '../controllers/skills';
import { getMapDiscoveries } from '../controllers/discovery';
import { handleUpload } from '../utils/upload';

const router = Router();

router.get('/categories', listCategories);

router.post('/', authenticate, createSkill);
router.get('/mine', authenticate, listMySkills);

router.get('/', listSkills);
router.get('/geo', optionalAuth, getMapDiscoveries);
router.get('/:id', getSkill);
router.get('/:id/reviews', listSkillReviews);
router.put('/:id', authenticate, updateSkill);
router.patch('/:id/toggle', authenticate, toggleSkill);
router.delete('/:id', authenticate, deleteSkill);
router.post('/:id/media', authenticate, handleUpload('media'), addSkillMedia);
router.delete('/:id/media/:mediaId', authenticate, removeSkillMedia);

export default router;
