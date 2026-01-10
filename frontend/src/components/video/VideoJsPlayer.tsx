"use client";

import { get } from 'http';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import { set } from 'video.js/dist/types/tech/middleware';
import 'video.js/dist/video-js.css'; // Import Video.js CSS
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector'

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
  onEnded?:() => void;
}

export function VideoJsPlayer({ src, fallbackSrc, poster, autoPlay = true, spriteSheetVttUrl, introStartTime, introEndTime, onEnded }: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null); // video.js player instance
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isPrivacyProtected,setIsPrivacyProtected] = useState(false);
  const [showEndScreemn,setShowEndScreen] = useState(false);
  const didFallbackRef = useRef(false);

  const getVideoType = useCallback((url: string) => {
    if (url.includes('.m3u8')) return 'application/x-mpegURL';
    if (url.includes('.mp4')) return 'video/mp4';
    if (url.includes('.webm')) return 'video/webm';
    return 'video/mp4';
  }, []);

  useEffect(()=>{

    const handleVisibilityChange=()=>{
      if(document.hidden){
        setIsPrivacyProtected(true);
        if(playerRef.current && !playerRef.current.paused()){
          playerRef.current.pause();
        }
      }else{
        setIsPrivacyProtected(false);
      }
    }

    const handleBlur = () => setIsPrivacyProtected(true);
    const handelFocus = () => setIsPrivacyProtected(false);

    document.addEventListener('visibilitychange',handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handelFocus);

    return ()=>{
      document.removeEventListener('visibilitychange',handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handelFocus);
    }
  },[])

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
    console.log('[VideoJS] Skip Intro Config:', JSON.stringify({ introStartTime, introEndTime }));

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
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        controlBar: {
          volumePanel: {
            inline: false
          }
        },
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
        console.log('[VideoJS] Player ready, tech:')
        if ((player as any).hlsQualitySelector){
            (player as any).hlsQualitySelector({
              displayCurrentQuality: true,
            })
          }

      });

      player.on('encoded',()=>{
        setShowEndScreen(true);
        if(onEnded)onEnded();
      })

      player.on('play',()=>setShowEndScreen(false));

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
  }, [src, fallbackSrc, poster, autoPlay, spriteSheetVttUrl, introStartTime, introEndTime, getVideoType,onEnded]);

  const handleSkipIntro = () => {
    if (playerRef.current && introEndTime !== undefined) {
      playerRef.current.currentTime(introEndTime);
      setShowSkipIntro(false);
    }
  };

  return (
    <div ref={containerRef} data-vjs-player className="relative w-full h-full bg-black rounded-xl overflow-hidden aspect-video shadow-2xl ring-1 ring-white/10">
      {/* Video element will be injected here */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-24 right-6 z-50 skip-intro-btn"
        >
          Skip Intro
        </button>
      )}
    </div>
  );
}


