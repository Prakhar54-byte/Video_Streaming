/**
 * Analytics Routes
 */

import express from 'express';
import { trackPlaybackEvents, getVideoAnalytics } from '../controllers/analyticsController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoint for analytics tracking (no auth required for privacy)
router.post('/track', trackPlaybackEvents);

// Analytics summary (requires auth)
router.get('/video/:videoId', verifyJWT, getVideoAnalytics);

export default router;
