/**
 * Waveform Viewer Component
 * Audio waveform visualization with interactive seeking
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, ZoomIn, ZoomOut } from "lucide-react";

interface WaveformViewerProps {
  audioData?: Float32Array;
  waveformImageUrl?: string;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  peaks?: number[];
  sceneChanges?: { timestamp: number; confidence: number }[];
  className?: string;
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
}: WaveformViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

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
      ctx.fillStyle = "#3b82f6";
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

    // Draw waveform bars
    const barWidth = Math.max(1, width / visibleData.length);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#3b82f6");
    gradient.addColorStop(0.5, "#60a5fa");
    gradient.addColorStop(1, "#3b82f6");

    ctx.fillStyle = gradient;

    for (let i = 0; i < visibleData.length; i++) {
      const value = Math.abs(visibleData[i]);
      const barHeight = Math.max(2, value * (height - 20));
      const x = i * barWidth;
      const y = midY - barHeight / 2;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    drawOverlays(ctx, width, height);
  }, [audioData, waveformImageUrl, peaks, duration, zoom, offset]);

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
            Audio Waveform
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {zoom.toFixed(1)}x
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleZoomIn}
              disabled={zoom >= 10}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Waveform Canvas */}
        <div ref={containerRef} className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={80}
            className="w-full h-20 rounded cursor-pointer"
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
        {zoom > 1 && (
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
        {sceneChanges.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-red-500/70 rounded-sm" />
            <span className="text-muted-foreground">
              Scene Changes ({sceneChanges.length})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WaveformViewer;
