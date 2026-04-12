import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet'
import { apiLimiter, authLimiter } from './middlewares/rateLimitor.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const publicDir = path.join(backendRoot, 'public')

// Production Security Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
    : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'Range'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['x-access-token', 'Content-Type', 'Authorization', 'Content-Range', 'Accept-Ranges', 'Content-Length'],
    maxAge: 86400
}));

app.use(helmet());

// Body Parsers - Standardized for Production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
app.use("/api/", apiLimiter);
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);

// Disable ETag for HLS streaming to prevent 304s
app.set('etag', false);

// Health Check
app.get("/ping", (req, res) => {
    res.json({ success: true, message: "pong" });
});

// API Cache Control
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// HLS Compatibility Redirects
app.get(/^\/temp\/hls-[^/]+\/.+$/, (req, res, next) => {
    const target = req.originalUrl.replace(/^\/temp\//, '/');
    const absoluteTarget = path.join(publicDir, target.replace(/^\//, ''));
    if (fs.existsSync(absoluteTarget)) {
        return res.redirect(301, target);
    }
    next();
});

// Static File Service
app.use(
    express.static(publicDir, {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.m3u8')) {
                res.setHeader('Content-Type', 'application/x-mpegURL');
                res.setHeader('Cache-Control', 'no-store');
            }
            if (filePath.endsWith('.ts')) {
                res.setHeader('Content-Type', 'video/mp2t');
                res.setHeader('Cache-Control', 'no-store');
            }
        },
    })
);

// --- Routes ---
import userRouter from "./routers/user.routes.js";
import likeRouter from "./routers/like.routes.js";
import tweetRouter from "./routers/tweet.routes.js";
import playlistRouter from "./routers/playlist.routes.js";  
import queueRouter from "./routers/queue.routes.js";  
import videoRouter from "./routers/video.routes.js";
import videoProcessingRouter from "./routers/videoProcessing.routes.js";
import subscriptionRouter from "./routers/subscription.routes.js";  
import commentRouter from "./routers/comment.routes.js";  
import channelRouter from "./routers/channel.routes.js";  
import videoAnalysisRouter from "./routers/videoAnalysis.route.js";
import roadmapRouter from "./routers/roadmap.routes.js";
import progressRouter from "./routers/progress.routes.js";
import feedbackRouter from "./routers/feedback.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/queue", queueRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/video-processing", videoProcessingRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/channels", channelRouter);
app.use("/api/v1/analysis", videoAnalysisRouter);
app.use("/api/v1/roadmaps", roadmapRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/feedback", feedbackRouter);

// --- Error Handling ---
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
