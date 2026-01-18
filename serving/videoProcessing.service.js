/**
 * Enhanced Video Processing Service
 * Combines FFmpeg commands with WASM-powered analysis
 */

import Ffmpeg from "fluent-ffmpeg";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// QUALITY PRESETS
// ============================================================================

const QUALITY_PRESETS = {
    '240p': { width: 426, height: 240, videoBitrate: '400k', audioBitrate: '64k', maxrate: '400k', bufsize: '800k' },
    '360p': { width: 640, height: 360, videoBitrate: '800k', audioBitrate: '96k', maxrate: '800k', bufsize: '1600k' },
    '480p': { width: 854, height: 480, videoBitrate: '1500k', audioBitrate: '128k', maxrate: '1500k', bufsize: '3000k' },
    '720p': { width: 1280, height: 720, videoBitrate: '3000k', audioBitrate: '128k', maxrate: '3000k', bufsize: '6000k' },
    '1080p': { width: 1920, height: 1080, videoBitrate: '6000k', audioBitrate: '192k', maxrate: '6000k', bufsize: '12000k' },
    '4k': { width: 3840, height: 2160, videoBitrate: '15000k', audioBitrate: '256k', maxrate: '15000k', bufsize: '30000k' },
};

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

/**
 * Extract comprehensive video metadata using ffprobe
 */
export const extractVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        Ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

            resolve({
                duration: metadata.format?.duration || 0,
                bitrate: metadata.format?.bit_rate || 0,
                size: metadata.format?.size || 0,
                format: metadata.format?.format_name || 'unknown',
                videoCodec: videoStream?.codec_name || 'unknown',
                audioCodec: audioStream?.codec_name || 'unknown',
                width: videoStream?.width || 0,
                height: videoStream?.height || 0,
                fps: videoStream?.avg_frame_rate ? eval(videoStream.avg_frame_rate) : 0,
                aspectRatio: videoStream?.display_aspect_ratio || 'unknown',
                audioChannels: audioStream?.channels || 0,
                audioSampleRate: audioStream?.sample_rate || 0,
                colorSpace: videoStream?.color_space || 'unknown',
                pixelFormat: videoStream?.pix_fmt || 'unknown',
                hasAudio: !!audioStream,
                hasVideo: !!videoStream,
            });
        });
    });
};

// ============================================================================
// SCENE DETECTION (FFmpeg + WASM hybrid)
// ============================================================================

/**
 * Detect scene changes using FFmpeg's scene filter
 * Returns timestamps where scenes change
 */
export const detectSceneChanges = (inputPath, threshold = 0.4) => {
    return new Promise((resolve, reject) => {
        const scenes = [];
        
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, `select='gt(scene,${threshold})',showinfo`,
                `-vsync`, `vfr`,
                `-f`, `null`
            ])
            .output('-')
            .on('stderr', (line) => {
                // Parse showinfo output for timestamps
                const match = line.match(/pts_time:(\d+\.?\d*)/);
                if (match) {
                    scenes.push(parseFloat(match[1]));
                }
            })
            .on('end', () => resolve(scenes))
            .on('error', reject)
            .run();
    });
};

/**
 * Detect black frames for intro/outro detection
 */
export const detectBlackFrames = (inputPath, duration = 0.1, threshold = 0.1) => {
    return new Promise((resolve, reject) => {
        const blackFrames = [];
        
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, `blackdetect=d=${duration}:pix_th=${threshold}`,
                `-an`,
                `-f`, `null`
            ])
            .output('-')
            .on('stderr', (line) => {
                const match = line.match(/black_start:(\d+\.?\d*)\s+black_end:(\d+\.?\d*)/);
                if (match) {
                    blackFrames.push({
                        start: parseFloat(match[1]),
                        end: parseFloat(match[2])
                    });
                }
            })
            .on('end', () => resolve(blackFrames))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// AUDIO ANALYSIS
// ============================================================================

/**
 * Analyze audio loudness using EBU R128 standard
 */
export const analyzeAudioLoudness = (inputPath) => {
    return new Promise((resolve, reject) => {
        let loudnessData = {};
        
        Ffmpeg(inputPath)
            .outputOptions([
                `-af`, `loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json`,
                `-f`, `null`
            ])
            .output('-')
            .on('stderr', (line) => {
                try {
                    // Parse JSON output from loudnorm filter
                    if (line.includes('input_i') || line.includes('input_tp')) {
                        const jsonStr = line.match(/\{[^}]+\}/);
                        if (jsonStr) {
                            loudnessData = { ...loudnessData, ...JSON.parse(jsonStr[0]) };
                        }
                    }
                } catch (e) { /* ignore parsing errors */ }
            })
            .on('end', () => resolve(loudnessData))
            .on('error', reject)
            .run();
    });
};

