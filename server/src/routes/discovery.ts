import { Router } from "express";
import { optionalAuth } from "../middleware/auth";
import { getMapDiscoveries } from "../controllers/discovery";

const router = Router();

router.get("/", optionalAuth, getMapDiscoveries);

export default router;
