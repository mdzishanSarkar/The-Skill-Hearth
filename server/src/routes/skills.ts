import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
} from '../controllers/skills';

const router = Router();

router.get('/categories', listCategories);

router.post('/', authenticate, createSkill);
router.get('/mine', authenticate, listMySkills);

router.get('/', listSkills);
router.get('/:id', getSkill);
router.get('/:id/reviews', listSkillReviews);
router.put('/:id', authenticate, updateSkill);
router.patch('/:id/toggle', authenticate, toggleSkill);
router.delete('/:id', authenticate, deleteSkill);

export default router;