/**
 * Extract raw audio samples for WASM analysis
 */
export const extractAudioSamples = (inputPath, outputPath, sampleRate = 8000) => {
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-ac`, `1`,
                `-ar`, `${sampleRate}`,
                `-f`, `f32le`,
                `-acodec`, `pcm_f32le`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Detect silence periods (useful for chapter detection)
 */
export const detectSilence = (inputPath, minDuration = 1.0, noiseThreshold = -50) => {
    return new Promise((resolve, reject) => {
        const silences = [];
        
        Ffmpeg(inputPath)
            .outputOptions([
                `-af`, `silencedetect=n=${noiseThreshold}dB:d=${minDuration}`,
                `-f`, `null`
            ])
            .output('-')
            .on('stderr', (line) => {
                const startMatch = line.match(/silence_start:\s*(\d+\.?\d*)/);
                const endMatch = line.match(/silence_end:\s*(\d+\.?\d*)/);
                
                if (startMatch) {
                    silences.push({ start: parseFloat(startMatch[1]), end: null });
                }
                if (endMatch && silences.length > 0) {
                    silences[silences.length - 1].end = parseFloat(endMatch[1]);
                }
            })
            .on('end', () => resolve(silences))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// QUALITY ENHANCEMENT
// ============================================================================

/**
 * Normalize audio levels using EBU R128
 */
export const normalizeAudio = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-af`, `loudnorm=I=-16:TP=-1.5:LRA=11`,
                `-c:v`, `copy`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Apply video denoising for low-quality uploads
 */
export const denoiseVideo = (inputPath, outputPath, strength = 'light') => {
    const strengths = {
        light: 'nlmeans=s=2:p=5:r=10',
        medium: 'nlmeans=s=3:p=7:r=15',
        heavy: 'nlmeans=s=5:p=9:r=20'
    };
    
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, strengths[strength] || strengths.light,
                `-c:a`, `copy`
            ])
            .output(outputPath)
            .on('progress', (progress) => console.log(`Denoising: ${progress.percent?.toFixed(1)}%`))
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Enhance video quality (sharpen, contrast)
 */
