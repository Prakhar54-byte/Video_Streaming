/**
 * Video Hash Hook
 * Uses WASM for perceptual hashing and duplicate detection
 */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface HashResult {
  phash: string;
  ahash: string;
  dhash: string;
  timestamp: number;
}

interface SimilarityResult {
  videoId: string;
  similarity: number;
  matchType: "exact" | "near-duplicate" | "similar" | "different";
}

interface VideoFingerprint {
  videoId: string;
  hashes: HashResult[];
  duration: number;
  frameCount: number;
}

export function useVideoHash() {
  const wasmModuleRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFingerprint, setCurrentFingerprint] = useState<VideoFingerprint | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load WASM module
  const loadWasm = useCallback(async () => {
    try {
      // Try to load WASM from public folder if available
      if (typeof window !== "undefined") {
        const wasmPath = "/wasm/video_hash.js";
        const response = await fetch(wasmPath, { method: "HEAD" });
        if (response.ok) {
          const wasmModule = await import(/* webpackIgnore: true */ wasmPath);
          const instance = await wasmModule.default();
          wasmModuleRef.current = instance;
          setIsLoaded(true);
          console.log("Video Hash WASM loaded");
          return;
        }
      }
      // Fall through to fallback
      throw new Error("WASM not available");
    } catch (error) {
      console.warn("Video Hash WASM not available, using JS fallback");
      wasmModuleRef.current = createJSFallback();
      setIsLoaded(true);
    }
  }, []);

  // Get canvas for frame extraction
  const getCanvas = useCallback((size: number): HTMLCanvasElement => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    canvasRef.current.width = size;
    canvasRef.current.height = size;
    return canvasRef.current;
  }, []);

  // Extract grayscale frame data
  const extractGrayscaleFrame = useCallback(
    (video: HTMLVideoElement, size: number): Uint8Array | null => {
      const canvas = getCanvas(size);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const grayscale = new Uint8Array(size * size);

      for (let i = 0; i < grayscale.length; i++) {
        const offset = i * 4;
        grayscale[i] = Math.round(
          0.299 * imageData.data[offset] +
            0.587 * imageData.data[offset + 1] +
            0.114 * imageData.data[offset + 2]
        );
      }

      return grayscale;
    },
    [getCanvas]
  );

  // Compute perceptual hash using WASM
  const computePHash = useCallback(
    (grayscaleData: Uint8Array, size: number): string => {
      const wasm = wasmModuleRef.current;

      if (!wasm || !wasm._compute_phash) {
        return computePHashJS(grayscaleData, size);
      }

      const dataPtr = wasm._wasm_malloc(grayscaleData.length);
      new Uint8Array(wasm.HEAPU8.buffer, dataPtr, grayscaleData.length).set(grayscaleData);

      const hashPtr = wasm._compute_phash(dataPtr, size, size);
      wasm._wasm_free(dataPtr);

      if (hashPtr === 0) return "";

      // Read 8-byte hash
      const hashView = new Uint8Array(wasm.HEAPU8.buffer, hashPtr, 8);
      const hash = Array.from(hashView)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      wasm._wasm_free(hashPtr);
      return hash;
    },
    []
  );

  // Compute average hash using WASM
  const computeAHash = useCallback(
    (grayscaleData: Uint8Array, size: number): string => {
      const wasm = wasmModuleRef.current;

      if (!wasm || !wasm._compute_ahash) {
        return computeAHashJS(grayscaleData, size);
      }

      const dataPtr = wasm._wasm_malloc(grayscaleData.length);
      new Uint8Array(wasm.HEAPU8.buffer, dataPtr, grayscaleData.length).set(grayscaleData);

      const hashPtr = wasm._compute_ahash(dataPtr, size, size);
      wasm._wasm_free(dataPtr);

      if (hashPtr === 0) return "";

      const hashView = new Uint8Array(wasm.HEAPU8.buffer, hashPtr, 8);
      const hash = Array.from(hashView)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      wasm._wasm_free(hashPtr);
      return hash;
    },
    []
  );

  // Compute difference hash using WASM
  const computeDHash = useCallback(
    (grayscaleData: Uint8Array, size: number): string => {
      const wasm = wasmModuleRef.current;

      if (!wasm || !wasm._compute_dhash) {
        return computeDHashJS(grayscaleData, size);
      }

      const dataPtr = wasm._wasm_malloc(grayscaleData.length);
      new Uint8Array(wasm.HEAPU8.buffer, dataPtr, grayscaleData.length).set(grayscaleData);

      const hashPtr = wasm._compute_dhash(dataPtr, size, size);
      wasm._wasm_free(dataPtr);

      if (hashPtr === 0) return "";

      const hashView = new Uint8Array(wasm.HEAPU8.buffer, hashPtr, 8);
      const hash = Array.from(hashView)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      wasm._wasm_free(hashPtr);
      return hash;
    },
    []
  );

  // Compare two hashes using Hamming distance
  const compareHashes = useCallback(
    (hash1: string, hash2: string): number => {
      const wasm = wasmModuleRef.current;

      if (!wasm || !wasm._compare_video_hashes) {
        return compareHashesJS(hash1, hash2);
      }

      const bytes1 = hexToBytes(hash1);
      const bytes2 = hexToBytes(hash2);

      const ptr1 = wasm._wasm_malloc(8);
      const ptr2 = wasm._wasm_malloc(8);

      new Uint8Array(wasm.HEAPU8.buffer, ptr1, 8).set(bytes1);
      new Uint8Array(wasm.HEAPU8.buffer, ptr2, 8).set(bytes2);

      const similarity = wasm._compare_video_hashes(ptr1, ptr2, 8);

      wasm._wasm_free(ptr1);
      wasm._wasm_free(ptr2);

      return similarity;
    },
    []
  );

  // Hash a single frame
  const hashFrame = useCallback(
    (video: HTMLVideoElement): HashResult | null => {
      const grayscale = extractGrayscaleFrame(video, 8);
      if (!grayscale) return null;

      const grayscale32 = extractGrayscaleFrame(video, 32);

      return {
        phash: grayscale32 ? computePHash(grayscale32, 32) : "",
        ahash: computeAHash(grayscale, 8),
        dhash: computeDHash(grayscale, 8),
        timestamp: video.currentTime,
      };
    },
    [extractGrayscaleFrame, computePHash, computeAHash, computeDHash]
  );

  // Generate video fingerprint
  const generateFingerprint = useCallback(
    async (
      video: HTMLVideoElement,
      videoId: string,
      sampleCount = 20
    ): Promise<VideoFingerprint> => {
      setIsProcessing(true);
      setProgress(0);

      const originalTime = video.currentTime;
      const duration = video.duration;
      const step = duration / sampleCount;
      const hashes: HashResult[] = [];

      for (let i = 0; i <= sampleCount; i++) {
        const time = i * step;
        video.currentTime = Math.min(time, duration - 0.1);

        await new Promise((resolve) => {
          video.onseeked = resolve;
        });

        const hash = hashFrame(video);
        if (hash) {
          hashes.push(hash);
        }

        setProgress(Math.round((i / sampleCount) * 100));
      }

      video.currentTime = originalTime;

      const fingerprint: VideoFingerprint = {
        videoId,
        hashes,
        duration,
        frameCount: sampleCount,
      };

      setCurrentFingerprint(fingerprint);
      setIsProcessing(false);

      return fingerprint;
    },
    [hashFrame]
  );

  // Compare two videos
  const compareVideos = useCallback(
    (fingerprint1: VideoFingerprint, fingerprint2: VideoFingerprint): SimilarityResult => {
      let totalSimilarity = 0;
      let comparisons = 0;

      const minLength = Math.min(fingerprint1.hashes.length, fingerprint2.hashes.length);

      for (let i = 0; i < minLength; i++) {
        const h1 = fingerprint1.hashes[i];
        const h2 = fingerprint2.hashes[i];

        // Compare all three hashes and average
        const phashSim = h1.phash && h2.phash ? compareHashes(h1.phash, h2.phash) : 0;
        const ahashSim = h1.ahash && h2.ahash ? compareHashes(h1.ahash, h2.ahash) : 0;
        const dhashSim = h1.dhash && h2.dhash ? compareHashes(h1.dhash, h2.dhash) : 0;

        totalSimilarity += (phashSim * 0.5 + ahashSim * 0.25 + dhashSim * 0.25);
        comparisons++;
      }

      const similarity = comparisons > 0 ? totalSimilarity / comparisons : 0;

      let matchType: "exact" | "near-duplicate" | "similar" | "different";
      if (similarity > 0.95) {
        matchType = "exact";
      } else if (similarity > 0.85) {
        matchType = "near-duplicate";
      } else if (similarity > 0.6) {
        matchType = "similar";
      } else {
        matchType = "different";
      }

      return {
        videoId: fingerprint2.videoId,
        similarity,
        matchType,
      };
    },
    [compareHashes]
  );

  // Find duplicates from a list of fingerprints
  const findDuplicates = useCallback(
    (
      targetFingerprint: VideoFingerprint,
      candidates: VideoFingerprint[],
      threshold = 0.85
    ): SimilarityResult[] => {
      const results: SimilarityResult[] = [];

      for (const candidate of candidates) {
        if (candidate.videoId === targetFingerprint.videoId) continue;

        const result = compareVideos(targetFingerprint, candidate);
        if (result.similarity >= threshold) {
          results.push(result);
        }
      }

      return results.sort((a, b) => b.similarity - a.similarity);
    },
    [compareVideos]
  );

  // Check if video is duplicate via API
  const checkDuplicateViaAPI = useCallback(
    async (fingerprint: VideoFingerprint): Promise<SimilarityResult[]> => {
      try {
        const response = await fetch("/api/videos/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint }),
        });

        if (!response.ok) throw new Error("API error");
        return await response.json();
      } catch (error) {
        console.error("Duplicate check API error:", error);
        return [];
      }
    },
    []
  );

  // Initialize on mount
  useEffect(() => {
    loadWasm();
  }, [loadWasm]);

  return {
    isLoaded,
    isProcessing,
    progress,
    currentFingerprint,

    loadWasm,
    hashFrame,
    generateFingerprint,
    compareHashes,
    compareVideos,
    findDuplicates,
    checkDuplicateViaAPI,
    computePHash,
    computeAHash,
    computeDHash,
  };
}

