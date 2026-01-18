/**
 * Video Analysis Controller
 * Handles WASM-powered video analysis, duplicate detection, and quality assessment
 */

import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import {
  getFrameAnalyzer,
  getAudioFingerprint,
  getVideoHash,
  getColorAnalyzer,
} from "../utils/wasmLoader.js";
import videoProcessingService from "../services/videoProcessing.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analyze video quality and generate report
export const analyzeVideoQuality = asyncHandler(async (req, res) => {
  const { videoPath } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const absolutePath = path.resolve(videoPath);

  // Check if file exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new ApiError(404, "Video file not found");
  }

  // Extract metadata
  const metadata = await videoProcessingService.extractVideoMetadata(absolutePath);

  // Detect scene changes
  const sceneChanges = await videoProcessingService.detectSceneChanges(absolutePath, 0.4);

  // Detect black frames
  const blackFrames = await videoProcessingService.detectBlackFrames(absolutePath, 0.98);

  // Analyze audio loudness
  const audioAnalysis = await videoProcessingService.analyzeAudioLoudness(absolutePath);

  // Detect silence
  const silenceRanges = await videoProcessingService.detectSilence(absolutePath, -50, 1);

  res.json({
    success: true,
    data: {
      metadata,
      analysis: {
        sceneChanges,
        blackFrames,
        audioAnalysis,
        silenceRanges,
      },
      quality: {
        videoScore: calculateVideoQualityScore(metadata, blackFrames, sceneChanges),
        audioScore: calculateAudioQualityScore(audioAnalysis, silenceRanges),
        overallScore: 0, // Will be calculated below
      },
    },
  });

  // Calculate overall score
  const videoScore = res.data?.quality?.videoScore || 0;
  const audioScore = res.data?.quality?.audioScore || 0;
  if (res.data?.quality) {
    res.data.quality.overallScore = videoScore * 0.6 + audioScore * 0.4;
  }
});

// Detect duplicate videos
export const detectDuplicates = asyncHandler(async (req, res) => {
  const { videoPath, candidateVideos } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const videoHash = await getVideoHash();

  // Generate fingerprint for target video
  const targetFrames = await extractFramesForHashing(videoPath, 20);
  const targetHashes = [];

  for (const frame of targetFrames) {
    const phash = videoHash.computePHash(frame.data, frame.width);
    const ahash = videoHash.computeAHash(frame.data, frame.width);
    targetHashes.push({ timestamp: frame.timestamp, phash, ahash });
  }

  const duplicates = [];

  // Compare with candidate videos
  if (candidateVideos && Array.isArray(candidateVideos)) {
    for (const candidate of candidateVideos) {
      const candidateFrames = await extractFramesForHashing(candidate.path, 20);
      const candidateHashes = [];

      for (const frame of candidateFrames) {
        const phash = videoHash.computePHash(frame.data, frame.width);
        const ahash = videoHash.computeAHash(frame.data, frame.width);
        candidateHashes.push({ timestamp: frame.timestamp, phash, ahash });
      }

      // Calculate similarity
      const similarity = calculateVideoSimilarity(targetHashes, candidateHashes, videoHash);

      if (similarity > 0.7) {
        duplicates.push({
          videoId: candidate.id,
          path: candidate.path,
          similarity,
          matchType:
            similarity > 0.95
              ? "exact"
              : similarity > 0.85
              ? "near-duplicate"
              : "similar",
        });
      }
    }
  }

  res.json({
    success: true,
    data: {
      targetVideo: videoPath,
      fingerprint: {
        hashCount: targetHashes.length,
        hashes: targetHashes,
      },
      duplicates: duplicates.sort((a, b) => b.similarity - a.similarity),
    },
  });
});

// Check duplicate via fingerprint (for frontend uploads)
export const checkDuplicateByFingerprint = asyncHandler(async (req, res) => {
  const { fingerprint } = req.body;

  if (!fingerprint || !fingerprint.hashes) {
    throw new ApiError(400, "Fingerprint is required");
  }

  // In production, this would query a database of existing fingerprints
  // For now, return empty array (no duplicates found)
  res.json({
    success: true,
    data: [],
  });
});

