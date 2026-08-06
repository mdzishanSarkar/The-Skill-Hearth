import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { installBot, uninstallBot, listBots, handleSlashCommand } from '../controllers/bots';

const router = Router();

router.get('/', authenticate, listBots);
router.post('/', authenticate, installBot);
router.delete('/:id', authenticate, uninstallBot);
router.post('/command', authenticate, handleSlashCommand);

export default router;
