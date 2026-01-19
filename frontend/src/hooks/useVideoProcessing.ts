"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "@/lib/api";

interface ProcessingStatus {
  status: "pending" | "processing" | "completed" | "failed";
  stage?: "transcode" | "hls" | "thumbnails" | "intro" | "complete"; // Current processing stage
  progress?: number; // Processing progress 0-100
  variants?: {
    quality: string;
    path: string;
    width: number;
    height: number;
    bitrate: number;
  }[];
  hlsPlaylist?: string;
  thumbnails?: string;
  metadata?: {
    duration: number;
    width: number;
    height: number;
    codec: string;
    bitrate: number;
    fps: number;
  };
  error?: string;
}

interface UseVideoProcessingOptions {
  videoId: string | null;
  pollInterval?: number; // milliseconds
  onComplete?: (status: ProcessingStatus) => void;
  onError?: (error: string) => void;
}

export function useVideoProcessingStatus({
  videoId,
  pollInterval = 3000,
  onComplete,
  onError,
}: UseVideoProcessingOptions) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const fetchStatus = useCallback(async () => {
    if (!videoId) return null;

    try {
      const response = await apiClient.get(`/video-processing/status/${videoId}`);
      const data = response.data.data as ProcessingStatus;
      setStatus(data);
      setError(null);

      // Check if processing is complete
      if (data.status === "completed") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setIsPolling(false);
        onCompleteRef.current?.(data);
      } else if (data.status === "failed") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setIsPolling(false);
        const errorMsg = data.error || "Video processing failed";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      } else {
        // Update polling status based on whether we're actually polling
        setIsPolling(!!pollRef.current);
      }

      return data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch processing status";
      setError(errorMsg);
      return null;
    }
  }, [videoId]);

  const startPolling = useCallback(() => {
    if (!videoId) return;

    // Use a ref check instead of state to avoid dependency issues
    if (pollRef.current) return; // Already polling

    fetchStatus(); // Initial fetch

    pollRef.current = setInterval(() => {
      fetchStatus();
    }, pollInterval);
  }, [videoId, fetchStatus, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // Auto-start polling when videoId changes
  useEffect(() => {
    if (videoId) {
      startPolling();
    } else {
      stopPolling();
      setStatus(null);
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]); // Only depend on videoId, not the functions

  return {
    status,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refetch: fetchStatus,
  };
}

// Hook for tracking upload progress with server events
export function useUploadProgress() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle");
  const [message, setMessage] = useState("");

  const reset = useCallback(() => {
    setProgress(0);
    setStage("idle");
    setMessage("");
  }, []);

  const setUploading = useCallback((percent: number, fileName?: string) => {
    setProgress(percent);
    setStage("uploading");
    setMessage(fileName ? `Uploading ${fileName}...` : "Uploading...");
  }, []);

  const setProcessing = useCallback(() => {
    setProgress(100);
    setStage("processing");
    setMessage("Processing video... This may take a few minutes.");
  }, []);

  const setComplete = useCallback(() => {
    setProgress(100);
    setStage("complete");
    setMessage("Upload complete! Your video is ready.");
  }, []);

  const setError = useCallback((errorMessage: string) => {
    setStage("error");
    setMessage(errorMessage);
  }, []);

  return {
    progress,
    stage,
    message,
    reset,
    setUploading,
    setProcessing,
    setComplete,
    setError,
  };
}

export default useVideoProcessingStatus;
