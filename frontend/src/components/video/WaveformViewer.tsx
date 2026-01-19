/**
 * Waveform Viewer Component
 * Audio waveform visualization with interactive seeking
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, ZoomIn, ZoomOut, Eye, EyeOff, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Predefined waveform color themes
const WAVEFORM_COLORS = [
  { name: "Blue", primary: "#3b82f6", secondary: "#60a5fa" },
  { name: "Purple", primary: "#8b5cf6", secondary: "#a78bfa" },
  { name: "Green", primary: "#22c55e", secondary: "#4ade80" },
  { name: "Orange", primary: "#f97316", secondary: "#fb923c" },
  { name: "Pink", primary: "#ec4899", secondary: "#f472b6" },
  { name: "Cyan", primary: "#06b6d4", secondary: "#22d3ee" },
  { name: "Red", primary: "#ef4444", secondary: "#f87171" },
  { name: "Yellow", primary: "#eab308", secondary: "#facc15" },
];

interface WaveformViewerProps {
  audioData?: Float32Array;
  waveformImageUrl?: string;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  peaks?: number[];
  sceneChanges?: { timestamp: number; confidence: number }[];
  className?: string;
  compact?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  initialColor?: { primary: string; secondary: string };
}

export function WaveformViewer({
  audioData,
  waveformImageUrl,
  duration,
  currentTime,
  onSeek,
  peaks,
  sceneChanges = [],
  className = "",
  compact = false,
  onVisibilityChange,
  initialColor = WAVEFORM_COLORS[0],
}: WaveformViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [waveformColor, setWaveformColor] = useState(initialColor);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onVisibilityChange?.(newVisibility);
  }, [isVisible, onVisibilityChange]);

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // If waveform image provided, use it
    if (waveformImageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawOverlays(ctx, width, height);
      };
      img.src = waveformImageUrl;
      return;
    }

    // Draw waveform from audio data or peaks
    const data = peaks || (audioData ? Array.from(audioData) : null);
    if (!data || data.length === 0) {
      // Draw placeholder
      ctx.fillStyle = waveformColor.primary;
      ctx.fillRect(0, midY - 2, width, 4);
      return;
    }

    // Calculate visible range based on zoom
    const visibleDuration = duration / zoom;
    const startTime = offset;
    const endTime = Math.min(startTime + visibleDuration, duration);
    
    const startIndex = Math.floor((startTime / duration) * data.length);
    const endIndex = Math.ceil((endTime / duration) * data.length);
    const visibleData = data.slice(startIndex, endIndex);

    // Draw waveform bars with selected color
    const barWidth = Math.max(1, width / visibleData.length);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, waveformColor.primary);
    gradient.addColorStop(0.5, waveformColor.secondary);
    gradient.addColorStop(1, waveformColor.primary);

    ctx.fillStyle = gradient;

    for (let i = 0; i < visibleData.length; i++) {
      const value = Math.abs(visibleData[i]);
      const barHeight = Math.max(2, value * (height - 20));
      const x = i * barWidth;
      const y = midY - barHeight / 2;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    drawOverlays(ctx, width, height);
  }, [audioData, waveformImageUrl, peaks, duration, zoom, offset, waveformColor]);

  // Draw overlays (playhead, scene markers, etc.)
  const drawOverlays = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const visibleDuration = duration / zoom;
      const startTime = offset;

      // Draw scene change markers
      ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
      sceneChanges.forEach((scene) => {
        if (scene.timestamp >= startTime && scene.timestamp <= startTime + visibleDuration) {
          const x = ((scene.timestamp - startTime) / visibleDuration) * width;
          ctx.fillRect(x - 1, 0, 2, height);
        }
      });

      // Draw playhead
      if (currentTime >= startTime && currentTime <= startTime + visibleDuration) {
        const playheadX = ((currentTime - startTime) / visibleDuration) * width;
        
        // Playhead line
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();

        // Playhead handle
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(playheadX, 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw hover indicator
      if (hoveredTime !== null && hoveredTime >= startTime && hoveredTime <= startTime + visibleDuration) {
        const hoverX = ((hoveredTime - startTime) / visibleDuration) * width;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hoverX, 0);
        ctx.lineTo(hoverX, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [currentTime, sceneChanges, duration, zoom, offset, hoveredTime]
  );

  // Handle canvas click for seeking
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickRatio = x / rect.width;

      const visibleDuration = duration / zoom;
      const clickTime = offset + clickRatio * visibleDuration;

      onSeek(Math.max(0, Math.min(duration, clickTime)));
    },
    [duration, zoom, offset, onSeek]
  );

  // Handle mouse move for hover time
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;

      const visibleDuration = duration / zoom;
      const time = offset + ratio * visibleDuration;

      setHoveredTime(Math.max(0, Math.min(duration, time)));

      if (isDragging) {
        onSeek(time);
      }
    },
    [duration, zoom, offset, isDragging, onSeek]
  );

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 1));
  };

  // Keep playhead visible when playing
  useEffect(() => {
    const visibleDuration = duration / zoom;
    const viewEnd = offset + visibleDuration;

    if (currentTime < offset || currentTime > viewEnd) {
      setOffset(Math.max(0, currentTime - visibleDuration / 2));
    }
  }, [currentTime, duration, zoom, offset]);

  // Redraw on changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform, currentTime, hoveredTime]);

  // Format time
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            {!compact && "Audio Waveform"}
          </span>
          <div className="flex items-center gap-1">
            {/* Color picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Change color"
                >
                  <Palette className="w-3 h-3" style={{ color: waveformColor.primary }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="grid grid-cols-4 gap-1">
                  {WAVEFORM_COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        waveformColor.primary === color.primary
                          ? "border-white scale-110"
                          : "border-transparent hover:border-white/50"
                      }`}
                      style={{ backgroundColor: color.primary }}
                      onClick={() => setWaveformColor(color)}
                      title={color.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Visibility toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleVisibility}
              title={isVisible ? "Hide waveform" : "Show waveform"}
            >
              {isVisible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </Button>
            
            {isVisible && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                {!compact && (
                  <span className="text-xs text-muted-foreground w-10 text-center">
                    {zoom.toFixed(1)}x
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomIn}
                  disabled={zoom >= 10}
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="space-y-2">
          {/* Waveform Canvas */}
          <div ref={containerRef} className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={compact ? 50 : 80}
              className={`w-full ${compact ? "h-12" : "h-20"} rounded cursor-pointer`}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => {
                setHoveredTime(null);
                setIsDragging(false);
              }}
            />
            
            {/* Time labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(offset)}</span>
              <span>
                {hoveredTime !== null ? formatTime(hoveredTime) : formatTime(currentTime)}
              </span>
              <span>{formatTime(Math.min(offset + duration / zoom, duration))}</span>
            </div>
          </div>

          {/* Zoom slider for detailed control */}
          {zoom > 1 && !compact && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">View Position</p>
              <Slider
                value={[offset]}
                min={0}
                max={Math.max(0, duration - duration / zoom)}
                step={0.1}
                onValueChange={([value]) => setOffset(value)}
                className="w-full"
              />
            </div>
          )}

          {/* Scene change markers legend */}
          {sceneChanges.length > 0 && !compact && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 bg-red-500/70 rounded-sm" />
              <span className="text-muted-foreground">
                Scene Changes ({sceneChanges.length})
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default WaveformViewer;
