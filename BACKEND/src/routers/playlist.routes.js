import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js"
import {verifyJWT} from "../middlewares/authMiddleware.js"

const router = Router();

// Public routes (no auth needed)
router.route("/user/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById);

// Protected routes (auth required)
router.route("/").post(verifyJWT, createPlaylist);

router
    .route("/:playlistId")
    .patch(verifyJWT, updatePlaylist)
    .delete(verifyJWT, deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(verifyJWT, addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(verifyJWT, removeVideoFromPlaylist);

export default router