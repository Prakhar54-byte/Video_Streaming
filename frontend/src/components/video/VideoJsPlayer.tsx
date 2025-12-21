"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css'; // Import Video.js CSS

// Handle ESM/CJS interop differences safely.
const videojsLib: any = (videojs as any)?.default ?? (videojs as any);

interface VideoJsPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  autoPlay?: boolean;
  spriteSheetVttUrl?: string; // New prop for VTT thumbnails
  introStartTime?: number; // New prop for skip intro
  introEndTime?: number; // New prop for skip intro
}

export function VideoJsPlayer({ src, fallbackSrc, poster, autoPlay = true, spriteSheetVttUrl, introStartTime, introEndTime }: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null); // video.js player instance
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const didFallbackRef = useRef(false);

  const getVideoType = useCallback((url: string) => {
    if (url.includes('.m3u8')) return 'application/x-mpegURL';
    if (url.includes('.mp4')) return 'video/mp4';
    if (url.includes('.webm')) return 'video/webm';
    return 'video/mp4';
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any existing player/element before creating a new one
    // This ensures we have a fresh start if dependencies change
    container.innerHTML = '';

    // Create video element programmatically to avoid React/Video.js DOM conflicts
    const videoElement = document.createElement("video-js");
    videoElement.classList.add('vjs-big-play-centered');
    videoElement.classList.add('w-full');
    videoElement.classList.add('h-full');
    
    // Append to container
    container.appendChild(videoElement);

    const initialType = getVideoType(src);
    console.log('[VideoJS] Init with URL:', src);
    console.log('[VideoJS] Type:', initialType);

    let player: any;
    try {
      if (typeof videojsLib !== 'function') {
        throw new Error(`videojs import is not a function (got: ${typeof videojsLib})`);
      }

      player = (playerRef.current = videojsLib(videoElement, {
        autoplay: autoPlay,
        controls: true,
        responsive: true,
        fluid: false,
        fill: true,
        preload: 'auto',
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
      }));

      player.ready(() => {
        console.log('[VideoJS] Player ready, tech:', player.tech({ IWillNotUseThisInPlugins: true })?.name);
      });

      player.on('error', () => {
        const err = player.error();
        console.error('[VideoJS] ERROR:', err);
        
        const isHls = src.includes('.m3u8');
        if (isHls && fallbackSrc && !didFallbackRef.current) {
          didFallbackRef.current = true;
          console.warn('[VideoJS] HLS failed, falling back to:', fallbackSrc);
          const fallbackType = getVideoType(fallbackSrc);
          player.src({ src: fallbackSrc, type: fallbackType });
          player.play()?.catch(() => {});
        }
      });

      // Add VTT track for sprite sheet thumbnails if available
      if (spriteSheetVttUrl) {
        console.log("Adding sprite track:", spriteSheetVttUrl);
        player.addRemoteTextTrack(
          {
            kind: 'metadata',
            src: spriteSheetVttUrl,
            default: true,
            label: 'thumbnails',
          },
          false
        );
      }

      // Add timeupdate listener for skip intro
      player.on('timeupdate', () => {
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

    } catch (e) {
      console.error('Failed to initialize Video.js:', e);
    }

    // Cleanup function
    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [src, fallbackSrc, poster, autoPlay, spriteSheetVttUrl, introStartTime, introEndTime, getVideoType]);

  const handleSkipIntro = () => {
    if (playerRef.current && introEndTime !== undefined) {
      playerRef.current.currentTime(introEndTime);
      setShowSkipIntro(false);
    }
  };

  return (
    <div ref={containerRef} data-vjs-player className="relative w-full h-full bg-black rounded-xl overflow-hidden aspect-video">
      {/* Video element will be injected here */}
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


