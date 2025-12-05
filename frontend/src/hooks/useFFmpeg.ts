"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useRef, useState, useCallback } from "react";

/**
 * Helper: Convert ffmpeg.readFile() result to Uint8Array safely.
 * ffmpeg.readFile() may return different types depending on build/config,
 * so normalize to Uint8Array before constructing Blobs.
 */
function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    // Create a new Uint8Array from a copy to ensure proper type
    const buffer = new ArrayBuffer(data.byteLength);
    const view = new Uint8Array(buffer);
    view.set(data);
    return view;
  }
  if (typeof data === "string") {
    // data is a binary string; decode via atob (browser) to get bytes
    try {
      const binary = atob(data);
      const len = binary.length;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = binary.charCodeAt(i);
      }
      return arr;
    } catch {
      // Fallback: encode string as UTF-8 bytes
      return new TextEncoder().encode(data);
    }
  }
  // Already Uint8Array or convertible
  return new Uint8Array(data as ArrayBuffer);
}

/**
 * Helper: Get video duration (simplified version)
 * In production, you'd parse ffprobe output for accurate duration
 */
async function getVideoDuration(ffmpeg: FFmpeg, filename: string): Promise<number> {
  // This is a simplified version - returns default duration
  // In production, you would run ffprobe and parse the output
  return 10; // Default 10 seconds
}

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (loaded || loading) return;

    try {
      setLoading(true);
      const ffmpeg = new FFmpeg();

      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });

      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      // Load ffmpeg-core from CDN
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (error) {
      console.error("Error loading FFmpeg:", error);
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  /**
   * Compress video before upload
   */
  const compressVideo = useCallback(
    async (file: File, targetSizeMB?: number): Promise<Blob> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      // Write input file to FFmpeg virtual filesystem
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Calculate bitrate if target size is specified
      let args = [
        "-i",
        inputName,
        "-c:v",
        "libx264",
        "-crf",
        "28",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
      ];

      if (targetSizeMB) {
        // Rough bitrate calculation
        const videoDuration = await getVideoDuration(ffmpeg, inputName);
        const targetBitrate = Math.floor(
          (targetSizeMB * 8192) / videoDuration - 128
        );
        args.push("-b:v", `${targetBitrate}k`);
      }

      args.push(outputName);

      // Run compression
      await ffmpeg.exec(args);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      const uint8 = toUint8Array(data as Uint8Array);

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return new Blob([], { type: "video/mp4" });
    },
    [loaded]
  );

  /**
   * Generate thumbnail from video
   */
  const generateThumbnail = useCallback(
    async (file: File, timestamp = 1): Promise<Blob> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "thumbnail.jpg";

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Extract frame at timestamp
      await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        timestamp.toString(),
        "-vframes",
        "1",
        "-vf",
        "scale=1280:720",
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      const uint8 = toUint8Array(data as Uint8Array);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return new Blob([], { type: "image/jpeg" });
    },
    [loaded]
  );

  /**
   * Generate multiple thumbnails for preview
   */
  const generateThumbnails = useCallback(
    async (file: File, count = 10): Promise<Blob[]> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const duration = await getVideoDuration(ffmpeg, inputName);
      const interval = duration / (count + 1);
      const thumbnails: Blob[] = [];

      for (let i = 1; i <= count; i++) {
        const timestamp = interval * i;
        const outputName = `thumb_${i}.jpg`;

        await ffmpeg.exec([
          "-i",
          inputName,
          "-ss",
          timestamp.toString(),
          "-vframes",
          "1",
          "-vf",
          "scale=320:180",
          outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);
        const uint8 = toUint8Array(data as Uint8Array);
        thumbnails.push(new Blob([], { type: "image/jpeg" }));

        await ffmpeg.deleteFile(outputName);
      }

      await ffmpeg.deleteFile(inputName);

      return thumbnails;
    },
    [loaded]
  );

  /**
   * Trim/cut video
   */
  const trimVideo = useCallback(
    async (file: File, startTime: number, endTime: number): Promise<Blob> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        startTime.toString(),
        "-to",
        endTime.toString(),
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-preset",
        "fast",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const uint8 = toUint8Array(data as Uint8Array);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return new Blob([], { type: "video/mp4" });
    },
    [loaded]
  );

  /**
   * Convert video format
   */
  const convertVideo = useCallback(
    async (file: File, outputFormat = "mp4"): Promise<Blob> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const uint8 = toUint8Array(data as Uint8Array);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const mimeType = `video/${outputFormat}`;
      return new Blob([uint8.buffer as ArrayBuffer], { type: mimeType });
    },
    [loaded]
  );

  /**
   * Extract audio from video
   */
  const extractAudio = useCallback(
    async (file: File): Promise<Blob> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "audio.mp3";

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-vn",
        "-acodec",
        "libmp3lame",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const uint8 = toUint8Array(data as Uint8Array);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return new Blob([uint8.buffer as ArrayBuffer], { type: "audio/mpeg" });
    },
    [loaded]
  );

  /**
   * Create GIF from video
   */
  const createGif = useCallback(
    async (
      file: File,
      startTime = 0,
      duration = 3,
      fps = 10,
      width = 480
    ): Promise<Blob> => {
      if (!loaded || !ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "output.gif";

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        startTime.toString(),
        "-t",
        duration.toString(),
        "-vf",
        `fps=${fps},scale=${width}:-1:flags=lanczos`,
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const uint8 = toUint8Array(data as Uint8Array);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return new Blob([uint8.buffer as ArrayBuffer], { type: "image/gif" });
    },
    [loaded]
  );

  return {
    loaded,
    loading,
    progress,
    load,
    compressVideo,
    generateThumbnail,
    generateThumbnails,
    trimVideo,
    convertVideo,
    extractAudio,
    createGif,
  };
}
