"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css"; // Import Video.js CSS

interface VideoJsPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  autoPlay?: boolean;
  spriteSheetVttUrl?: string; // New prop for VTT thumbnails
  introStartTime?: number; // New prop for skip intro
  introEndTime?: number; // New prop for skip intro
}

export function VideoJsPlayer({
  src,
  fallbackSrc,
  poster,
  autoPlay = true,
  spriteSheetVttUrl,
  introStartTime,
  introEndTime,
}: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null); // video.js player instance
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const didFallbackRef = useRef(false);

  const getVideoType = useCallback((url: string) => {
    if (url.includes(".m3u8")) return "application/x-mpegURL";
    if (url.includes(".mp4")) return "video/mp4";
    if (url.includes(".webm")) return "video/webm";
    return "video/mp4";
  }, []);

  const setPlayerSource = useCallback(
    (url: string) => {
      if (!playerRef.current) return;
      const videoType = getVideoType(url);
      console.log("Loading video:", url, "Type:", videoType);
      playerRef.current.src({ src: url, type: videoType });
    },
    [getVideoType],
  );

  useLayoutEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (playerRef.current) return;

    let cancelled = false;
    let rafId: number | null = null;

    const initWhenConnected = () => {
      if (cancelled) return;

      // Video.js warns if you initialize with a node not attached to the DOM.
      if (!videoElement.isConnected) {
        rafId = window.requestAnimationFrame(initWhenConnected);
        return;
      }

      const initialType = getVideoType(src);
      console.log("Loading video:", src, "Type:", initialType);

      // Initialize Video.js player once.
      const player = (playerRef.current = videojs(
        videoElement,
        {
          autoplay: autoPlay,
          controls: true,
          responsive: true,
          // The parent container already enforces aspect ratio; fill it.
          fluid: false,
          fill: true,
          preload: "auto",
          poster: poster,
          html5: {
            vhs: {
              overrideNative: true,
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false,
          },
          sources: [{ src, type: initialType }],
        },
        () => {
          console.log("Video.js player is ready");
        },
      ));

      // Add VTT track for sprite sheet thumbnails if available
      if (spriteSheetVttUrl) {
        player.addRemoteTextTrack(
          {
            kind: "metadata",
            src: spriteSheetVttUrl,
            default: true,
            label: "thumbnails",
          },
          false,
        );
      }

      // Add timeupdate listener for skip intro
      player.on("timeupdate", () => {
        const currentTime = player.currentTime();
        if (
          currentTime !== undefined &&
          introStartTime !== undefined &&
          introEndTime !== undefined &&
          currentTime >= introStartTime &&
          currentTime < introEndTime
        ) {
          setShowSkipIntro(true);
        } else {
          setShowSkipIntro(false);
        }
      });

      // Add error handling + HLS -> MP4 fallback
      player.on("error", () => {
        const err = player.error();
        console.error("Video.js error:", err);
        if (err) {
          console.error("Error code:", err.code);
          console.error("Error message:", err.message);
        }

        const isHls = src.includes(".m3u8");
        if (isHls && fallbackSrc && !didFallbackRef.current) {
          didFallbackRef.current = true;
          console.warn("HLS failed; falling back to MP4:", fallbackSrc);
          setPlayerSource(fallbackSrc);
          player.play()?.catch(() => {});
        }
      });
    };

    initWhenConnected();

    // Cleanup only on unmount (avoids StrictMode double-mount warnings).
    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [
    autoPlay,
    poster,
    spriteSheetVttUrl,
    introStartTime,
    introEndTime,
    src,
    fallbackSrc,
    setPlayerSource,
    getVideoType,
  ]);

  // Update source when URL changes
  useEffect(() => {
    if (!playerRef.current) return;
    didFallbackRef.current = false;
    setPlayerSource(src);
  }, [src, setPlayerSource]);

  const handleSkipIntro = () => {
    if (playerRef.current && introEndTime !== undefined) {
      playerRef.current.currentTime(introEndTime);
      setShowSkipIntro(false);
    }
  };

  return (
    <div data-vjs-player className="relative">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered w-full h-full"
        crossOrigin="anonymous"
      />
      {showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg z-10"
        >
          Skip Intro
        </button>
      )}
    </div>
  );
}
