import { Router } from "express";
import {
    submitFeedback,
    getAllFeedback,
    getFeedbackStats,
    updateFeedbackStatus,
    markFeedbackAsRead,
    deleteFeedback,
    getUnreadCount
} from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { isAdmin, requireAdminKey } from "../middlewares/admin.middleware.js";

const router = Router();

router.post("/submit", submitFeedback);

router.get("/unread-count", verifyJWT, isAdmin, getUnreadCount);

router.get("/stats", verifyJWT, isAdmin, getFeedbackStats);

router.get("/all", verifyJWT, isAdmin, getAllFeedback);

router.patch("/:id/status", verifyJWT, isAdmin, updateFeedbackStatus);

router.patch("/:id/read", verifyJWT, isAdmin, markFeedbackAsRead);

router.delete("/:id", verifyJWT, isAdmin, deleteFeedback);

export default router;