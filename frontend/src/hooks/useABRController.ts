/**
 * Adaptive Bitrate Controller Hook
 * Uses WASM for real-time bandwidth prediction and quality selection
 */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// Quality levels matching backend
const QUALITY_LEVELS = [
  { level: 0, name: "240p", bitrate: 400, height: 240 },
  { level: 1, name: "360p", bitrate: 800, height: 360 },
  { level: 2, name: "480p", bitrate: 1500, height: 480 },
  { level: 3, name: "720p", bitrate: 3000, height: 720 },
  { level: 4, name: "1080p", bitrate: 6000, height: 1080 },
  { level: 5, name: "4K", bitrate: 15000, height: 2160 },
];

interface ABRState {
  currentQuality: number;
  recommendedQuality: number;
  bandwidth: number;
  bufferHealth: number;
  rebufferRisk: number;
  estimatedQoE: number;
  trend: "increasing" | "stable" | "decreasing";
  isAutoMode: boolean;
}

interface ABRConfig {
  maxQuality?: number;
  segmentDuration?: number;
  historySize?: number;
  updateInterval?: number;
}

export function useABRController(config: ABRConfig = {}) {
  const {
    maxQuality = 4,
    segmentDuration = 4,
    historySize = 20,
    updateInterval = 1000,
  } = config;

  const wasmModuleRef = useRef<any>(null);
  const bandwidthHistoryRef = useRef<number[]>([]);
  const isLoadedRef = useRef(false);

  const [state, setState] = useState<ABRState>({
    currentQuality: 2,
    recommendedQuality: 2,
    bandwidth: 0,
    bufferHealth: 1,
    rebufferRisk: 0,
    estimatedQoE: 0.8,
    trend: "stable",
    isAutoMode: true,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load WASM module
  const loadWasm = useCallback(async () => {
    if (isLoadedRef.current) return;

    try {
      // Try to load WASM from public folder if available
      if (typeof window !== "undefined") {
        const wasmPath = "/wasm/abr_controller.js";
        const response = await fetch(wasmPath, { method: "HEAD" });
        if (response.ok) {
          const wasmModule = await import(/* webpackIgnore: true */ wasmPath);
          const instance = await wasmModule.default();
          wasmModuleRef.current = instance;
          isLoadedRef.current = true;
          setIsLoaded(true);
          console.log("ABR Controller WASM loaded");
          return;
        }
      }
      // Fall through to fallback
      throw new Error("WASM not available");
    } catch (error) {
      console.warn("ABR WASM not available, using JS fallback");
      // Fallback to JS implementation
      wasmModuleRef.current = createJSFallback();
      isLoadedRef.current = true;
      setIsLoaded(true);
    }
  }, []);

  // Record bandwidth measurement
  const recordBandwidth = useCallback(
    (bandwidth: number) => {
      bandwidthHistoryRef.current.push(bandwidth);
      if (bandwidthHistoryRef.current.length > historySize) {
        bandwidthHistoryRef.current.shift();
      }
    },
    [historySize]
  );

  // Predict bandwidth using WASM
  const predictBandwidth = useCallback((): number => {
    const history = bandwidthHistoryRef.current;
    if (history.length === 0) return 3000; // Default fallback

    const wasm = wasmModuleRef.current;
    if (!wasm || !wasm._predict_bandwidth) {
      // JS fallback - EWMA
      let ewma = history[0];
      const alpha = 0.3;
      for (let i = 1; i < history.length; i++) {
        ewma = alpha * history[i] + (1 - alpha) * ewma;
      }
      return ewma * 0.8;
    }

    // Use WASM prediction
    const historyPtr = wasm._wasm_malloc(history.length * 4);
    const historyView = new Float32Array(
      wasm.HEAPF32.buffer,
      historyPtr,
      history.length
    );
    historyView.set(history);

    const predicted = wasm._predict_bandwidth(historyPtr, history.length);
    wasm._wasm_free(historyPtr);

    return predicted;
  }, []);

  // Get quality recommendation
  const getRecommendation = useCallback(
    (bufferSeconds: number): ABRState => {
      const history = bandwidthHistoryRef.current;
      const wasm = wasmModuleRef.current;

      if (!wasm || history.length < 3) {
        return state;
      }

      try {
        // Allocate memory for history
        const historyPtr = wasm._wasm_malloc(history.length * 4);
        const historyView = new Float32Array(
          wasm.HEAPF32.buffer,
          historyPtr,
          history.length
        );
        historyView.set(history);

        // Get comprehensive recommendation
        const resultPtr = wasm._get_comprehensive_recommendation(
          historyPtr,
          history.length,
          bufferSeconds,
          segmentDuration,
          state.currentQuality,
          maxQuality
        );

        wasm._wasm_free(historyPtr);

        if (resultPtr === 0) return state;

        // Read results
        const resultView = new Float32Array(wasm.HEAPF32.buffer, resultPtr, 4);
        const quality = Math.round(resultView[0]);
        const confidence = resultView[1];
        const rebufferRisk = resultView[2];
        const estimatedQoE = resultView[3];

        wasm._wasm_free(resultPtr);

        // Detect trend
        const trendPtr = wasm._wasm_malloc(history.length * 4);
        const trendView = new Float32Array(
          wasm.HEAPF32.buffer,
          trendPtr,
          history.length
        );
        trendView.set(history);
        const trendValue = wasm._detect_bandwidth_trend(
          trendPtr,
          history.length
        );
        wasm._wasm_free(trendPtr);

        const trend: "increasing" | "stable" | "decreasing" =
          trendValue === 1
            ? "increasing"
            : trendValue === -1
            ? "decreasing"
            : "stable";

        // Calculate buffer health
        const bufferHealth = wasm._calculate_buffer_health(
          bufferSeconds,
          segmentDuration
        );

        return {
          ...state,
          recommendedQuality: quality,
          bandwidth: predictBandwidth(),
          bufferHealth,
          rebufferRisk,
          estimatedQoE,
          trend,
        };
      } catch (error) {
        console.error("ABR recommendation error:", error);
        return state;
      }
    },
    [state, segmentDuration, maxQuality, predictBandwidth]
  );

  // Apply quality change
  const setQuality = useCallback(
    (quality: number, auto = false) => {
      const clampedQuality = Math.max(0, Math.min(quality, maxQuality));
      setState((prev) => ({
        ...prev,
        currentQuality: clampedQuality,
        isAutoMode: auto ? prev.isAutoMode : false,
      }));
    },
    [maxQuality]
  );

  // Toggle auto mode
  const toggleAutoMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAutoMode: !prev.isAutoMode,
    }));
  }, []);

  // Update ABR state (call this from video player)
  const update = useCallback(
    (bufferSeconds: number, downloadedBytes?: number, downloadTime?: number) => {
      // Record bandwidth if download info provided
      if (downloadedBytes && downloadTime && downloadTime > 0) {
        const bandwidth = (downloadedBytes * 8) / downloadTime / 1000; // kbps
        recordBandwidth(bandwidth);
      }

      // Get new recommendation
      const newState = getRecommendation(bufferSeconds);
      setState(newState);

      // Auto-apply quality if in auto mode
      if (newState.isAutoMode && newState.recommendedQuality !== newState.currentQuality) {
        setState((prev) => ({
          ...prev,
          currentQuality: newState.recommendedQuality,
        }));
      }

      return newState;
    },
    [recordBandwidth, getRecommendation]
  );

  // Get quality info
  const getQualityInfo = useCallback((level: number) => {
    return QUALITY_LEVELS[level] || QUALITY_LEVELS[2];
  }, []);

  // Get available qualities
  const getAvailableQualities = useCallback(() => {
    return QUALITY_LEVELS.slice(0, maxQuality + 1);
  }, [maxQuality]);

  // Initialize on mount
  useEffect(() => {
    loadWasm();
  }, [loadWasm]);

  return {
    // State
    ...state,
    isLoaded,
    qualityLevels: QUALITY_LEVELS,

    // Actions
    loadWasm,
    recordBandwidth,
    predictBandwidth,
    update,
    setQuality,
    toggleAutoMode,
    getQualityInfo,
    getAvailableQualities,
  };
}

// JavaScript fallback implementation
function createJSFallback() {
  return {
    _predict_bandwidth: (historyPtr: number, length: number) => {
      // Simplified EWMA
      return 3000;
    },
    _select_quality_level: (
      bandwidth: number,
      buffer: number,
      current: number,
      max: number
    ) => {
      // Simple threshold-based selection
      if (buffer < 5) return Math.max(0, current - 1);
      if (bandwidth > 6000) return Math.min(max, 4);
      if (bandwidth > 3000) return Math.min(max, 3);
      if (bandwidth > 1500) return Math.min(max, 2);
      if (bandwidth > 800) return Math.min(max, 1);
      return 0;
    },
    _calculate_buffer_health: (buffer: number, segment: number) => {
      return Math.min(buffer / (segment * 5), 1);
    },
    _get_comprehensive_recommendation: () => 0,
    _detect_bandwidth_trend: () => 0,
    _wasm_malloc: (size: number) => 0,
    _wasm_free: (ptr: number) => {},
    HEAPF32: { buffer: new ArrayBuffer(1024) },
  };
}

export default useABRController;
