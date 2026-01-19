import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { transcodeVideo, generateHLSPlaylist, extractVideoMetadata, generateWaveformImage, generateSpriteSheetAndVtt } from '../services/videoProcessing.service.js';
import { Video } from '../models/video.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');
const publicRootDir = path.join(backendRoot, 'public');

const isTestEnv = Boolean(process.env.JEST_WORKER_ID) || process.env.NODE_ENV === 'test';

const createRedisConnection = () => {
    if (isTestEnv) return null;
    if (process.env.REDIS_DISABLED === 'true') return null;

    const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
    const host = process.env.REDIS_HOST || 'localhost';
    const redis = process.env.REDIS_URL
        ? new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
          })
        : new IORedis({
            host,
            port,
            maxRetriesPerRequest: null,
          });

    // Prevent Node from crashing on an unhandled 'error' event.
    redis.on('error', (err) => {
        console.error('[redis] connection error:', err?.message || err);
    });

    

    return redis;
};

const redisConnection = createRedisConnection();

/**
 * Detect intro start and end times using the ML Python script
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<{introStartTime: number, introEndTime: number}>}
 */
async function detectIntroTimes(videoPath) {
    try {
        const pythonScriptPath = path.resolve(backendRoot, '../processing/intro-detection/detect_intro.py');
        console.log(`[IntroDetection] Script Path: ${pythonScriptPath}`);
        console.log(`[IntroDetection] Input Video: ${videoPath}`);

        const command = `python3 "${pythonScriptPath}" "${videoPath}"`;
        console.log(`[IntroDetection] Executing: ${command}`);

        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.log(`[IntroDetection] Stderr: ${stderr}`);
        }
        console.log(`[IntroDetection] Stdout: ${stdout}`);

        let mlResult;
        try {
            mlResult = JSON.parse(stdout);
        } catch (parseError) {
            console.error("[IntroDetection] JSON Parse Error:", parseError, "Raw Output:", stdout);
            throw new Error("Failed to parse ML output");
        }

        if (mlResult && mlResult.introStartTime !== undefined && mlResult.introEndTime !== undefined) {
            console.log(`[IntroDetection] Intro detected: ${mlResult.introStartTime} - ${mlResult.introEndTime}`);
            return {
                introStartTime: mlResult.introStartTime,
                introEndTime: mlResult.introEndTime
            };
        } else if (mlResult && mlResult.error) {
            throw new Error(mlResult.error);
        } else {
            throw new Error("Invalid ML output - missing timestamps");
        }
    } catch (error) {
        console.error("[IntroDetection] Error:", error?.message || error);
        // Fallback values if intro detection fails
        console.log("[IntroDetection] Using fallback values (10s - 40s)");
        return {
            introStartTime: 10,
            introEndTime: 40
        };
    }
}

const videoProcessingQueue = redisConnection
    ? new Queue('video-processing', { connection: redisConnection })
    : null;

