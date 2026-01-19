"use client";

import { useCallback, useState } from "react";

/**
 * Thumbnail generator using native browser APIs (Video + Canvas)
 * 
 * Advantages over FFmpeg WASM:
 * - No file size limits (browser streams video efficiently)
 * - No WASM memory constraints
 * - Much faster (no need to load entire file into memory)
 * - Works on all modern browsers without additional dependencies
 */
export function useThumbnailGenerator() {
  const [isLoading, setIsLoading] = useState(false);

  // Native approach is always "loaded" - no WASM to initialize
  const isLoaded = true;

  // No-op load function for API compatibility
  const load = useCallback(async () => {
    // Native video/canvas approach doesn't need initialization
    return Promise.resolve();
  }, []);

  const generateThumbnail = useCallback(
    async (file: File, timestamp: number): Promise<Blob | null> => {
      setIsLoading(true);

      try {
        // Create object URL for the video file
        const videoUrl = URL.createObjectURL(file);

        // Create video element for frame extraction
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error("Failed to load video metadata"));
          video.src = videoUrl;
        });

        // Clamp timestamp to valid range
        const clampedTime = Math.max(0, Math.min(timestamp, video.duration));

        // Seek to the desired timestamp
        await new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error("Failed to seek video"));
          video.currentTime = clampedTime;
        });

        // Wait for frame to be ready
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.oncanplay = () => resolve();
          }
        });

        // Create canvas and draw the video frame
        const canvas = document.createElement("canvas");
        
        // Use video's natural dimensions, scale to max 1280px width
        const maxWidth = 1280;
        const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Clean up video resources
        URL.revokeObjectURL(videoUrl);
        video.remove();

        // Convert canvas to blob
        return new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (blob) => {
              canvas.remove();
              resolve(blob);
            },
            "image/jpeg",
            0.9 // Quality: 90%
          );
        });
      } catch (error) {
        console.error("Error generating thumbnail:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoaded,
    isLoading,
    load,
    generateThumbnail,
  };
}
