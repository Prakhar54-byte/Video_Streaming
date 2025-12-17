"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useRef, useState, useCallback } from "react";

export function useThumbnailGenerator() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (isLoaded || isLoading) return;

    try {
      setIsLoading(true);
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        console.log(message); // For debugging
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });

      ffmpegRef.current = ffmpeg;
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading FFmpeg:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  const generateThumbnail = useCallback(
    async (file: File, timestamp: number): Promise<Blob | null> => {
      if (!ffmpegRef.current) {
        console.error("FFmpeg not loaded");
        return null;
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "thumbnail.jpg";

      try {
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        await ffmpeg.exec([
          "-i",
          inputName,
          "-ss",
          timestamp.toString(),
          "-vframes",
          "1",
          "-vf",
          "scale=1280:-1", // Create a 720p-width thumbnail
          outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);

        // Ensure data is Uint8Array before creating Blob
        const uint8Array =
          data instanceof Uint8Array
            ? data
            : new Uint8Array(data as ArrayBuffer);

        const thumbnailBlob = new Blob([uint8Array.buffer], {
          type: "image/jpeg",
        });

        // Cleanup virtual filesystem
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        return thumbnailBlob;
      } catch (error) {
        console.error("Error generating thumbnail:", error);
        return null;
      }
    },
    [],
  );

  return {
    isLoaded,
    isLoading,
    load,
    generateThumbnail,
  };
}
