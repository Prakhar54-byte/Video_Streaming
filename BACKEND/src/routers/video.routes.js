
import { Router } from 'express';
import {
    deleteVideo,
    getHomepageStats,
    getAllVideos,
    homepageVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    addToWatchHistory,
    // checkVideoTitle
} from "../controllers/video.controllers.js"
import {verifyJWT} from "../middlewares/authMiddleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { triggerVideoWebhook } from '../../ingestion/webhook-handlers/videoWebhook.js';

const router = Router();

router
    .route("/")
    .get(homepageVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router.route("/search").get(getAllVideos)
router.route("/stats/home").get(getHomepageStats)

// router.route("/check-title").get(checkVideoTitle)

router.route("/watchhis/:videoId").post(verifyJWT, addToWatchHistory)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);
    

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);


export default router