// Extract keyframes from video
export const extractKeyframes = asyncHandler(async (req, res) => {
  const { videoPath, count = 10, quality = 85 } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const outputDir = path.join(
    __dirname,
    "../../public/keyframes",
    path.basename(videoPath, path.extname(videoPath))
  );

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Extract keyframes using FFmpeg
  const keyframes = await videoProcessingService.extractKeyframes(
    path.resolve(videoPath),
    outputDir,
    count,
    quality
  );

  res.json({
    success: true,
    data: {
      outputDir,
      keyframes,
      count: keyframes.length,
    },
  });
});

// Generate video thumbnail with best frame selection
export const generateSmartThumbnail = asyncHandler(async (req, res) => {
  const { videoPath, width = 320, height = 180 } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const colorAnalyzer = await getColorAnalyzer();
  const absolutePath = path.resolve(videoPath);

  // Extract candidate frames
  const candidateFrames = await extractFramesForAnalysis(absolutePath, 10);

  // Score each frame
  let bestFrame = null;
  let bestScore = 0;

  for (const frame of candidateFrames) {
    const score = colorAnalyzer.selectBestThumbnailFrame(frame.data, frame.width, frame.height);
    if (score > bestScore) {
      bestScore = score;
      bestFrame = frame;
    }
  }

  // Generate thumbnail at best timestamp
  const outputPath = path.join(
    __dirname,
    "../../public/thumbnails",
    `${path.basename(videoPath, path.extname(videoPath))}_thumb.jpg`
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Use FFmpeg to extract thumbnail at best timestamp
  if (bestFrame) {
    await videoProcessingService.extractFrameAtTime(
      absolutePath,
      outputPath,
      bestFrame.timestamp,
      width,
      height
    );
  }

  res.json({
    success: true,
    data: {
      thumbnailPath: outputPath,
      timestamp: bestFrame?.timestamp || 0,
      qualityScore: bestScore,
    },
  });
});

// Generate animated thumbnail (GIF)
export const generateAnimatedThumbnail = asyncHandler(async (req, res) => {
  const { videoPath, startTime = 0, duration = 3, width = 320, fps = 10 } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const outputPath = path.join(
    __dirname,
    "../../public/thumbnails",
    `${path.basename(videoPath, path.extname(videoPath))}_animated.gif`
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await videoProcessingService.generateAnimatedThumbnail(
    path.resolve(videoPath),
    outputPath,
    startTime,
    duration,
    width,
    fps
  );

  res.json({
    success: true,
    data: {
      thumbnailPath: outputPath,
      startTime,
      duration,
    },
  });
});

// Generate sprite sheet for video scrubbing
export const generateSpriteSheet = asyncHandler(async (req, res) => {
  const { videoPath, interval = 5, width = 160, columns = 10 } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const outputPath = path.join(
    __dirname,
    "../../public/sprites",
    `${path.basename(videoPath, path.extname(videoPath))}_sprite.jpg`
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await videoProcessingService.generateSpriteSheet(
    path.resolve(videoPath),
    outputPath,
    interval,
    width,
    columns
  );

  res.json({
    success: true,
    data: {
      spritePath: outputPath,
      interval,
      thumbnailWidth: width,
      columns,
    },
  });
});

// Analyze audio for intro detection
export const analyzeAudioIntro = asyncHandler(async (req, res) => {
  const { videoPath, referenceIntroPath, maxDuration = 120 } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const audioFingerprint = await getAudioFingerprint();

  // Extract audio samples
  const audioSamples = await extractAudioSamples(path.resolve(videoPath), maxDuration);

  // If reference intro provided, match against it
  if (referenceIntroPath) {
    const referenceAudio = await extractAudioSamples(path.resolve(referenceIntroPath));

    // Generate fingerprints
    const videoFingerprint = audioFingerprint.computeFingerprint(
      audioSamples,
      audioSamples.length
    );
    const refFingerprint = audioFingerprint.computeFingerprint(
      referenceAudio,
      referenceAudio.length
    );

    // Match
    const similarity = audioFingerprint.calculateSimilarity(
      videoFingerprint,
      videoFingerprint.length,
      refFingerprint,
      refFingerprint.length
    );

    res.json({
      success: true,
      data: {
        introDetected: similarity > 0.7,
        similarity,
        estimatedIntroDuration: similarity > 0.7 ? maxDuration : 0,
      },
    });
  } else {
    // Auto-detect intro using silence and audio patterns
    const silenceRanges = await videoProcessingService.detectSilence(
      path.resolve(videoPath),
      -40,
      0.5
    );

    // Look for pattern break after intro
    const introEnd = detectIntroEndFromSilence(silenceRanges, maxDuration);

    res.json({
      success: true,
      data: {
        introDetected: introEnd > 0,
        estimatedIntroDuration: introEnd,
        silenceMarkers: silenceRanges.slice(0, 5),
      },
    });
  }
});

// Generate audio waveform
export const generateWaveform = asyncHandler(async (req, res) => {
  const { videoPath, width = 1920, height = 200, color = "#2196F3" } = req.body;

  if (!videoPath) {
    throw new ApiError(400, "Video path is required");
  }

  const outputPath = path.join(
    __dirname,
    "../../public/waveforms",
    `${path.basename(videoPath, path.extname(videoPath))}_waveform.png`
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await videoProcessingService.generateWaveform(
    path.resolve(videoPath),
    outputPath,
    width,
    height,
    color
  );

  res.json({
    success: true,
    data: {
      waveformPath: outputPath,
      width,
      height,
    },
  });
});

// Get video processing status
export const getProcessingStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // This would typically query a job queue or database
  // For now, return mock status
  res.json({
    success: true,
    data: {
      videoId,
      status: "completed",
      progress: 100,
      stages: {
        transcoding: "completed",
        thumbnails: "completed",
        analysis: "completed",
      },
    },
  });
});

// Helper functions
function calculateVideoQualityScore(metadata, blackFrames, sceneChanges) {
  let score = 1.0;

  // Penalize for black frames (might indicate encoding issues)
  if (blackFrames.length > 0) {
    const blackFrameRatio = blackFrames.length / (metadata.duration || 1);
    score -= Math.min(blackFrameRatio * 0.5, 0.3);
  }

  // Penalize for too few scene changes (might be static/boring content)
  if (sceneChanges.length < 3 && metadata.duration > 60) {
    score -= 0.1;
  }

  // Reward for HD/4K resolution
  if (metadata.width >= 1920) score += 0.1;
  if (metadata.width >= 3840) score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateAudioQualityScore(audioAnalysis, silenceRanges) {
  let score = 1.0;

  // Check integrated loudness (target: -14 to -16 LUFS)
  if (audioAnalysis.integratedLoudness) {
    const loudness = parseFloat(audioAnalysis.integratedLoudness);
    if (loudness < -24 || loudness > -10) {
      score -= 0.2;
    }
  }

  // Check loudness range
  if (audioAnalysis.loudnessRange) {
    const range = parseFloat(audioAnalysis.loudnessRange);
    if (range > 20) score -= 0.1; // Too dynamic
    if (range < 4) score -= 0.05; // Too compressed
  }

  // Penalize for excessive silence
  const totalSilence = silenceRanges.reduce(
    (acc, range) => acc + (range.end - range.start),
    0
  );
  if (totalSilence > 30) {
    score -= 0.15;
  }

  return Math.max(0, Math.min(1, score));
}

function calculateVideoSimilarity(hashes1, hashes2, videoHash) {
  let totalSimilarity = 0;
  const minLength = Math.min(hashes1.length, hashes2.length);

  for (let i = 0; i < minLength; i++) {
    const sim = videoHash.compareHashes(hashes1[i].phash, hashes2[i].phash);
    totalSimilarity += sim;
  }

  return minLength > 0 ? totalSimilarity / minLength : 0;
}

function detectIntroEndFromSilence(silenceRanges, maxDuration) {
  // Look for silence markers that might indicate intro end
  for (const range of silenceRanges) {
    if (range.start > 5 && range.start < maxDuration) {
      return range.start;
    }
  }
  return 0;
}

// Stub functions - would use FFmpeg in production
async function extractFramesForHashing(videoPath, count) {
  // In production, use FFmpeg to extract frames
  return [];
}

async function extractFramesForAnalysis(videoPath, count) {
  // In production, use FFmpeg to extract frames
  return [];
}

async function extractAudioSamples(videoPath, duration = 120) {
  // In production, use FFmpeg to extract audio samples
  return new Float32Array(0);
}
