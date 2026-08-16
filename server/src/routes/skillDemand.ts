import { Router } from 'express';
import { getHeatmap } from '../controllers/skillDemand';

const router = Router();

router.get('/heatmap', getHeatmap);

export default router;
