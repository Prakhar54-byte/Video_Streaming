
import "dotenv/config";
import mongoose from "mongoose";
import { Video } from "../BACKEND/src/models/video.model.js";
import connectDB from "../BACKEND/src/db/index.js";
import { uploadOnCloudinary } from "../BACKEND/src/utils/cloudinary.js";
import { ApiError } from "../BACKEND/src/utils/ApiError.js";
import ffmpeg from 'fluent-ffmpeg';
import fs from "fs-extra"; // Using fs-extra for recursive directory operations
import path from "path";
import { fileURLToPath } from "url";

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// --- HLS Transcoding Logic ---

const generateHLS = (filePath, outputDir) => {
    const watermarkPath = path.join(projectRoot, 'BACKEND', 'public', 'watermark.svg');
    
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .input(watermarkPath)
            .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                '-preset veryfast',
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ])
            .complexFilter('[1:v]scale=150:-1[wm];[0:v][wm]overlay=W-w-10:H-h-10')
            .output(path.join(outputDir, 'playlist.m3u8'))
            .on('end', () => resolve("HLS generation completed."))
            .on('error', (err) => reject(new ApiError(500, `HLS generation failed: ${err.message}`)))
            .run();
    });
};


const uploadHLSFiles = async (hlsDir, videoId) => {
    const files = await fs.readdir(hlsDir);
    const uploadPromises = files.map(file => {
        const localPath = path.join(hlsDir, file);
        // The public_id will create a folder structure in Cloudinary
        const public_id = `hls/${videoId}/${path.parse(file).name}`;
        return uploadOnCloudinary(localPath, { public_id, resource_type: "raw" });
    });

    const results = await Promise.all(uploadPromises);
    
    const masterPlaylistUrl = results.find(res => res.public_id.endsWith('playlist'))?.secure_url;

    if (!masterPlaylistUrl) {
        throw new ApiError(500, "Master playlist URL not found after upload.");
    }
    
    // We need to manually adjust the URL for HLS playback in many players
    // by replacing /upload/ with /video/upload/ and adding transformations.
    // For now, we'll return the raw URL and handle transformations on the frontend player if needed.
    return masterPlaylistUrl;
};


const generateWebPPreview = (filePath, outputWebpPath, duration) => {
    // Start 20% into the video, or at 1 minute if the video is very long
    const startTime = Math.min(60, duration * 0.2); 
    
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .seekInput(startTime) // Start 20% into the video
            .duration(3) // 3 seconds clip
            .outputOptions([
                '-vf scale=320:-1:flags=lanczos,fps=10', // Scale to 320px width, 10 fps
                '-loop 0', // Loop indefinitely
                '-c:v libwebp', // Use libwebp codec
                '-lossless 0', // Lossy compression
                '-q:v 75', // Quality factor
                '-preset default' // Encoding preset
            ])
            .output(outputWebpPath)
            .on('end', () => resolve("WebP preview generation completed."))
            .on('error', (err) => reject(new ApiError(500, `WebP preview generation failed: ${err.message}`)))
            .run();
    });
};


const generateWaveform = (filePath, outputWaveformPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .outputOptions([
                '-filter_complex', 'aformat=channel_layouts=mono,compand,showwavespic=s=1200x120:colors=cyan',
                '-frames:v 1'
            ])
            .output(outputWaveformPath)
            .on('end', () => resolve("Waveform generation completed."))
            .on('error', (err) => reject(new ApiError(500, `Waveform generation failed: ${err.message}`)))
            .run();
    });
};