// Helper functions
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// JavaScript fallback implementations
function computePHashJS(grayscale: Uint8Array, size: number): string {
  // Simplified DCT-based hash
  const avg = grayscale.reduce((a, b) => a + b, 0) / grayscale.length;
  let hash = 0n;
  for (let i = 0; i < 64 && i < grayscale.length; i++) {
    if (grayscale[i] > avg) {
      hash |= 1n << BigInt(i);
    }
  }
  return hash.toString(16).padStart(16, "0");
}

function computeAHashJS(grayscale: Uint8Array, size: number): string {
  const avg = grayscale.reduce((a, b) => a + b, 0) / grayscale.length;
  let hash = 0n;
  for (let i = 0; i < 64 && i < grayscale.length; i++) {
    if (grayscale[i] > avg) {
      hash |= 1n << BigInt(i);
    }
  }
  return hash.toString(16).padStart(16, "0");
}

function computeDHashJS(grayscale: Uint8Array, size: number): string {
  let hash = 0n;
  let bit = 0;
  for (let y = 0; y < size && bit < 64; y++) {
    for (let x = 0; x < size - 1 && bit < 64; x++) {
      const idx = y * size + x;
      if (grayscale[idx] > grayscale[idx + 1]) {
        hash |= 1n << BigInt(bit);
      }
      bit++;
    }
  }
  return hash.toString(16).padStart(16, "0");
}

function compareHashesJS(hash1: string, hash2: string): number {
  const bytes1 = hexToBytes(hash1);
  const bytes2 = hexToBytes(hash2);
  let diffBits = 0;

  for (let i = 0; i < Math.min(bytes1.length, bytes2.length); i++) {
    let xor = bytes1[i] ^ bytes2[i];
    while (xor) {
      diffBits += xor & 1;
      xor >>= 1;
    }
  }

  const totalBits = Math.min(bytes1.length, bytes2.length) * 8;
  return 1 - diffBits / totalBits;
}

function createJSFallback() {
  return {
    _compute_phash: null,
    _compute_ahash: null,
    _compute_dhash: null,
    _compare_video_hashes: null,
    _wasm_malloc: () => 0,
    _wasm_free: () => {},
    HEAPU8: { buffer: new ArrayBuffer(1024) },
  };
}

export default useVideoHash;
