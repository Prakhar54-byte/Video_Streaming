import { Router} from 'express';
import {verifyJWT} from '../middlewares/authMiddleware.js';
import { getQueue, addToQueue, clearQueue, removeFromQueue } from '../controllers/queue.controller.js';

const router = Router();

// Protect all routes below
router.use(verifyJWT);

// GET /api/v1/queue/ - Get user's queue
router.route("/")
    .get(getQueue)
    .delete(clearQueue);


router.route("/add/:videoId").post(addToQueue);
router.route("/remove/:videoId").delete(removeFromQueue);

export default router;