const generateSpriteSheetAndVtt = (filePath, outputDir, duration) => {
    const spriteSheetPath = path.join(outputDir, 'sprite.jpg');
    const vttPath = path.join(outputDir, 'sprite.vtt');
    const thumbnailWidth = 160;
    const thumbnailHeight = 90; // Assuming 16:9 aspect ratio
    const interval = 10; // seconds
    const columns = 10;

    return new Promise((resolve, reject) => {
        // 1. Generate the sprite sheet
        ffmpeg(filePath)
            .outputOptions([
                `-vf fps=1/${interval},scale=${thumbnailWidth}:-1,tile=${columns}x${columns}`,
                '-q:v 2'
            ])
            .output(spriteSheetPath)
            .on('end', async () => {
                try {
                    // 2. Generate the VTT file
                    let vttContent = 'WEBVTT\n\n';
                    const numThumbnails = Math.floor(duration / interval);
                    for (let i = 0; i < numThumbnails; i++) {
                        const startTime = i * interval;
                        const endTime = (i + 1) * interval;
                        
                        const x = (i % columns) * thumbnailWidth;
                        const y = Math.floor(i / columns) * thumbnailHeight;

                        vttContent += `${new Date(startTime * 1000).toISOString().substr(11, 12)} --> ${new Date(endTime * 1000).toISOString().substr(11, 12)}\n`;
                        vttContent += `sprite.jpg#xywh=${x},${y},${thumbnailWidth},${thumbnailHeight}\n\n`;
                    }
                    await fs.writeFile(vttPath, vttContent);
                    resolve("Sprite sheet and VTT generation completed.");
                } catch (vttError) {
                    reject(new ApiError(500, `VTT file generation failed: ${vttError.message}`));
                }
            })
            .on('error', (err) => reject(new ApiError(500, `Sprite sheet generation failed: ${err.message}`)))
            .run();
    });
};


const detectIntro = (filePath, outputTxtPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .outputOptions([
                '-filter_complex', 'select=\'gt(scene,0.4)\',metadata=print:file=-',
                '-f', 'null'
            ])
            .on('end', () => resolve("Scene detection completed."))
            .on('error', (err) => reject(new ApiError(500, `Scene detection failed: ${err.message}`)))
            .on('data', (chunk) => {
                // This is a workaround to capture the metadata output directly
                // since writing to a file with fluent-ffmpeg can be tricky with this filter.
                fs.appendFileSync(outputTxtPath, chunk.toString());
            })
            .run();
    });
};

const parseIntroTimestamps = async (filePath) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const timestamps = [];
    for (const line of lines) {
        if (line.startsWith('frame')) {
            const ptsTimeMatch = line.match(/pts_time:(\d+\.\d+)/);
            if (ptsTimeMatch) {
                timestamps.push(parseFloat(ptsTimeMatch[1]));
            }
        }
    }

    // Simple heuristic: find the first two scene changes after 5s and before 3min
    const potentialIntroStart = timestamps.find(t => t > 5);
    if (!potentialIntroStart) return null;

    const potentialIntroEnd = timestamps.find(t => t > potentialIntroStart + 5 && t < 180);
    if (!potentialIntroEnd) return null;

    return {
        introStartTime: Math.floor(potentialIntroStart),
        introEndTime: Math.floor(potentialIntroEnd)
    };
};


