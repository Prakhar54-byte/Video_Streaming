
/**
 * Video Analysis Routes
 * API endpoints for WASM-powered video analysis
 */
import {Router} from "express";

const router = Router();
// const videoAnalysisController = require("../controllers/videoAnalysis.controller");
// const { verifyJWT } = require(".
// ./middlewares/auth.middleware");
import { analyzeVideoQuality,
  detectDuplicates,
  checkDuplicateByFingerprint,
  extractKeyframes,
  generateSmartThumbnail,
  generateAnimatedThumbnail,
  generateSpriteSheet,
  analyzeAudioIntro,
  generateWaveform,
  getProcessingStatus,
} from "../controllers/videoAnalysis.controller.js"

import { verifyJWT } from "../middlewares/authMiddleware.js";
// All routes require authentication
router.use(verifyJWT);

/**
 * @route POST /api/v1/analysis/quality
 * @desc Analyze video quality and generate comprehensive report
 * @access Private
 */
router.post("/quality", analyzeVideoQuality);

/**
 * @route POST /api/v1/analysis/duplicates
 * @desc Detect duplicate videos using perceptual hashing
 * @access Private
 */
router.post("/duplicates", detectDuplicates);

/**
 * @route POST /api/v1/analysis/check-duplicate
 * @desc Check if video is duplicate using fingerprint from frontend
 * @access Private
 */
router.post("/check-duplicate", checkDuplicateByFingerprint);

/**
 * @route POST /api/v1/analysis/keyframes
 * @desc Extract keyframes from video
 * @access Private
 */
router.post("/keyframes", extractKeyframes);

/**
 * @route POST /api/v1/analysis/thumbnail/smart
 * @desc Generate smart thumbnail using best frame selection
 * @access Private
 */
router.post("/thumbnail/smart", generateSmartThumbnail);

/**
 * @route POST /api/v1/analysis/thumbnail/animated
 * @desc Generate animated GIF thumbnail
 * @access Private
 */
router.post("/thumbnail/animated", generateAnimatedThumbnail);

/**
 * @route POST /api/v1/analysis/sprite-sheet
 * @desc Generate sprite sheet for video scrubbing preview
 * @access Private
 */
router.post("/sprite-sheet", generateSpriteSheet);

/**
 * @route POST /api/v1/analysis/audio/intro
 * @desc Analyze audio for intro detection
 * @access Private
 */
router.post("/audio/intro", analyzeAudioIntro);

/**
 * @route POST /api/v1/analysis/waveform
 * @desc Generate audio waveform visualization
 * @access Private
 */
router.post("/waveform", generateWaveform);

/**
 * @route GET /api/v1/analysis/status/:videoId
 * @desc Get video processing status
 * @access Private
 */
router.get("/status/:videoId", getProcessingStatus);


export default router;