const videoProcessingWorker = redisConnection
    ? new Worker('video-processing', async job => {
    const { videoId, videoFileLocalPath } = job.data;

    try {
        // Helper to update processing stage
        const updateStage = async (stage, progress = 0) => {
            await Video.findByIdAndUpdate(videoId, { 
                processingStage: stage, 
                processingProgress: progress 
            });
            console.log(`[Queue] Video ${videoId} stage: ${stage} (${progress}%)`);
        };

        // 1. Update status to 'processing'
        await Video.findByIdAndUpdate(videoId, { processingStatus: 'processing' });

        // 2. Transcode to a default quality (e.g., 720p)
        await updateStage('transcode', 0);
        const outputFileName = `processed-${Date.now()}.mp4`;
        const outputPath = `public/temp/${outputFileName}`;
        await transcodeVideo(videoFileLocalPath, outputPath, '720p');
        await updateStage('transcode', 100);

        // 3. Generate HLS playlist
        await updateStage('hls', 0);
        const hlsOutputDir = `public/hls-${videoId}`;
        const hlsPlaylist = await generateHLSPlaylist(outputPath, hlsOutputDir);
        await updateStage('hls', 100);

        const publicRoot = publicRootDir;
        const toPublicRel = (p) => {
            if (!p || typeof p !== 'string') return p;
            const abs = path.isAbsolute(p) ? p : path.join(backendRoot, p);
            const rel = path.relative(publicRoot, abs);
            return rel.split(path.sep).join('/');
        };

        // 4. Extract metadata
        const metadata = await extractVideoMetadata(outputPath);

        // 4.1 Generate thumbnails and waveform
        await updateStage('thumbnails', 0);
        const waveformPath = `public/temp/waveform-${videoId}.png`;
        let waveformUrl;
        try {
            await generateWaveformImage(outputPath, waveformPath, { width: 1200, height: 120 });
            waveformUrl = toPublicRel(waveformPath);
        } catch (e) {
            console.warn(`Waveform generation failed for video ${videoId}:`, e?.message || e);
        }

        // 4.2 Generate sprite sheet + VTT for hover/scrub thumbnails
        const spritesDir = path.join(publicRoot, 'temp', `sprites-${videoId}`);
        let spriteSheetUrl;
        let spriteSheetVttUrl;
        try {
            const result = await generateSpriteSheetAndVtt(outputPath, spritesDir, {
                intervalSeconds: 10,
                tileWidth: 160,
                tileHeight: 90,
                maxThumbnails: 100,
            });
            spriteSheetUrl = toPublicRel(result.spriteSheetPath);
            spriteSheetVttUrl = toPublicRel(result.vttPath);
        } catch (e) {
            console.warn(`Sprite/VTT generation failed for video ${videoId}:`, e?.message || e);
        }
        await updateStage('thumbnails', 100);

        // 4.3 Detect intro start and end times using ML
        await updateStage('intro', 0);
        console.log(`[Queue] Starting intro detection for video ${videoId}`);
        const introTimes = await detectIntroTimes(videoFileLocalPath);
        console.log(`[Queue] Intro detection complete for video ${videoId}:`, introTimes);
        await updateStage('intro', 100);

        // 5. Update video document with processed data including intro times
        await updateStage('complete', 100);
        await Video.findByIdAndUpdate(videoId, {
            videoFiles: outputPath,
            hlsMasterPlaylist: toPublicRel(hlsPlaylist.masterPlaylist),
            duration: metadata.duration,
            processingStatus: 'completed',
            processingStage: 'complete',
            processingProgress: 100,
            ...(waveformUrl ? { waveformUrl } : {}),
            ...(spriteSheetUrl ? { spriteSheetUrl } : {}),
            ...(spriteSheetVttUrl ? { spriteSheetVttUrl } : {}),
            introStartTime: introTimes.introStartTime,
            introEndTime: introTimes.introEndTime,
        });

        console.log(`Video ${videoId} processed successfully with intro times: ${introTimes.introStartTime}s - ${introTimes.introEndTime}s`);

    } catch (error) {
        await Video.findByIdAndUpdate(videoId, { processingStatus: 'failed', processingStage: null });
        console.error(`Failed to process video ${videoId}:`, error);
        // Optional: Implement retry logic or move to a failed jobs queue
    }
    }, {
        connection: redisConnection
    })
    : null;

videoProcessingWorker?.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

videoProcessingWorker?.on('failed', (job, err) => {
    console.log(`Job ${job.id} has failed with ${err.message}`);
});

export const addVideoToQueue = (videoId, videoFileLocalPath) => {
    if (isTestEnv) {
        // Integration tests should not require Redis.
        return Promise.resolve({ id: 'test-job' });
    }
    if (!videoProcessingQueue) {
        return Promise.reject(new Error('Redis queue is disabled/unavailable'));
    }
    return videoProcessingQueue.add(
        'process-video',
        { videoId, videoFileLocalPath },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );
};

export default videoProcessingQueue;
