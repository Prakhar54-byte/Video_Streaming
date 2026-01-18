"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  Subtitles,
  PictureInPicture2,
  RotateCcw,
  FastForward,
  Gauge,
  Check,
  ChevronLeft,
} from "lucide-react";

const videojsLib: any = (videojs as any)?.default ?? (videojs as any);

interface QualityLevel {
  id: string;
  label: string;
  height: number;
  bitrate: number;
  enabled: boolean;
}

interface ModernVideoPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  autoPlay?: boolean;
  title?: string;
  spriteSheetUrl?: string;
  spriteSheetVttUrl?: string;
  introStartTime?: number;
  introEndTime?: number;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export function ModernVideoPlayer({
  src,
  fallbackSrc,
  poster,
  autoPlay = false,
  title,
  spriteSheetUrl,
  spriteSheetVttUrl,
  introStartTime,
  introEndTime,
  onEnded,
  onTimeUpdate,
  className,
}: ModernVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "speed">("main");
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showThumbnailPreview, setShowThumbnailPreview] = useState(false);

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Initialize player
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered", "w-full", "h-full");
    container.appendChild(videoElement);

    const getVideoType = (url: string) => {
      if (url.includes(".m3u8")) return "application/x-mpegURL";
      if (url.includes(".mp4")) return "video/mp4";
      if (url.includes(".webm")) return "video/webm";
      return "video/mp4";
    };

    try {
      const player = (playerRef.current = videojsLib(videoElement, {
        autoplay: autoPlay,
        controls: false, // We use custom controls
        responsive: true,
        fluid: false,
        fill: true,
        preload: "auto",
        playbackRates: speedOptions,
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            fastQualityChange: true,
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
        sources: [{ src, type: getVideoType(src) }],
        poster,
      }));

      // Event handlers
      player.on("play", () => setIsPlaying(true));
      player.on("pause", () => setIsPlaying(false));
      player.on("ended", () => {
        setIsPlaying(false);
        onEnded?.();
      });
      player.on("loadedmetadata", () => {
        setDuration(player.duration() || 0);
        setIsLoading(false);
      });
      player.on("timeupdate", () => {
        const time = player.currentTime() || 0;
        setCurrentTime(time);
        onTimeUpdate?.(time);

        // Skip intro logic - only show if there's a valid intro range
        const hasValidIntro = 
          introStartTime !== undefined && 
          introEndTime !== undefined && 
          introEndTime > introStartTime && 
          introEndTime > 0;
        
        if (hasValidIntro) {
          setShowSkipIntro(time >= introStartTime && time < introEndTime);
        } else {
          setShowSkipIntro(false);
        }
      });
      player.on("progress", () => {
        const bufferedEnd = player.bufferedEnd() || 0;
        setBuffered(bufferedEnd);
      });
      player.on("volumechange", () => {
        setVolume(player.volume() || 0);
        setIsMuted(player.muted() || false);
      });
      player.on("ratechange", () => {
        setPlaybackRate(player.playbackRate() || 1);
      });
      player.on("waiting", () => setIsLoading(true));
      player.on("canplay", () => setIsLoading(false));

      // Quality levels
      player.ready(() => {
        try {
          const qualityLevelsPlugin = player.qualityLevels?.();
          if (qualityLevelsPlugin) {
            qualityLevelsPlugin.on("addqualitylevel", () => {
              const levels: QualityLevel[] = [];
              for (let i = 0; i < qualityLevelsPlugin.length; i++) {
                const level = qualityLevelsPlugin[i];
                levels.push({
                  id: String(i),
                  label: `${level.height}p`,
                  height: level.height,
                  bitrate: level.bitrate,
                  enabled: level.enabled,
                });
              }
              levels.sort((a, b) => b.height - a.height);
              setQualityLevels(levels);
            });
          }

          // Initialize HLS quality selector if available
          if (player.hlsQualitySelector) {
            player.hlsQualitySelector({ displayCurrentQuality: true });
          }
        } catch (e) {
          console.warn("Quality levels plugin not available");
        }
      });

      // Error handling with fallback
      player.on("error", () => {
        if (fallbackSrc && player.currentSrc() !== fallbackSrc) {
          player.src({ src: fallbackSrc, type: getVideoType(fallbackSrc) });
          player.play();
        }
      });

    } catch (error) {
      console.error("VideoJS initialization error:", error);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbackSrc, poster, autoPlay]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Player controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    playerRef.current.muted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const newVolume = parseFloat(e.target.value);
    playerRef.current.volume(newVolume);
    if (newVolume > 0 && isMuted) {
      playerRef.current.muted(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    playerRef.current.currentTime(pos * duration);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverTime(pos * duration);
    setHoverPosition(e.clientX - rect.left);
    setShowThumbnailPreview(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!playerRef.current) return;
    const videoEl = playerRef.current.tech()?.el() as HTMLVideoElement;
    if (videoEl) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoEl.requestPictureInPicture();
      }
    }
  };

  const skipIntro = () => {
    if (playerRef.current && introEndTime) {
      playerRef.current.currentTime(introEndTime);
    }
  };

  const skip = (seconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.currentTime(Math.max(0, Math.min(duration, currentTime + seconds)));
  };

  const setQuality = (qualityId: string) => {
    if (!playerRef.current) return;
    const qualityLevelsPlugin = playerRef.current.qualityLevels?.();
    if (!qualityLevelsPlugin) return;

    if (qualityId === "auto") {
      for (let i = 0; i < qualityLevelsPlugin.length; i++) {
        qualityLevelsPlugin[i].enabled = true;
      }
      setCurrentQuality("auto");
    } else {
      for (let i = 0; i < qualityLevelsPlugin.length; i++) {
        qualityLevelsPlugin[i].enabled = String(i) === qualityId;
      }
      const level = qualityLevels.find((q) => q.id === qualityId);
      setCurrentQuality(level?.label || qualityId);
    }
    setSettingsView("main");
  };

  const setSpeed = (speed: number) => {
    if (!playerRef.current) return;
    playerRef.current.playbackRate(speed);
    setSettingsView("main");
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black aspect-video rounded-xl overflow-hidden group select-none",
        className
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
        setShowSettings(false);
      }}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Skip Intro Button */}
      {showSkipIntro && (
        <button
          onClick={skipIntro}
          className="absolute bottom-24 right-4 z-30 px-4 py-2 bg-white text-black font-semibold rounded-md 
                     hover:bg-white/90 transition-all shadow-lg flex items-center gap-2"
        >
          <SkipForward className="w-4 h-4" />
          Skip Intro
        </button>
      )}

      {/* Center Play Button (shown when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center 
                          hover:bg-white/30 hover:scale-110 transition-all">
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Double-tap to seek indicators */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0">
        <RotateCcw className="w-12 h-12 text-white" />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0">
        <FastForward className="w-12 h-12 text-white" />
      </div>

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 z-20 flex flex-col justify-end transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Title Bar */}
        {title && (
          <div className="absolute top-0 left-0 right-0 p-4">
            <h2 className="text-white text-lg font-semibold drop-shadow-lg line-clamp-1">
              {title}
            </h2>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="relative p-4 space-y-3">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress"
            onClick={handleSeek}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setShowThumbnailPreview(false)}
          >
            {/* Buffered */}
            <div
              className="absolute h-full bg-white/40 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Progress */}
            <div
              className="absolute h-full bg-red-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Hover preview time */}
            {showThumbnailPreview && hoverTime !== null && (
              <div
                className="absolute -top-10 transform -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded"
                style={{ left: hoverPosition }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
            {/* Scrubber */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full 
                         opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 text-white hover:bg-white/20 rounded-full transition"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="white" />
                ) : (
                  <Play className="w-6 h-6" fill="white" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition hidden sm:flex"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition hidden sm:flex"
              >
                <FastForward className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-white cursor-pointer"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm ml-2 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Subtitles */}
              <button className="p-2 text-white hover:bg-white/20 rounded-full transition hidden sm:flex">
                <Subtitles className="w-5 h-5" />
              </button>

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setSettingsView("main");
                  }}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition"
                >
                  <Settings className={cn("w-5 h-5 transition-transform", showSettings && "rotate-45")} />
                </button>

                {/* Settings Menu */}
                {showSettings && (
                  <div className="absolute bottom-12 right-0 w-56 bg-black/95 backdrop-blur-sm rounded-lg 
                                  shadow-xl border border-white/10 overflow-hidden">
                    {settingsView === "main" && (
                      <div className="py-1">
                        <button
                          onClick={() => setSettingsView("speed")}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition"
                        >
                          <span className="flex items-center gap-3 text-white">
                            <Gauge className="w-4 h-4" />
                            Playback Speed
                          </span>
                          <span className="text-white/60 text-sm">{playbackRate}x</span>
                        </button>
                        <button
                          onClick={() => setSettingsView("quality")}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition"
                        >
                          <span className="flex items-center gap-3 text-white">
                            <Settings className="w-4 h-4" />
                            Quality
                          </span>
                          <span className="text-white/60 text-sm">{currentQuality}</span>
                        </button>
                      </div>
                    )}

                    {settingsView === "speed" && (
                      <div className="py-1">
                        <button
                          onClick={() => setSettingsView("main")}
                          className="w-full px-4 py-2 flex items-center gap-2 text-white hover:bg-white/10 border-b border-white/10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Playback Speed
                        </button>
                        {speedOptions.map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setSpeed(speed)}
                            className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition"
                          >
                            <span className="text-white">{speed === 1 ? "Normal" : `${speed}x`}</span>
                            {playbackRate === speed && <Check className="w-4 h-4 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {settingsView === "quality" && (
                      <div className="py-1">
                        <button
                          onClick={() => setSettingsView("main")}
                          className="w-full px-4 py-2 flex items-center gap-2 text-white hover:bg-white/10 border-b border-white/10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Quality
                        </button>
                        <button
                          onClick={() => setQuality("auto")}
                          className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition"
                        >
                          <span className="text-white">Auto</span>
                          {currentQuality === "auto" && <Check className="w-4 h-4 text-blue-400" />}
                        </button>
                        {qualityLevels.map((level) => (
                          <button
                            key={level.id}
                            onClick={() => setQuality(level.id)}
                            className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition"
                          >
                            <span className="text-white">{level.label}</span>
                            {currentQuality === level.label && <Check className="w-4 h-4 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                className="p-2 text-white hover:bg-white/20 rounded-full transition hidden sm:flex"
              >
                <PictureInPicture2 className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-white/20 rounded-full transition"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts info (shown on first play) */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs hidden">
        Space: Play/Pause • ←→: Seek • ↑↓: Volume • F: Fullscreen
      </div>
    </div>
  );
}

export default ModernVideoPlayer;
