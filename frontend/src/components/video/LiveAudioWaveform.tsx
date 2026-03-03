/**
 * Live Audio Waveform Component
 * Real-time audio visualization using Web Audio API
 * Shows live audio amplitude that responds to playback state and volume
 * Smooth, dynamic animations for idle breathing, hover effects, and transitions
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

// Easing helpers
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
  initialColor?: { name?: string; primary: string; secondary: string };
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
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const connectedVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Smooth bar heights — interpolated each frame for fluid motion
  const smoothBarsRef = useRef<number[]>(new Array(64).fill(0));
  // Track which bar the mouse is hovering over
  const hoveredBarRef = useRef<number>(-1);
  // Timestamp reference for idle breathing animation
  const startTimeRef = useRef<number>(performance.now());
  // Smooth playhead position for animated seeking
  const smoothProgressRef = useRef<number>(0);

  const [isVisible, setIsVisible] = useState(true);
  const [waveformColor, setWaveformColor] = useState<{ name?: string; primary: string; secondary: string }>(initialColor);
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
      const dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;

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

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }
    const midY = height / 2;
    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000; // seconds

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw dynamic gradient background that subtly shifts with playback
    const bgHue = isPlaying ? Math.sin(elapsed * 0.3) * 5 : 0;
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, `hsl(${240 + bgHue}, 30%, 9%)`);
    bgGradient.addColorStop(0.5, `hsl(${240 + bgHue}, 30%, 8%)`);
    bgGradient.addColorStop(1, `hsl(${240 + bgHue}, 30%, 9%)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Compute target amplitude per bar
    const barCount = 64;
    const targetAmplitudes: number[] = new Array(barCount).fill(0);

    if (analyser && dataArray && isPlaying) {
      analyser.getByteFrequencyData(dataArray);
      for (let i = 0; i < barCount; i++) {
        const srcIdx = Math.floor((i / barCount) * dataArray.length);
        const value = dataArray[srcIdx] / 255;
        targetAmplitudes[i] = value * Math.max(0.3, volume);
      }
    } else {
      // Animated breathing idle — each bar has its own phase for a wave effect
      for (let i = 0; i < barCount; i++) {
        const phase = (i / barCount) * Math.PI * 2;
        const breathe = Math.sin(elapsed * 1.5 + phase) * 0.5 + 0.5; // 0..1
        const wave2 = Math.sin(elapsed * 0.7 + phase * 0.5) * 0.5 + 0.5;
        targetAmplitudes[i] = 0.03 + breathe * 0.06 + wave2 * 0.03;
      }
    }

    // Smoothly interpolate bars toward target (lerp each frame)
    const smoothing = isPlaying ? 0.18 : 0.08;
    const smoothBars = smoothBarsRef.current;
    for (let i = 0; i < barCount; i++) {
      smoothBars[i] = lerp(smoothBars[i], targetAmplitudes[i], smoothing);
    }

    // Bar geometry
    const gap = 2;
    const barWidth = (width - gap * barCount) / barCount;
    const maxBarHeight = (height - 28) / 2;

    // Create bar gradient
    const barGradient = ctx.createLinearGradient(0, midY - maxBarHeight, 0, midY + maxBarHeight);
    barGradient.addColorStop(0, waveformColor.primary);
    barGradient.addColorStop(0.5, waveformColor.secondary);
    barGradient.addColorStop(1, waveformColor.primary);

    // Subtle center line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Draw bars with hover highlight
    const hovBar = hoveredBarRef.current;
    for (let i = 0; i < barCount; i++) {
      const amplitude = smoothBars[i];
      const barHeight = Math.max(2, amplitude * maxBarHeight);
      const x = i * (barWidth + gap);

      // Hover proximity glow: bars near hovered bar glow brighter
      let hoverBoost = 0;
      if (hovBar >= 0 && isHovering) {
        const dist = Math.abs(i - hovBar);
        if (dist <= 3) {
          hoverBoost = (1 - dist / 4) * 0.4;
        }
      }

      // Glow when playing or hovered
      if ((isPlaying && amplitude > 0.08) || hoverBoost > 0) {
        ctx.shadowColor = waveformColor.primary;
        ctx.shadowBlur = 6 + hoverBoost * 12;
      } else {
        ctx.shadowBlur = 0;
      }

      // Bars near hover get slightly wider & extra alpha
      const extraWidth = hoverBoost * 2;
      const drawX = x - extraWidth / 2;
      const drawW = barWidth + extraWidth;
      const extraH = hoverBoost * maxBarHeight * 0.15;

      ctx.globalAlpha = 0.85 + hoverBoost * 0.15;
      ctx.fillStyle = barGradient;

      // Top half
      ctx.beginPath();
      ctx.roundRect(drawX, midY - barHeight - extraH, drawW, barHeight + extraH, 2);
      ctx.fill();

      // Bottom half (mirror)
      ctx.beginPath();
      ctx.roundRect(drawX, midY, drawW, barHeight + extraH, 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Animated progress track
    const progressY = height - 12;
    const progressHeight = 4;
    const progressRadius = 2;

    // Background track with subtle shimmer
    const shimmer = Math.sin(elapsed * 2) * 0.03 + 0.15;
    ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
    ctx.beginPath();
    ctx.roundRect(0, progressY, width, progressHeight, progressRadius);
    ctx.fill();

    // Smoothly animate progress position
    const targetProgress = duration > 0 ? currentTime / duration : 0;
    smoothProgressRef.current = lerp(smoothProgressRef.current, targetProgress, 0.15);
    const progressWidth = width * smoothProgressRef.current;

    if (progressWidth > 1) {
      const progressGradient = ctx.createLinearGradient(0, 0, progressWidth, 0);
      progressGradient.addColorStop(0, waveformColor.secondary);
      progressGradient.addColorStop(1, waveformColor.primary);
      ctx.fillStyle = progressGradient;
      ctx.beginPath();
      ctx.roundRect(0, progressY, progressWidth, progressHeight, progressRadius);
      ctx.fill();
    }

    // Animated playhead with pulsing ring
    const playheadX = Math.max(7, Math.min(width - 7, progressWidth));
    const playheadY = progressY + progressHeight / 2;

    // Pulsing ring (only when playing)
    if (isPlaying) {
      const pulseScale = Math.sin(elapsed * 3) * 0.3 + 1;
      const pulseAlpha = 0.25 - Math.sin(elapsed * 3) * 0.15;
      ctx.strokeStyle = waveformColor.primary;
      ctx.globalAlpha = Math.max(0, pulseAlpha);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(playheadX, playheadY, 7 * pulseScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Playhead dot — slightly bigger on hover
    const headRadius = isHovering ? 6 : 5;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = waveformColor.primary;
    ctx.shadowBlur = isHovering ? 10 : 5;
    ctx.beginPath();
    ctx.arc(playheadX, playheadY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hover scrub indicator
    if (hoveredTime !== null && isHovering) {
      const hoverProgress = duration > 0 ? hoveredTime / duration : 0;
      const hoverX = width * hoverProgress;

      // Vertical scan line with gradient fade at top/bottom
      const lineGrad = ctx.createLinearGradient(0, 0, 0, height - 16);
      lineGrad.addColorStop(0, "rgba(255,255,255,0)");
      lineGrad.addColorStop(0.15, `${waveformColor.primary}88`);
      lineGrad.addColorStop(0.85, `${waveformColor.primary}88`);
      lineGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height - 16);
      ctx.stroke();

      // Time tooltip bubble with rounded shadow
      const timeText = formatTime(hoveredTime);
      ctx.font = "bold 11px system-ui, sans-serif";
      const textW = ctx.measureText(timeText).width + 12;
      const tooltipX = Math.min(Math.max(hoverX - textW / 2, 4), width - textW - 4);

      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.beginPath();
      ctx.roundRect(tooltipX, 4, textW, 20, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffffff";
      ctx.fillText(timeText, tooltipX + 6, 18);
    }

    // Time labels
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.fillText(formatTime(currentTime), 6, height - 20);

    const durationText = formatTime(duration);
    const durationTextWidth = ctx.measureText(durationText).width;
    ctx.fillText(durationText, width - durationTextWidth - 6, height - 20);

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
    if (!isVisible) return;

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

    // Use requestAnimationFrame to ensure the container is laid out before measuring
    const rafId = requestAnimationFrame(resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isVisible]);

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

  // Handle mouse move for hover — also track hovered bar index
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !duration) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const time = ratio * duration;

      // Figure out which bar the cursor is over
      const barCount = 64;
      const gap = 2;
      const barWidth = (rect.width - gap * barCount) / barCount;
      const barIdx = Math.floor(x / (barWidth + gap));
      hoveredBarRef.current = Math.max(0, Math.min(barCount - 1, barIdx));

      setHoveredTime(Math.max(0, Math.min(duration, time)));
    },
    [duration]
  );

  // Reset hovered bar when mouse leaves
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setHoveredTime(null);
    hoveredBarRef.current = -1;
  }, []);

  if (!isVisible && compact) {
    return (
      <button
        onClick={toggleVisibility}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-all duration-300 hover:scale-[1.02]"
      >
        <Eye className="w-4 h-4" />
        Show Waveform
      </button>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden bg-[#1a1a2e] transition-all duration-300 ${className}`}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-medium text-white/60 flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-500 ${isPlaying ? 'scale-100' : 'scale-75'}`}
            style={{ 
              backgroundColor: isPlaying ? waveformColor.primary : "#444",
              boxShadow: isPlaying ? `0 0 6px ${waveformColor.primary}` : 'none',
            }}
          />
          <span className="transition-opacity duration-300">
            {isPlaying ? "Live Audio" : "Paused"}
          </span>
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
                      waveformColor?.name === color.name ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
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
          className="relative animate-in fade-in slide-in-from-top-1 duration-300"
          style={{ height: compact ? "70px" : "90px" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      )}
    </div>
  );
}
