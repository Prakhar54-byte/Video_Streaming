"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector'
import { Settings, ChevronRight, ChevronLeft, Gauge, Film, FastForward, Check } from 'lucide-react';

const videojsLib: any = (videojs as any)?.default ?? (videojs as any);

type AspectRatioMode = 'auto' | '16:9' | '4:3' | '21:9' | '9:16' | 'fill';

// Skip duration options in seconds
const SKIP_DURATIONS = [5, 10, 15, 20, 30];

// Playback speed options
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface VideoJsPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  autoPlay?: boolean;
  spriteSheetVttUrl?: string;
  introStartTime?: number;
  introEndTime?: number;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayerReady?: (seekTo: (time: number) => void) => void;
  onVideoElementReady?: (videoElement: HTMLVideoElement) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onVolumeChange?: (volume: number) => void;
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
  onTimeUpdate,
  onPlayerReady,
  onVideoElementReady,
  onPlayStateChange,
  onVolumeChange,
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
  
  // Settings menu state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState<'main' | 'quality' | 'speed' | 'skip'>('main');
  const [skipDuration, setSkipDuration] = useState(10); // Default 10 seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [availableQualities, setAvailableQualities] = useState<{label: string; value: number}[]>([]);
  const [showSkipIndicator, setShowSkipIndicator] = useState<{direction: 'forward' | 'backward'; amount: number} | null>(null);
  
  // Dynamic dimension detection
  const [dimensions, setDimensions] = useState<VideoDimensions | null>(
    presetWidth && presetHeight 
      ? { width: presetWidth, height: presetHeight, aspectRatio: presetWidth / presetHeight }
      : null
  );

  // Calculate container style based on detected dimensions
  const getContainerStyle = useCallback((): React.CSSProperties => {
    // Simple 16:9 aspect ratio container
    return {
      width: '100%',
      paddingTop: '56.25%', // 16:9 aspect ratio
      position: 'relative' as const,
    };
  }, []);

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

    // Keyboard controls for video
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const player = playerRef.current;
      if (!player) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          const currentTime = player.currentTime();
          const duration = player.duration();
          player.currentTime(Math.min(duration, currentTime + skipDuration));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.currentTime(Math.max(0, player.currentTime() - skipDuration));
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.volume(Math.min(1, player.volume() + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.volume(Math.max(0, player.volume() - 0.1));
          break;
        case ' ':
          e.preventDefault();
          if (player.paused()) {
            player.play();
          } else {
            player.pause();
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          player.muted(!player.muted());
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (player.isFullscreen()) {
            player.exitFullscreen();
          } else {
            player.requestFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Listen for settings toggle from custom button in control bar
    const handleSettingsToggle = () => {
      setShowSettings(prev => !prev);
      setSettingsMenu('main');
    };
    window.addEventListener('videojs-toggle-settings', handleSettingsToggle);

    return ()=>{
      document.removeEventListener('visibilitychange',handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handelFocus);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('videojs-toggle-settings', handleSettingsToggle);
    }
  },[skipDuration])

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
        // Remove playback rates from default control bar (we have custom settings)
        playbackRates: [],
        controlBar: {
          volumePanel: {
            inline: false
          },
          // Hide redundant controls - we have custom settings gear
          playbackRateMenuButton: false,
          qualitySelector: false,
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

      // Apply minimal styling - keep Video.js defaults working
      const playerEl = player.el();
      if (playerEl) {
        const style = document.createElement('style');
        style.textContent = `
          /* Hide only specific quality selector buttons */
          .vjs-quality-selector.vjs-menu-button,
          .vjs-hls-quality-selector.vjs-menu-button,
          .vjs-playback-rate.vjs-menu-button {
            display: none !important;
          }
          .video-js .vjs-play-progress {
            background: #ef4444 !important;
          }
          /* Style for our custom settings button in control bar */
          .vjs-custom-settings-button {
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .vjs-custom-settings-button svg {
            width: 18px;
            height: 18px;
            fill: white;
          }
        `;
        playerEl.appendChild(style);
        
        // Add custom settings button to control bar
        const controlBar = playerEl.querySelector('.vjs-control-bar');
        if (controlBar) {
          const settingsBtn = document.createElement('button');
          settingsBtn.className = 'vjs-control vjs-button vjs-custom-settings-button';
          settingsBtn.title = 'Settings';
          settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
          settingsBtn.onclick = (e) => {
            e.stopPropagation();
            // Dispatch custom event to toggle settings
            window.dispatchEvent(new CustomEvent('videojs-toggle-settings'));
          };
          // Insert before fullscreen button
          const fullscreenBtn = controlBar.querySelector('.vjs-fullscreen-control');
          if (fullscreenBtn) {
            controlBar.insertBefore(settingsBtn, fullscreenBtn);
          } else {
            controlBar.appendChild(settingsBtn);
          }
        }
      }

      player.ready(() => {
        console.log('[VideoJS] Player ready');
        
        // Expose seek function to parent via callback
        if (onPlayerReady) {
          onPlayerReady((time: number) => {
            if (playerRef.current) {
              playerRef.current.currentTime(time);
            }
          });
        }
        
        // Expose video element for live audio waveform
        if (onVideoElementReady) {
          const videoEl = player.el()?.querySelector('video') as HTMLVideoElement;
          if (videoEl) {
            onVideoElementReady(videoEl);
          }
        }
        
        // Track play/pause state
        player.on('play', () => {
          onPlayStateChange?.(true);
        });
        player.on('pause', () => {
          onPlayStateChange?.(false);
        });
        
        // Track volume changes
        player.on('volumechange', () => {
          const vol = player.muted() ? 0 : player.volume();
          onVolumeChange?.(vol);
        });
        
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
          
          // Log available quality levels and populate state
          qualityLevels.on('addqualitylevel', () => {
            const levels: string[] = [];
            const qualityOptions: {label: string; value: number}[] = [];
            for (let i = 0; i < qualityLevels.length; i++) {
              const lvl = qualityLevels[i];
              const label = lvl.height ? `${lvl.height}p` : `Level ${i}`;
              levels.push(`${lvl.height}p (${Math.round(lvl.bitrate / 1000)}kbps)`);
              qualityOptions.push({ label, value: lvl.height || i });
            }
            // Sort by height descending
            qualityOptions.sort((a, b) => b.value - a.value);
            setAvailableQualities(qualityOptions);
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
        const duration = player.duration();
        
        // Call onTimeUpdate callback if provided
        if (onTimeUpdate && currentTime !== undefined && duration !== undefined) {
          onTimeUpdate(currentTime, duration);
        }
        
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

  // Skip forward/backward
  const handleSkip = useCallback((direction: 'forward' | 'backward') => {
    if (!playerRef.current) return;
    
    const currentTime = playerRef.current.currentTime();
    const duration = playerRef.current.duration();
    const skipAmount = direction === 'forward' ? skipDuration : -skipDuration;
    const newTime = Math.max(0, Math.min(duration, currentTime + skipAmount));
    
    playerRef.current.currentTime(newTime);
    
    // Show skip indicator
    setShowSkipIndicator({ direction, amount: skipDuration });
    setTimeout(() => setShowSkipIndicator(null), 800);
  }, [skipDuration]);

  // Handle playback speed change
  const handleSpeedChange = useCallback((speed: number) => {
    if (playerRef.current) {
      playerRef.current.playbackRate(speed);
      setPlaybackSpeed(speed);
    }
    setSettingsMenu('main');
  }, []);

  // Handle quality change
  const handleQualityChange = useCallback((qualityIndex: number) => {
    if (playerRef.current) {
      const qualityLevels = (playerRef.current as any).qualityLevels?.();
      if (qualityLevels && qualityLevels.length > 0) {
        // -1 means Auto (enable all levels)
        if (qualityIndex === -1) {
          for (let i = 0; i < qualityLevels.length; i++) {
            qualityLevels[i].enabled = true;
          }
          setCurrentQualityLabel('Auto');
        } else {
          // Find the actual index in qualityLevels that matches our sorted availableQualities
          const selectedQuality = availableQualities[qualityIndex];
          if (selectedQuality) {
            for (let i = 0; i < qualityLevels.length; i++) {
              const lvl = qualityLevels[i];
              const matches = lvl.height === selectedQuality.value;
              qualityLevels[i].enabled = matches;
            }
            setCurrentQualityLabel(selectedQuality.label);
          }
        }
        console.log('[VideoJS] Quality manually set to:', qualityIndex === -1 ? 'Auto' : availableQualities[qualityIndex]?.label);
      }
    }
    setSettingsMenu('main');
    setShowSettings(false);
  }, [availableQualities]);

  // Handle skip duration change
  const handleSkipDurationChange = useCallback((duration: number) => {
    setSkipDuration(duration);
    setSettingsMenu('main');
  }, []);

  // Double-tap to skip (for touch devices and double-click)
  const handleVideoAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    // Left third: skip backward, Right third: skip forward
    if (clickX < width / 3) {
      handleSkip('backward');
    } else if (clickX > (width * 2) / 3) {
      handleSkip('forward');
    }
  }, [handleSkip]);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-black shadow-2xl" style={{ paddingTop: '56.25%' }}>
      {/* Video.js container - absolute positioned to fill the padding container */}
      <div 
        ref={containerRef} 
        data-vjs-player 
        className="absolute inset-0 w-full h-full z-10"
        onDoubleClick={handleVideoAreaClick}
      />
      
      {/* Custom Overlay UI - pointer-events-none allows clicks to pass through to video */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{ pointerEvents: 'none' }}>
        
        {/* Top Gradient Overlay (visible on hover) */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Skip Indicator Animation */}
        {showSkipIndicator && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${showSkipIndicator.direction === 'forward' ? 'right-20' : 'left-20'} z-50`}>
            <div className="flex flex-col items-center animate-fade-in">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-5">
                {showSkipIndicator.direction === 'forward' ? (
                  <FastForward className="w-10 h-10 text-white" />
                ) : (
                  <ChevronLeft className="w-10 h-10 text-white" />
                )}
              </div>
              <span className="text-white text-lg font-bold mt-2 drop-shadow-lg">
                {showSkipIndicator.direction === 'forward' ? '+' : '-'}{showSkipIndicator.amount}s
              </span>
            </div>
          </div>
        )}

        {/* Center Skip Controls (YouTube-style) */}
        <div className="absolute inset-0 flex items-center justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Skip Backward */}
          <button
            onClick={() => handleSkip('backward')}
            className="pointer-events-auto bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-4 transition-all duration-200 hover:scale-110 active:scale-95"
            title={`Skip back ${skipDuration}s (← Arrow)`}
          >
            <div className="flex flex-col items-center">
              <ChevronLeft className="w-8 h-8" />
              <span className="text-xs font-medium">{skipDuration}s</span>
            </div>
          </button>
          
          {/* Skip Forward */}
          <button
            onClick={() => handleSkip('forward')}
            className="pointer-events-auto bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-4 transition-all duration-200 hover:scale-110 active:scale-95"
            title={`Skip forward ${skipDuration}s (→ Arrow)`}
          >
            <div className="flex flex-col items-center">
              <FastForward className="w-8 h-8" />
              <span className="text-xs font-medium">{skipDuration}s</span>
            </div>
          </button>
        </div>

        {/* Skip Intro Button (Netflix-style) */}
        {showSkipIntro && (
          <button
            onClick={handleSkipIntro}
            className="absolute bottom-20 right-4 z-50 pointer-events-auto bg-white text-black font-semibold px-6 py-2.5 rounded hover:bg-gray-200 transition-all duration-200 shadow-lg border border-white/20"
          >
            Skip Intro →
          </button>
        )}
        
        {/* Settings Menu - positioned above control bar */}
        {showSettings && (
          <div className="absolute bottom-12 right-2 z-50 pointer-events-auto">
            <div className="bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 min-w-[220px] overflow-hidden">
              {settingsMenu === 'main' && (
                <div className="py-2">
                  <p className="px-4 py-1.5 text-xs text-gray-400 uppercase tracking-wider font-semibold">Settings</p>
                  
                  <button
                    onClick={() => setSettingsMenu('quality')}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Film className="w-4 h-4 text-blue-400" />
                      Quality
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      {currentQualityLabel}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setSettingsMenu('speed')}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Gauge className="w-4 h-4 text-green-400" />
                      Speed
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setSettingsMenu('skip')}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <FastForward className="w-4 h-4 text-orange-400" />
                      Skip Duration
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      {skipDuration}s
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                  
                  <div className="border-t border-white/10 mt-2 pt-2 px-4 pb-2">
                    <p className="text-xs text-gray-500">
                      <span className="text-gray-400">Shortcuts:</span> ←→ Skip • ↑↓ Volume • Space Pause • M Mute • F Fullscreen
                    </p>
                  </div>
                </div>
              )}
              
              {settingsMenu === 'quality' && (
                <div className="py-2">
                  <button
                    onClick={() => setSettingsMenu('main')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/10 flex items-center gap-2 border-b border-white/10 mb-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Quality
                  </button>
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      Auto
                      <span className="text-xs text-gray-500">(Recommended)</span>
                    </span>
                    {currentQualityLabel.toLowerCase().includes('auto') && <Check className="w-4 h-4 text-green-400" />}
                  </button>
                  {availableQualities.map((q, i) => (
                    <button
                      key={q.value}
                      onClick={() => handleQualityChange(i)}
                      className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                    >
                      {q.label}
                      {currentQualityLabel === q.label && <Check className="w-4 h-4 text-green-400" />}
                    </button>
                  ))}
                </div>
              )}
              
              {settingsMenu === 'speed' && (
                <div className="py-2">
                  <button
                    onClick={() => setSettingsMenu('main')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/10 flex items-center gap-2 border-b border-white/10 mb-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Playback Speed
                  </button>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                      {playbackSpeed === speed && <Check className="w-4 h-4 text-green-400" />}
                    </button>
                  ))}
                </div>
              )}
              
              {settingsMenu === 'skip' && (
                <div className="py-2">
                  <button
                    onClick={() => setSettingsMenu('main')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/10 flex items-center gap-2 border-b border-white/10 mb-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Skip Duration
                  </button>
                  {SKIP_DURATIONS.map((duration) => (
                    <button
                      key={duration}
                      onClick={() => handleSkipDurationChange(duration)}
                      className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                    >
                      {duration} seconds
                      {skipDuration === duration && <Check className="w-4 h-4 text-green-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Speed Indicator Badge */}
        {playbackSpeed !== 1 && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full pointer-events-none">
            {playbackSpeed}x
          </div>
        )}
      </div>
      
      {/* Click outside to close settings */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