const processVideo = async () => {
    let video = null;
    let hlsOutputDir = null;
    let webpTempPath = null;
    let waveformTempPath = null;
    let spriteSheetDir = null;
    let sceneChangesPath = null;

    try {
        console.log("Searching for a video to process...");
        video = await Video.findOneAndUpdate(
            { processingStatus: "processing" },
            { $set: { processingStatus: "transcoding" } },
            { new: true }
        );

        if (!video) {
            console.log("No videos to process. Waiting...");
            return;
        }

        console.log(`Processing video: ${video.title} (${video._id})`);

        const videoLocalPath = video.videoFiles;
        
        const duration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoLocalPath, (err, metadata) => {
                if (err) return reject(err);
                resolve(metadata.format.duration);
            });
        });
        video.duration = Math.floor(duration);

        hlsOutputDir = path.join(projectRoot, 'BACKEND', 'public', 'temp', 'hls', video._id.toString());
        await fs.ensureDir(hlsOutputDir);

        // 1. Generate HLS segments
        console.log("Generating HLS segments...");
        await generateHLS(videoLocalPath, hlsOutputDir);
        console.log("HLS segments generated.");

        // 2. Upload HLS files to Cloudinary
        console.log("Uploading HLS files to Cloudinary...");
        const masterPlaylistUrl = await uploadHLSFiles(hlsOutputDir, video._id.toString());
        console.log("HLS files uploaded.");

        // 3. Generate and upload WebP preview
        console.log("Generating WebP preview...");
        webpTempPath = path.join(projectRoot, 'BACKEND', 'public', 'temp', `${video._id}-preview.webp`);
        await generateWebPPreview(videoLocalPath, webpTempPath, duration);
        const webpUploadResponse = await uploadOnCloudinary(webpTempPath, { public_id: `previews/${video._id}`, resource_type: "image" });
        if (webpUploadResponse) video.previewAnimationUrl = webpUploadResponse.secure_url;
        console.log("WebP preview generated and uploaded.");

        // 4. Generate and upload Waveform image
        console.log("Generating waveform image...");
        waveformTempPath = path.join(projectRoot, 'BACKEND', 'public', 'temp', `${video._id}-waveform.png`);
        await generateWaveform(videoLocalPath, waveformTempPath);
        const waveformUploadResponse = await uploadOnCloudinary(waveformTempPath, { public_id: `waveforms/${video._id}`, resource_type: "image" });
        if (waveformUploadResponse) video.waveformUrl = waveformUploadResponse.secure_url;
        console.log("Waveform image generated and uploaded.");

        // 5. Generate and upload Sprite Sheet and VTT
        console.log("Generating sprite sheet and VTT...");
        spriteSheetDir = path.join(projectRoot, 'BACKEND', 'public', 'temp', 'sprites', video._id.toString());
        await fs.ensureDir(spriteSheetDir);
        await generateSpriteSheetAndVtt(videoLocalPath, spriteSheetDir, duration);
        const spriteSheetUploadResponse = await uploadOnCloudinary(path.join(spriteSheetDir, 'sprite.jpg'), { public_id: `sprites/${video._id}/sprite`, resource_type: "image" });
        const vttUploadResponse = await uploadOnCloudinary(path.join(spriteSheetDir, 'sprite.vtt'), { public_id: `sprites/${video._id}/sprite`, resource_type: "raw" });
        if (spriteSheetUploadResponse) video.spriteSheetUrl = spriteSheetUploadResponse.secure_url;
        if (vttUploadResponse) video.spriteSheetVttUrl = vttUploadResponse.secure_url;
        console.log("Sprite sheet and VTT generated and uploaded.");

        // 6. Detect Intro
        console.log("Detecting intro...");
        sceneChangesPath = path.join(projectRoot, 'BACKEND', 'public', 'temp', `${video._id}-scenes.txt`);
        await detectIntro(videoLocalPath, sceneChangesPath);
        const introTimestamps = await parseIntroTimestamps(sceneChangesPath);
        if (introTimestamps) {
            video.introStartTime = introTimestamps.introStartTime;
            video.introEndTime = introTimestamps.introEndTime;
        }
        console.log("Intro detection complete.");

        // 7. Upload thumbnail (if it exists)
        let thumbnailUploadResponse = null;
        if (video.thumbnail) {
            thumbnailUploadResponse = await uploadOnCloudinary(video.thumbnail);
        }

        // 8. Update the video document
        video.hlsMasterPlaylist = masterPlaylistUrl;
        video.thumbnail = thumbnailUploadResponse?.secure_url || video.thumbnail;
        video.processingStatus = "completed";
        video.isPublished = true;
        
        await video.save();
        console.log(`Successfully processed video: ${video.title} (${video._id})`);

    } catch (error) {
        console.error("Error processing video:", error);
        if (video) {
            video.processingStatus = "failed";
            await video.save();
        }
    } finally {
        // 9. Cleanup local files
        if (video) {
            await fs.unlink(video.videoFiles).catch(e => console.error("Error deleting video file:", e));
            if (video.thumbnail && video.thumbnail.startsWith(projectRoot)) {
                 await fs.unlink(video.thumbnail).catch(e => console.error("Error deleting thumbnail file:", e));
            }
        }
        if (hlsOutputDir) await fs.remove(hlsOutputDir).catch(e => console.error("Error deleting HLS directory:", e));
        if (webpTempPath) await fs.unlink(webpTempPath).catch(e => console.error("Error deleting WebP preview file:", e));
        if (waveformTempPath) await fs.unlink(waveformTempPath).catch(e => console.error("Error deleting waveform file:", e));
        if (spriteSheetDir) await fs.remove(spriteSheetDir).catch(e => console.error("Error deleting sprite sheet directory:", e));
        if (sceneChangesPath) await fs.unlink(sceneChangesPath).catch(e => console.error("Error deleting scene changes file:", e));
        
        console.log(`Cleanup complete for video: ${video?._id}`);
    }
};

const run = async () => {
    try {
        await connectDB();
        console.log("Video processing worker started.");
        setInterval(processVideo, 15000); // Check for new videos every 15 seconds
    } catch (error) {
        console.error("Failed to start video processing worker:", error);
        process.exit(1);
    }
};

run();

