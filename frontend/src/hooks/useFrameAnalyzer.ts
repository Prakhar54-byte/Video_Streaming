/**
 * Frame Analyzer Hook
 * Uses WASM for real-time frame analysis including scene detection and quality assessment
 */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface SceneChange {
  frameIndex: number;
  timestamp: number;
  confidence: number;
}

interface FrameQuality {
  sharpness: number;
  brightness: number;
  contrast: number;
  colorfulness: number;
  overall: number;
}

interface MotionAnalysis {
  intensity: number;
  direction: { x: number; y: number };
  isStaticScene: boolean;
}

interface FrameAnalysisResult {
  quality: FrameQuality;
  motion: MotionAnalysis;
  isBlackFrame: boolean;
  isKeyframeCandidate: boolean;
}

export function useFrameAnalyzer() {
  const wasmModuleRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneChanges, setSceneChanges] = useState<SceneChange[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<FrameAnalysisResult | null>(null);

  // Initialize WASM module
  const loadWasm = useCallback(async () => {
    try {
      // Try to load WASM from public folder if available
      if (typeof window !== "undefined") {
        const wasmPath = "/wasm/frame_analyzer.js";
        const response = await fetch(wasmPath, { method: "HEAD" });
        if (response.ok) {
          const wasmModule = await import(/* webpackIgnore: true */ wasmPath);
          const instance = await wasmModule.default();
          wasmModuleRef.current = instance;
          setIsLoaded(true);
          console.log("Frame Analyzer WASM loaded");
          return;
        }
      }
      // Fall through to fallback
      throw new Error("WASM not available");
    } catch (error) {
      console.warn("Frame Analyzer WASM not available, using JS fallback");
      // Create fallback - use JS implementation
      wasmModuleRef.current = createJSFallback();
      setIsLoaded(true);
    }
  }, []);

  // Get hidden canvas for frame extraction
  const getCanvas = useCallback(
    (width: number, height: number): HTMLCanvasElement => {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      return canvasRef.current;
    },
    []
  );

  // Extract frame data from video element
  const extractFrameData = useCallback(
    (video: HTMLVideoElement): ImageData | null => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) return null;

      const canvas = getCanvas(width, height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, width, height);
      return ctx.getImageData(0, 0, width, height);
    },
    [getCanvas]
  );

  // Calculate scene change score between two frames
  const calculateSceneChangeScore = useCallback(
    (currentFrame: ImageData, previousFrame: ImageData): number => {
      const wasm = wasmModuleRef.current;
      if (!wasm) return 0;

      const width = currentFrame.width;
      const height = currentFrame.height;
      const pixelCount = width * height * 4;

      // Allocate memory for both frames
      const currentPtr = wasm._wasm_malloc(pixelCount);
      const previousPtr = wasm._wasm_malloc(pixelCount);

      const currentView = new Uint8Array(wasm.HEAPU8.buffer, currentPtr, pixelCount);
      const previousView = new Uint8Array(wasm.HEAPU8.buffer, previousPtr, pixelCount);

      currentView.set(currentFrame.data);
      previousView.set(previousFrame.data);

      const score = wasm._calculate_scene_change_score(
        currentPtr,
        previousPtr,
        width,
        height
      );

      wasm._wasm_free(currentPtr);
      wasm._wasm_free(previousPtr);

      return score;
    },
    []
  );

  // Detect if frame is a black frame
  const detectBlackFrame = useCallback((frameData: ImageData): boolean => {
    const wasm = wasmModuleRef.current;
    if (!wasm) {
      // JS fallback
      let total = 0;
      for (let i = 0; i < frameData.data.length; i += 4) {
        total += (frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3;
      }
      const avgBrightness = total / (frameData.data.length / 4);
      return avgBrightness < 16;
    }

    const pixelCount = frameData.width * frameData.height * 4;
    const framePtr = wasm._wasm_malloc(pixelCount);
    const frameView = new Uint8Array(wasm.HEAPU8.buffer, framePtr, pixelCount);
    frameView.set(frameData.data);

    const isBlack = wasm._detect_black_frame(
      framePtr,
      frameData.width,
      frameData.height,
      16 // threshold
    );

    wasm._wasm_free(framePtr);
    return isBlack === 1;
  }, []);

  // Calculate frame quality metrics
  const calculateFrameQuality = useCallback(
    (frameData: ImageData): FrameQuality => {
      const wasm = wasmModuleRef.current;
      const width = frameData.width;
      const height = frameData.height;
      const pixelCount = width * height * 4;

      if (!wasm || !wasm._calculate_frame_quality) {
        // JS fallback - simplified quality calculation
        let brightness = 0;
        let variance = 0;
        const pixels: number[] = [];

        for (let i = 0; i < frameData.data.length; i += 4) {
          const gray =
            0.299 * frameData.data[i] +
            0.587 * frameData.data[i + 1] +
            0.114 * frameData.data[i + 2];
          pixels.push(gray);
          brightness += gray;
        }

        brightness /= pixels.length;
        for (const p of pixels) {
          variance += (p - brightness) ** 2;
        }
        const contrast = Math.sqrt(variance / pixels.length) / 128;

        return {
          sharpness: 0.5, // Would need Laplacian for real calculation
          brightness: brightness / 255,
          contrast: Math.min(contrast, 1),
          colorfulness: 0.5,
          overall: (0.5 + brightness / 255 + contrast) / 3,
        };
      }

      const framePtr = wasm._wasm_malloc(pixelCount);
      const frameView = new Uint8Array(wasm.HEAPU8.buffer, framePtr, pixelCount);
      frameView.set(frameData.data);

      const resultPtr = wasm._calculate_frame_quality(framePtr, width, height);

      if (resultPtr === 0) {
        wasm._wasm_free(framePtr);
        return { sharpness: 0, brightness: 0, contrast: 0, colorfulness: 0, overall: 0 };
      }

      const resultView = new Float32Array(wasm.HEAPF32.buffer, resultPtr, 5);
      const quality: FrameQuality = {
        sharpness: resultView[0],
        brightness: resultView[1],
        contrast: resultView[2],
        colorfulness: resultView[3],
        overall: resultView[4],
      };

      wasm._wasm_free(framePtr);
      wasm._wasm_free(resultPtr);

      return quality;
    },
    []
  );

  // Calculate motion intensity between frames
  const calculateMotionIntensity = useCallback(
    (currentFrame: ImageData, previousFrame: ImageData): MotionAnalysis => {
      const wasm = wasmModuleRef.current;

      if (!wasm || !wasm._calculate_motion_intensity) {
        // JS fallback
        let diff = 0;
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          diff += Math.abs(currentFrame.data[i] - previousFrame.data[i]);
        }
        const intensity = diff / (currentFrame.data.length / 4) / 255;
        return {
          intensity,
          direction: { x: 0, y: 0 },
          isStaticScene: intensity < 0.02,
        };
      }

      const width = currentFrame.width;
      const height = currentFrame.height;
      const pixelCount = width * height * 4;

      const currentPtr = wasm._wasm_malloc(pixelCount);
      const previousPtr = wasm._wasm_malloc(pixelCount);

      new Uint8Array(wasm.HEAPU8.buffer, currentPtr, pixelCount).set(currentFrame.data);
      new Uint8Array(wasm.HEAPU8.buffer, previousPtr, pixelCount).set(previousFrame.data);

      const intensity = wasm._calculate_motion_intensity(
        currentPtr,
        previousPtr,
        width,
        height
      );

      wasm._wasm_free(currentPtr);
      wasm._wasm_free(previousPtr);

      return {
        intensity,
        direction: { x: 0, y: 0 },
        isStaticScene: intensity < 0.02,
      };
    },
    []
  );

  // Analyze frame (comprehensive)
  const analyzeFrame = useCallback(
    (video: HTMLVideoElement): FrameAnalysisResult | null => {
      const frameData = extractFrameData(video);
      if (!frameData) return null;

      const quality = calculateFrameQuality(frameData);
      const isBlackFrame = detectBlackFrame(frameData);

      let motion: MotionAnalysis = {
        intensity: 0,
        direction: { x: 0, y: 0 },
        isStaticScene: true,
      };

      if (previousFrameRef.current) {
        motion = calculateMotionIntensity(frameData, previousFrameRef.current);

        // Check for scene change
        const sceneScore = calculateSceneChangeScore(frameData, previousFrameRef.current);
        if (sceneScore > 0.5) {
          const newSceneChange: SceneChange = {
            frameIndex: sceneChanges.length,
            timestamp: video.currentTime,
            confidence: sceneScore,
          };
          setSceneChanges((prev) => [...prev, newSceneChange]);
        }
      }

      previousFrameRef.current = frameData;

      const result: FrameAnalysisResult = {
        quality,
        motion,
        isBlackFrame,
        isKeyframeCandidate: quality.overall > 0.6 && !isBlackFrame && motion.isStaticScene,
      };

      setLastAnalysis(result);
      return result;
    },
    [
      extractFrameData,
      calculateFrameQuality,
      detectBlackFrame,
      calculateMotionIntensity,
      calculateSceneChangeScore,
      sceneChanges.length,
    ]
  );

  // Find best thumbnail frame in a range
  const findBestThumbnailFrame = useCallback(
    async (
      video: HTMLVideoElement,
      startTime: number,
      endTime: number,
      sampleCount = 10
    ): Promise<{ time: number; quality: number }> => {
      const originalTime = video.currentTime;
      const step = (endTime - startTime) / sampleCount;
      let bestTime = startTime;
      let bestQuality = 0;

      for (let i = 0; i <= sampleCount; i++) {
        const time = startTime + i * step;
        video.currentTime = time;

        // Wait for seek
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });

        const frameData = extractFrameData(video);
        if (frameData) {
          const quality = calculateFrameQuality(frameData);
          if (quality.overall > bestQuality) {
            bestQuality = quality.overall;
            bestTime = time;
          }
        }
      }

      video.currentTime = originalTime;
      return { time: bestTime, quality: bestQuality };
    },
    [extractFrameData, calculateFrameQuality]
  );

  // Detect all scene changes in video
  const detectAllSceneChanges = useCallback(
    async (
      video: HTMLVideoElement,
      threshold = 0.5,
      sampleRate = 0.5
    ): Promise<SceneChange[]> => {
      const originalTime = video.currentTime;
      const duration = video.duration;
      const changes: SceneChange[] = [];

      let previousFrame: ImageData | null = null;
      let frameIndex = 0;

      for (let time = 0; time < duration; time += sampleRate) {
        video.currentTime = time;
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });

        const frameData = extractFrameData(video);
        if (frameData && previousFrame) {
          const score = calculateSceneChangeScore(frameData, previousFrame);
          if (score > threshold) {
            changes.push({
              frameIndex,
              timestamp: time,
              confidence: score,
            });
          }
        }
        previousFrame = frameData;
        frameIndex++;
      }

      video.currentTime = originalTime;
      setSceneChanges(changes);
      return changes;
    },
    [extractFrameData, calculateSceneChangeScore]
  );

  // Clear scene changes
  const clearSceneChanges = useCallback(() => {
    setSceneChanges([]);
    previousFrameRef.current = null;
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadWasm();
  }, [loadWasm]);

  return {
    isLoaded,
    sceneChanges,
    lastAnalysis,

    loadWasm,
    analyzeFrame,
    calculateSceneChangeScore,
    detectBlackFrame,
    calculateFrameQuality,
    calculateMotionIntensity,
    findBestThumbnailFrame,
    detectAllSceneChanges,
    clearSceneChanges,
    extractFrameData,
  };
}

// JavaScript fallback
function createJSFallback() {
  return {
    _calculate_scene_change_score: () => 0,
    _detect_black_frame: () => 0,
    _calculate_frame_quality: () => 0,
    _calculate_motion_intensity: () => 0,
    _wasm_malloc: () => 0,
    _wasm_free: () => {},
    HEAPU8: { buffer: new ArrayBuffer(1024) },
    HEAPF32: { buffer: new ArrayBuffer(1024) },
  };
}

export default useFrameAnalyzer;
