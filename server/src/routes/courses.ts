import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createCourse,
  listCourses,
  getCourse,
  enrollInCourse,
  completeSession,
  getMyEnrollments,
  updateCourse,
} from '../controllers/courses';

const router = Router();

router.get('/', optionalAuth, listCourses);
router.get('/my-enrollments', authenticate, getMyEnrollments);
router.get('/:id', optionalAuth, getCourse);
router.post('/', authenticate, createCourse);
router.post('/:id/enroll', authenticate, enrollInCourse);
router.post('/:id/complete-session', authenticate, completeSession);
router.patch('/:id', authenticate, updateCourse);

export default router;
