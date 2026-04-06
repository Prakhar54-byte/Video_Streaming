import { Router } from 'express';
import {
    createRoadmap,
    getRoadmaps,
    getRoadmapById,
    enrollInRoadmap
} from "../controllers/roadmap.controller.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes
router.route("/").get(getRoadmaps);
router.route("/:roadmapId").get(getRoadmapById);

// Protected routes
router.route("/").post(verifyJWT, createRoadmap);
router.route("/enroll/:roadmapId").post(verifyJWT, enrollInRoadmap);

export default router;
