/**
 * Enhanced Video Player Component
 * Integrates WASM-powered ABR, frame analysis, and quality metrics
 */

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  BarChart2,
} from "lucide-react";

// Import WASM hooks
import useABRController from "@/hooks/useABRController";
import useFrameAnalyzer from "@/hooks/useFrameAnalyzer";

// Import components
import {
  VideoQualityPanel,
  ABRControls,
  WaveformViewer,
  DuplicateDetectionPanel,
} from "@/components/video";

interface EnhancedVideoPlayerProps {
  src: string;
  hlsSources?: { quality: string; src: string }[];
  title?: string;
  poster?: string;
  waveformPeaks?: number[];
  onTimeUpdate?: (time: number) => void;
  onQualityChange?: (quality: number) => void;
  className?: string;
}

export function EnhancedVideoPlayer({
  src,
  hlsSources,
  title,
  poster,
  waveformPeaks,
  onTimeUpdate,
  onQualityChange,
  className = "",
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // WASM hooks
  const abr = useABRController({
    maxQuality: hlsSources?.length ? hlsSources.length - 1 : 4,
    segmentDuration: 4,
    updateInterval: 1000,
  });

  const frameAnalyzer = useFrameAnalyzer();

  // Frame analysis state
  const [analysisInterval, setAnalysisInterval] = useState<NodeJS.Timeout | null>(null);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Handle volume
  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      setIsMuted(value === 0);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  // Handle quality change
  const handleQualityChange = useCallback(
    (level: number) => {
      abr.setQuality(level);
      onQualityChange?.(level);

      // In a real implementation, this would switch HLS source
      if (hlsSources && hlsSources[level]) {
        // Switch video source
        console.log(`Switching to ${hlsSources[level].quality}`);
      }
    },
    [abr, hlsSources, onQualityChange]
  );

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleProgress = () => {
      // Update ABR with buffer info
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferAhead = bufferedEnd - video.currentTime;
        abr.update(bufferAhead);
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("progress", handleProgress);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("progress", handleProgress);
    };
  }, [abr, onTimeUpdate]);

  // Start frame analysis when playing
  useEffect(() => {
    if (isPlaying && showStats && frameAnalyzer.isLoaded) {
      const interval = setInterval(() => {
        if (videoRef.current) {
          frameAnalyzer.analyzeFrame(videoRef.current);
        }
      }, 500); // Analyze every 500ms
      setAnalysisInterval(interval);
    } else {
      if (analysisInterval) {
        clearInterval(analysisInterval);
        setAnalysisInterval(null);
      }
    }

    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, [isPlaying, showStats, frameAnalyzer.isLoaded]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video bg-black"
        onClick={togglePlay}
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4">
          {title && <h2 className="text-white text-lg font-semibold">{title}</h2>}
        </div>

        {/* Center Play Button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          {!isPlaying && (
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          )}
        </button>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={([value]) => handleSeek(value)}
            className="w-full"
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="white" />
                ) : (
                  <Play className="w-5 h-5" fill="white" />
                )}
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => handleVolumeChange(value)}
                  className="w-20"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Stats Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStats(!showStats)}
                className={`text-white hover:bg-white/20 ${
                  showStats ? "bg-white/20" : ""
                }`}
              >
                <BarChart2 className="w-5 h-5" />
              </Button>

              {/* Quality Settings */}
              <ABRControls
                currentQuality={abr.currentQuality}
                recommendedQuality={abr.recommendedQuality}
                isAutoMode={abr.isAutoMode}
                bandwidth={abr.bandwidth}
                rebufferRisk={abr.rebufferRisk}
                estimatedQoE={abr.estimatedQoE}
                qualityLevels={abr.qualityLevels}
                onQualityChange={handleQualityChange}
                onAutoModeToggle={abr.toggleAutoMode}
                compact={true}
                className="text-white"
              />

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="absolute top-4 right-4 w-64 space-y-2">
          <VideoQualityPanel
            quality={frameAnalyzer.lastAnalysis?.quality || null}
            motion={frameAnalyzer.lastAnalysis?.motion || null}
            bandwidth={abr.bandwidth}
            bufferHealth={abr.bufferHealth}
            trend={abr.trend}
            className="bg-black/80 backdrop-blur text-white"
          />
        </div>
      )}

      {/* Waveform (shown below video) */}
      {waveformPeaks && (
        <WaveformViewer
          peaks={waveformPeaks}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
          sceneChanges={frameAnalyzer.sceneChanges}
          className="mt-2"
        />
      )}
    </div>
  );
}

export default EnhancedVideoPlayer;
