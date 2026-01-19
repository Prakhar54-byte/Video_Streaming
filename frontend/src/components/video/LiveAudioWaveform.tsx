/**
 * Live Audio Waveform Component
 * Real-time audio visualization using Web Audio API
 * Shows live audio amplitude that responds to playback state and volume
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Eye, EyeOff, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Predefined waveform color themes
const WAVEFORM_COLORS = [
  { name: "Blue", primary: "#3b82f6", secondary: "#1d4ed8" },
  { name: "Purple", primary: "#8b5cf6", secondary: "#6d28d9" },
  { name: "Green", primary: "#22c55e", secondary: "#16a34a" },
  { name: "Orange", primary: "#f97316", secondary: "#ea580c" },
  { name: "Pink", primary: "#ec4899", secondary: "#db2777" },
  { name: "Cyan", primary: "#06b6d4", secondary: "#0891b2" },
  { name: "Red", primary: "#ef4444", secondary: "#dc2626" },
  { name: "Yellow", primary: "#eab308", secondary: "#ca8a04" },
];

interface LiveAudioWaveformProps {
  videoElement: HTMLVideoElement | null;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  volume: number;
  className?: string;
  compact?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  initialColor?: { primary: string; secondary: string };
}

export function LiveAudioWaveform({
  videoElement,
  duration,
  currentTime,
  onSeek,
  isPlaying,
  volume,
  className = "",
  compact = false,
  onVisibilityChange,
  initialColor = WAVEFORM_COLORS[0],
}: LiveAudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const connectedVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const [isVisible, setIsVisible] = useState(true);
  const [waveformColor, setWaveformColor] = useState(initialColor);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!videoElement || connectedVideoRef.current === videoElement) return;

    // Clean up previous connection
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaElementSource(videoElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = dataArray;
      connectedVideoRef.current = videoElement;

      console.log("[LiveAudioWaveform] Audio context initialized");
    } catch (error) {
      console.error("[LiveAudioWaveform] Failed to initialize audio context:", error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoElement]);

  // Resume audio context on user interaction (browser requirement)
  useEffect(() => {
    const resumeContext = () => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener("click", resumeContext, { once: true });
    document.addEventListener("keydown", resumeContext, { once: true });

    return () => {
      document.removeEventListener("click", resumeContext);
      document.removeEventListener("keydown", resumeContext);
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Draw live waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!canvas || !isVisible) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    // Use CSS dimensions, not canvas dimensions (which are scaled for DPI)
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const midY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#1a1a2e");
    bgGradient.addColorStop(0.5, "#16162a");
    bgGradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Get audio data if available and playing
    let amplitudeData: number[] = [];
    
    if (analyser && dataArray && isPlaying) {
      analyser.getByteFrequencyData(dataArray); // Use frequency data for better visualization
      
      // Normalize to 0-1 range and apply volume
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] / 255;
        amplitudeData.push(value * Math.max(0.3, volume));
      }
    } else {
      // When paused, show minimal idle bars
      amplitudeData = new Array(64).fill(0).map(() => Math.random() * 0.05);
    }

    // Draw waveform bars
    const barCount = Math.min(amplitudeData.length, 64);
    const gap = 2;
    const barWidth = (width - gap * barCount) / barCount;
    const maxBarHeight = (height - 24) / 2; // Leave space for progress bar

    // Create gradient for bars
    const barGradient = ctx.createLinearGradient(0, midY - maxBarHeight, 0, midY + maxBarHeight);
    barGradient.addColorStop(0, waveformColor.primary);
    barGradient.addColorStop(0.5, waveformColor.secondary);
    barGradient.addColorStop(1, waveformColor.primary);

    // Draw center reference line (subtle)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Draw mirrored bars
    for (let i = 0; i < barCount; i++) {
      const amplitude = amplitudeData[i] || 0;
      const barHeight = Math.max(3, amplitude * maxBarHeight);
      const x = i * (barWidth + gap);

      // Bar gradient with glow when playing
      if (isPlaying && amplitude > 0.1) {
        ctx.shadowColor = waveformColor.primary;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = barGradient;
      
      // Draw rounded bars (top half)
      ctx.beginPath();
      ctx.roundRect(x, midY - barHeight, barWidth, barHeight, 2);
      ctx.fill();
      
      // Draw rounded bars (bottom half - mirror)
      ctx.beginPath();
      ctx.roundRect(x, midY, barWidth, barHeight, 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Draw progress track at bottom
    const progressY = height - 10;
    const progressHeight = 4;
    const progressRadius = 2;
    
    // Background track
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(0, progressY, width, progressHeight, progressRadius);
    ctx.fill();
    
    // Progress fill
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressWidth = width * progress;
    
    if (progressWidth > 0) {
      const progressGradient = ctx.createLinearGradient(0, 0, progressWidth, 0);
      progressGradient.addColorStop(0, waveformColor.secondary);
      progressGradient.addColorStop(1, waveformColor.primary);
      ctx.fillStyle = progressGradient;
      ctx.beginPath();
      ctx.roundRect(0, progressY, progressWidth, progressHeight, progressRadius);
      ctx.fill();
    }

    // Draw playhead circle
    const playheadX = Math.max(6, Math.min(width - 6, progressWidth));
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(playheadX, progressY + progressHeight / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw hover time tooltip
    if (hoveredTime !== null && isHovering) {
      const hoverProgress = duration > 0 ? hoveredTime / duration : 0;
      const hoverX = width * hoverProgress;
      
      // Vertical line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      // Time tooltip bubble
      const timeText = formatTime(hoveredTime);
      ctx.font = "bold 11px system-ui, sans-serif";
      const textWidth = ctx.measureText(timeText).width + 10;
      const tooltipX = Math.min(Math.max(hoverX - textWidth / 2, 2), width - textWidth - 2);
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.beginPath();
      ctx.roundRect(tooltipX, 4, textWidth, 18, 4);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.fillText(timeText, tooltipX + 5, 16);
    }

    // Time labels
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText(formatTime(currentTime), 6, height - 18);
    
    const durationText = formatTime(duration);
    const durationWidth = ctx.measureText(durationText).width;
    ctx.fillText(durationText, width - durationWidth - 6, height - 18);

    animationRef.current = requestAnimationFrame(draw);
  }, [isVisible, isPlaying, volume, waveformColor, currentTime, duration, hoveredTime, isHovering]);

  // Start animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      // Set canvas size directly without DPI scaling for simpler coordinate math
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onVisibilityChange?.(newVisibility);
  }, [isVisible, onVisibilityChange]);

  // Handle click for seeking
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !duration) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickRatio = x / rect.width;
      const seekTime = clickRatio * duration;

      onSeek(Math.max(0, Math.min(duration, seekTime)));
    },
    [duration, onSeek]
  );

  // Handle mouse move for hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !duration) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const time = ratio * duration;

      setHoveredTime(Math.max(0, Math.min(duration, time)));
    },
    [duration]
  );

  if (!isVisible && compact) {
    return (
      <button
        onClick={toggleVisibility}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Eye className="w-4 h-4" />
        Show Waveform
      </button>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden bg-[#1a1a2e] ${className}`}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-medium text-white/60 flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isPlaying ? waveformColor.primary : "#444" }}
          />
          {isPlaying ? "Live Audio" : "Paused"}
        </span>
        
        <div className="flex items-center gap-1">
          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                title="Change color"
              >
                <Palette className="w-3.5 h-3.5 text-white/50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="grid grid-cols-4 gap-1.5">
                {WAVEFORM_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setWaveformColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      waveformColor.name === color.name ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{ background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})` }}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Visibility Toggle */}
          <button
            onClick={toggleVisibility}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title={isVisible ? "Hide waveform" : "Show waveform"}
          >
            {isVisible ? (
              <EyeOff className="w-3.5 h-3.5 text-white/50" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-white/50" />
            )}
          </button>
        </div>
      </div>

      {isVisible && (
        <div 
          ref={containerRef}
          className="relative"
          style={{ height: compact ? "70px" : "90px" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              setHoveredTime(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
