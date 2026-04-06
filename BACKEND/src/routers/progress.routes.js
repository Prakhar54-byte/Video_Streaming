import { Router } from 'express';
import {
    updateProgress,
    getProgressByRoadmap
} from "../controllers/progress.controller.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();

// Protected routes (auth required)
router.use(verifyJWT);

router.route("/:roadmapId").get(getProgressByRoadmap);
router.route("/update/:roadmapId/:milestoneId").patch(updateProgress);

export default router;