export const enhanceVideo = (inputPath, outputPath, options = {}) => {
    const filters = [];
    
    if (options.sharpen !== false) {
        filters.push('unsharp=5:5:1.0:5:5:0.0');
    }
    if (options.contrast) {
        filters.push('eq=contrast=1.1:brightness=0.02:saturation=1.1');
    }
    if (options.stabilize) {
        filters.push('vidstabdetect,vidstabtransform=smoothing=10');
    }
    
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, filters.join(','),
                `-c:a`, `copy`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// ADVANCED HLS GENERATION
// ============================================================================

/**
 * Generate HLS with hardware acceleration (if available)
 */
export const generateHLSWithHardwareAccel = async (inputPath, outputDir, qualities = ['360p', '480p', '720p']) => {
    await fs.mkdir(outputDir, { recursive: true });
    
    const metadata = await extractVideoMetadata(inputPath);
    const originalWidth = metadata.width;
    
    // Filter qualities based on original resolution
    const availableQualities = qualities.filter(q => {
        const preset = QUALITY_PRESETS[q];
        return preset && preset.width <= originalWidth;
    });

    const variants = [];
    
    for (const quality of availableQualities) {
        const preset = QUALITY_PRESETS[quality];
        const variantDir = path.join(outputDir, quality);
        await fs.mkdir(variantDir, { recursive: true });
        
        const playlistPath = path.join(variantDir, 'playlist.m3u8');
        
        await new Promise((resolve, reject) => {
            Ffmpeg(inputPath)
                // Try hardware acceleration first (falls back to software)
                .inputOptions(['-hwaccel', 'auto'])
                .outputOptions([
                    `-vf`, `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease`,
                    `-c:v`, `libx264`,
                    `-preset`, `fast`,
                    `-crf`, `23`,
                    `-b:v`, preset.videoBitrate,
                    `-maxrate`, preset.maxrate,
                    `-bufsize`, preset.bufsize,
                    `-c:a`, `aac`,
                    `-b:a`, preset.audioBitrate,
                    `-ac`, `2`,
                    `-hls_time`, `4`,
                    `-hls_playlist_type`, `vod`,
                    `-hls_segment_filename`, path.join(variantDir, 'segment%03d.ts'),
                    `-movflags`, `+faststart`
                ])
                .output(playlistPath)
                .on('progress', (progress) => {
                    console.log(`HLS ${quality}: ${progress.percent?.toFixed(1)}%`);
                })
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        
        variants.push({
            quality,
            resolution: `${preset.width}x${preset.height}`,
            bandwidth: parseInt(preset.videoBitrate) * 1000,
            playlist: playlistPath,
        });
    }
    
    // Generate master playlist
    const masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n' +
        variants.map(v => 
            `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.resolution}\n${v.quality}/playlist.m3u8`
        ).join('\n');
    
    const masterPath = path.join(outputDir, 'master.m3u8');
    await fs.writeFile(masterPath, masterContent);
    
    return { masterPlaylist: masterPath, variants };
};

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

/**
 * Extract keyframes for intelligent thumbnail selection
 */
export const extractKeyframes = (inputPath, outputDir, maxFrames = 20) => {
    return new Promise(async (resolve, reject) => {
        await fs.mkdir(outputDir, { recursive: true });
        
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, `select='eq(pict_type\\,I)*gt(scene\\,0.3)',scale=320:-1`,
                `-vsync`, `vfr`,
                `-q:v`, `2`,
                `-frames:v`, `${maxFrames}`
            ])
            .output(path.join(outputDir, 'keyframe_%03d.jpg'))
            .on('end', async () => {
                const files = await fs.readdir(outputDir);
                const keyframes = files
                    .filter(f => f.startsWith('keyframe_'))
                    .map(f => path.join(outputDir, f));
                resolve(keyframes);
            })
            .on('error', reject)
            .run();
    });
};

/**
 * Generate animated thumbnail (GIF/WebP preview)
 */
export const generateAnimatedThumbnail = (inputPath, outputPath, options = {}) => {
    const {
        startTime = 'auto',
        duration = 3,
        width = 320,
        fps = 10,
        format = 'webp'
    } = options;
    
    return new Promise(async (resolve, reject) => {
        let seekTime = startTime;
        
        if (startTime === 'auto') {
            const metadata = await extractVideoMetadata(inputPath);
            seekTime = Math.min(60, metadata.duration * 0.2);
        }
        
        const outputOptions = format === 'webp' 
            ? [
                `-vf`, `scale=${width}:-1:flags=lanczos,fps=${fps}`,
                `-loop`, `0`,
                `-c:v`, `libwebp`,
                `-lossless`, `0`,
                `-q:v`, `75`,
                `-preset`, `default`
            ]
            : [
                `-vf`, `scale=${width}:-1:flags=lanczos,fps=${fps},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
            ];
        
        Ffmpeg(inputPath)
            .seekInput(seekTime)
            .duration(duration)
            .outputOptions(outputOptions)
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// SPRITE SHEET GENERATION
// ============================================================================

/**
 * Generate sprite sheet and VTT for video scrubbing
 */
export const generateSpriteSheet = async (inputPath, outputDir, options = {}) => {
    const {
        interval = 10,
        tileWidth = 160,
        tileHeight = 90,
        columns = 10
    } = options;
    
    await fs.mkdir(outputDir, { recursive: true });
    
    const metadata = await extractVideoMetadata(inputPath);
    const duration = metadata.duration;
    const frameCount = Math.ceil(duration / interval);
    const rows = Math.ceil(frameCount / columns);
    
    const spriteSheetPath = path.join(outputDir, 'sprite.jpg');
    const vttPath = path.join(outputDir, 'sprite.vtt');
    
    // Generate sprite sheet
    await new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, `fps=1/${interval},scale=${tileWidth}:${tileHeight}:force_original_aspect_ratio=decrease,pad=${tileWidth}:${tileHeight}:(ow-iw)/2:(oh-ih)/2,tile=${columns}x${rows}`,
                `-frames:v`, `1`,
                `-q:v`, `3`
            ])
            .output(spriteSheetPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
    
    // Generate VTT file
    let vttContent = 'WEBVTT\n\n';
    for (let i = 0; i < frameCount; i++) {
        const startTime = i * interval;
        const endTime = Math.min((i + 1) * interval, duration);
        const x = (i % columns) * tileWidth;
        const y = Math.floor(i / columns) * tileHeight;
        
        vttContent += `${formatVttTime(startTime)} --> ${formatVttTime(endTime)}\n`;
        vttContent += `sprite.jpg#xywh=${x},${y},${tileWidth},${tileHeight}\n\n`;
    }
    
    await fs.writeFile(vttPath, vttContent);
    
    return { spriteSheetPath, vttPath, frameCount, columns, rows };
};

// ============================================================================
// WAVEFORM GENERATION
// ============================================================================

/**
 * Generate audio waveform image
 */
export const generateWaveform = (inputPath, outputPath, options = {}) => {
    const { width = 1200, height = 120, color = 'cyan' } = options;
    
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-filter_complex`, `aformat=channel_layouts=mono,compand,showwavespic=s=${width}x${height}:colors=${color}`,
                `-frames:v`, `1`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Generate waveform data (for custom rendering)
 */
export const extractWaveformData = (inputPath, outputPath, points = 1000) => {
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-ac`, `1`,
                `-ar`, `${points}`,
                `-f`, `f32le`,
                `-acodec`, `pcm_f32le`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// VIDEO EDITING UTILITIES
// ============================================================================

/**
 * Trim video segment
 */
export const trimVideo = (inputPath, outputPath, startTime, endTime) => {
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(endTime - startTime)
            .outputOptions([
                `-c:v`, `libx264`,
                `-c:a`, `aac`,
                `-preset`, `fast`,
                `-crf`, `23`,
                `-movflags`, `+faststart`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Concatenate multiple videos
 */
export const concatenateVideos = async (inputPaths, outputPath) => {
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const listPath = path.join(tempDir, `concat_${uuidv4()}.txt`);
    const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
    await fs.writeFile(listPath, listContent);
    
    return new Promise((resolve, reject) => {
        Ffmpeg()
            .input(listPath)
            .inputOptions(['-f', 'concat', '-safe', '0'])
            .outputOptions([
                `-c:v`, `libx264`,
                `-c:a`, `aac`,
                `-preset`, `fast`,
                `-crf`, `23`
            ])
            .output(outputPath)
            .on('end', async () => {
                await fs.unlink(listPath);
                resolve(outputPath);
            })
            .on('error', reject)
            .run();
    });
};

/**
 * Add watermark to video
 */
export const addWatermark = (inputPath, watermarkPath, outputPath, position = 'bottomright') => {
    const positions = {
        topleft: 'overlay=10:10',
        topright: 'overlay=W-w-10:10',
        bottomleft: 'overlay=10:H-h-10',
        bottomright: 'overlay=W-w-10:H-h-10',
        center: 'overlay=(W-w)/2:(H-h)/2'
    };
    
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .input(watermarkPath)
            .complexFilter([positions[position] || positions.bottomright])
            .outputOptions([
                `-c:v`, `libx264`,
                `-c:a`, `copy`,
                `-preset`, `fast`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Burn subtitles into video
 */
export const burnSubtitles = (inputPath, subtitlePath, outputPath, style = {}) => {
    const defaultStyle = {
        fontsize: 24,
        fontcolor: 'white',
        borderwidth: 2,
        ...style
    };
    
    const styleStr = Object.entries(defaultStyle)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
    
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, `subtitles=${subtitlePath}:force_style='${styleStr}'`,
                `-c:a`, `copy`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// COMPRESSION & OPTIMIZATION
// ============================================================================

/**
 * Compress video for upload optimization
 */
export const compressVideo = (inputPath, outputPath, options = {}) => {
    const { targetSizeMB, quality = 'medium' } = options;
    
    const presets = {
        low: { crf: 28, preset: 'faster' },
        medium: { crf: 23, preset: 'fast' },
        high: { crf: 18, preset: 'slow' }
    };
    
    const { crf, preset } = presets[quality] || presets.medium;
    
    return new Promise(async (resolve, reject) => {
        let videoBitrate = null;
        
        if (targetSizeMB) {
            const metadata = await extractVideoMetadata(inputPath);
            const targetBytes = targetSizeMB * 1024 * 1024;
            const audioBitrate = 128000;
            videoBitrate = Math.floor((targetBytes * 8) / metadata.duration - audioBitrate);
        }
        
        const outputOptions = [
            `-c:v`, `libx264`,
            `-preset`, preset,
            `-crf`, `${crf}`,
            `-c:a`, `aac`,
            `-b:a`, `128k`,
            `-movflags`, `+faststart`
        ];
        
        if (videoBitrate) {
            outputOptions.push(`-b:v`, `${videoBitrate}`);
        }
        
        Ffmpeg(inputPath)
            .outputOptions(outputOptions)
            .output(outputPath)
            .on('progress', (progress) => console.log(`Compressing: ${progress.percent?.toFixed(1)}%`))
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

/**
 * Create fast-seeking preview version
 */
export const createPreviewVersion = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .outputOptions([
                `-vf`, `scale=640:-1,fps=24`,
                `-c:v`, `libx264`,
                `-preset`, `ultrafast`,
                `-crf`, `35`,
                `-c:a`, `aac`,
                `-b:a`, `64k`,
                `-movflags`, `+faststart`
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format seconds to VTT timestamp
 */
function formatVttTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Get video quality classification
 */
export const classifyVideoQuality = async (inputPath) => {
    const metadata = await extractVideoMetadata(inputPath);
    const { width, height, bitrate } = metadata;
    
    const pixelRate = width * height * metadata.fps;
    const bitsPerPixel = bitrate / pixelRate;
    
    let qualityClass;
    if (height >= 2160) qualityClass = '4K';
    else if (height >= 1080) qualityClass = '1080p';
    else if (height >= 720) qualityClass = '720p';
    else if (height >= 480) qualityClass = '480p';
    else if (height >= 360) qualityClass = '360p';
    else qualityClass = '240p';
    
    return {
        resolution: `${width}x${height}`,
        qualityClass,
        bitsPerPixel,
        isHighQuality: bitsPerPixel > 0.1,
        recommendedEnhancements: bitsPerPixel < 0.05 ? ['denoise', 'sharpen'] : []
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Metadata
    extractVideoMetadata,
    classifyVideoQuality,
    
    // Scene Detection
    detectSceneChanges,
    detectBlackFrames,
    
    // Audio Analysis
    analyzeAudioLoudness,
    extractAudioSamples,
    detectSilence,
    normalizeAudio,
    
    // Quality Enhancement
    denoiseVideo,
    enhanceVideo,
    
    // HLS Generation
    generateHLSWithHardwareAccel,
    
    // Thumbnails
    extractKeyframes,
    generateAnimatedThumbnail,
    generateSpriteSheet,
    
    // Waveform
    generateWaveform,
    extractWaveformData,
    
    // Editing
    trimVideo,
    concatenateVideos,
    addWatermark,
    burnSubtitles,
    
    // Compression
    compressVideo,
    createPreviewVersion,
};

