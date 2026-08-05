import { Router } from "express";
import { getMapDiscoveries } from "../controllers/discovery";

const router = Router();

router.get("/", getMapDiscoveries);

export default router;
