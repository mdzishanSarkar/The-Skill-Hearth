import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  connectCalendar,
  getCalendarIntegration,
  disconnectCalendar,
  syncConnection,
  listCalendarEvents,
  removeCalendarEvent,
} from '../controllers/calendars';

const router = Router();

router.get('/', authenticate, getCalendarIntegration);
router.get('/events', authenticate, listCalendarEvents);
router.post('/', authenticate, connectCalendar);
router.post('/sync', authenticate, syncConnection);
router.delete('/:provider', authenticate, disconnectCalendar);
router.delete('/:provider/events/:externalId', authenticate, removeCalendarEvent);

export default router;
