"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector'

const videojsLib: any = (videojs as any)?.default ?? (videojs as any);

type AspectRatioMode = 'auto' | '16:9' | '4:3' | '21:9' | '9:16' | 'fill';

interface VideoJsPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  autoPlay?: boolean;
  spriteSheetVttUrl?: string;
  introStartTime?: number;
  introEndTime?: number;
  onEnded?: () => void;
  aspectRatioMode?: AspectRatioMode;
  // Pre-known dimensions from backend (if available)
  videoWidth?: number;
  videoHeight?: number;
}

interface VideoDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export function VideoJsPlayer({ 
  src, 
  fallbackSrc, 
  poster, 
  autoPlay = true, 
  spriteSheetVttUrl, 
  introStartTime, 
  introEndTime, 
  onEnded,
  aspectRatioMode = 'auto',
  videoWidth: presetWidth,
  videoHeight: presetHeight
}: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isPrivacyProtected, setIsPrivacyProtected] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const didFallbackRef = useRef(false);
  const [currentQualityLabel, setCurrentQualityLabel] = useState<string>('--');
  
  // Dynamic dimension detection
  const [dimensions, setDimensions] = useState<VideoDimensions | null>(
    presetWidth && presetHeight 
      ? { width: presetWidth, height: presetHeight, aspectRatio: presetWidth / presetHeight }
      : null
  );

  // Calculate container style based on detected dimensions
  const getContainerStyle = useCallback((): React.CSSProperties => {
    if (aspectRatioMode === 'fill') {
      return { width: '100%', height: '100%' };
    }

    // Predefined aspect ratios
    const aspectRatios: Record<string, number> = {
      '16:9': 16/9,
      '4:3': 4/3,
      '21:9': 21/9,
      '9:16': 9/16,
    };

    let ratio = 16/9; // Default fallback

    if (aspectRatioMode !== 'auto' && aspectRatios[aspectRatioMode]) {
      ratio = aspectRatios[aspectRatioMode];
    } else if (dimensions) {
      ratio = dimensions.aspectRatio;
    }

    // For vertical videos (9:16, TikTok style), limit max height
    if (ratio < 1) {
      return {
        width: '100%',
        maxWidth: '400px',
        aspectRatio: `${ratio}`,
        margin: '0 auto',
      };
    }

    return {
      width: '100%',
      aspectRatio: `${ratio}`,
    };
  }, [aspectRatioMode, dimensions]);

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

      // Apply object-fit using CSS class instead of direct tech access
      // This avoids the "Using the tech directly can be dangerous" warning
      const playerEl = player.el();
      if (playerEl) {
        const style = document.createElement('style');
        style.textContent = `
          .vjs-tech {
            object-fit: contain !important;
          }
        `;
        playerEl.appendChild(style);
      }

      player.ready(() => {
        console.log('[VideoJS] Player ready');
        
        // Use Video.js events instead of direct tech access for dimension detection
        player.on('loadedmetadata', () => {
          const width = player.videoWidth();
          const height = player.videoHeight();
          if (width && height && !dimensions) {
            console.log(`[VideoJS] Detected dimensions: ${width}x${height}`);
            setDimensions({
              width,
              height,
              aspectRatio: width / height,
            });
          }
        });

        // Check if dimensions are already available
        const currentWidth = player.videoWidth();
        const currentHeight = player.videoHeight();
        if (currentWidth && currentHeight && !dimensions) {
          setDimensions({
            width: currentWidth,
            height: currentHeight,
            aspectRatio: currentWidth / currentHeight,
          });
        }

        if ((player as any).hlsQualitySelector) {
          (player as any).hlsQualitySelector({
            displayCurrentQuality: true,
          });
        }

        // Track quality levels for debugging
        const qualityLevels = (player as any).qualityLevels?.();
        if (qualityLevels) {
          qualityLevels.on('change', () => {
            for (let i = 0; i < qualityLevels.length; i++) {
              if (qualityLevels[i].enabled) {
                const level = qualityLevels[i];
                const label = level.height ? `${level.height}p` : 'Auto';
                setCurrentQualityLabel(label);
                console.log(`[VideoJS] Quality changed to: ${label} (${level.width}x${level.height}, ${Math.round(level.bitrate / 1000)}kbps)`);
                break;
              }
            }
          });
          
          // Log available quality levels
          qualityLevels.on('addqualitylevel', () => {
            const levels: string[] = [];
            for (let i = 0; i < qualityLevels.length; i++) {
              const lvl = qualityLevels[i];
              levels.push(`${lvl.height}p (${Math.round(lvl.bitrate / 1000)}kbps)`);
            }
            console.log('[VideoJS] Available quality levels:', levels.join(', '));
          });
        }
      });

      player.on('ended', () => {
        setShowEndScreen(true);
        if (onEnded) onEnded();
      });

      player.on('play', () => setShowEndScreen(false));

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
      // Only show skip intro if there's a valid intro range (endTime > startTime and endTime > 0)
      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        const hasValidIntro = 
          introStartTime !== undefined && 
          introEndTime !== undefined && 
          introEndTime > introStartTime && 
          introEndTime > 0;
        
        if (
          hasValidIntro &&
          currentTime !== undefined &&
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbackSrc, poster, autoPlay, spriteSheetVttUrl, introStartTime, introEndTime, getVideoType, onEnded]);

  const handleSkipIntro = () => {
    if (playerRef.current && introEndTime !== undefined) {
      playerRef.current.currentTime(introEndTime);
      setShowSkipIntro(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      data-vjs-player 
      className="relative bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
      style={getContainerStyle()}
    >
      {/* Video element will be injected here */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-24 right-6 z-50 skip-intro-btn"
        >
          Skip Intro
        </button>
      )}
      
      {/* Quality & Dimension indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-green-400">Quality:</span>
            <span className="font-bold">{currentQualityLabel}</span>
          </div>
          {dimensions && (
            <div className="flex items-center gap-2">
              <span className="text-blue-400">Actual:</span>
              <span>{dimensions.width}x{dimensions.height}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


