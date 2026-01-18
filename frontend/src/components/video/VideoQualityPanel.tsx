/**
 * Video Quality Panel Component
 * Displays real-time video quality metrics from WASM analysis
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Volume2,
  Eye,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface QualityMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  colorfulness: number;
  overall: number;
}

interface MotionData {
  intensity: number;
  isStaticScene: boolean;
}

interface VideoQualityPanelProps {
  quality: QualityMetrics | null;
  motion: MotionData | null;
  bandwidth?: number;
  bufferHealth?: number;
  trend?: "increasing" | "stable" | "decreasing";
  className?: string;
}

export function VideoQualityPanel({
  quality,
  motion,
  bandwidth,
  bufferHealth,
  trend = "stable",
  className = "",
}: VideoQualityPanelProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getQualityColor = (value: number) => {
    if (value >= 0.8) return "bg-green-500";
    if (value >= 0.6) return "bg-yellow-500";
    if (value >= 0.4) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatBandwidth = (bw: number) => {
    if (bw >= 1000) {
      return `${(bw / 1000).toFixed(1)} Mbps`;
    }
    return `${bw.toFixed(0)} Kbps`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Video Quality Metrics
          <span className="ml-auto">{getTrendIcon()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Quality Score */}
        {quality && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                Overall Quality
              </span>
              <span className="font-medium">
                {Math.round(quality.overall * 100)}%
              </span>
            </div>
            <Progress
              value={quality.overall * 100}
              className="h-2"
            />
          </div>
        )}

        {/* Individual Metrics */}
        {quality && (
          <div className="grid grid-cols-2 gap-3">
            <MetricBar
              label="Sharpness"
              value={quality.sharpness}
              icon={<Eye className="w-3 h-3" />}
            />
            <MetricBar
              label="Brightness"
              value={quality.brightness}
              icon={<span className="text-yellow-500">☀</span>}
            />
            <MetricBar
              label="Contrast"
              value={quality.contrast}
              icon={<span>◐</span>}
            />
            <MetricBar
              label="Colorfulness"
              value={quality.colorfulness}
              icon={<span className="text-pink-500">🎨</span>}
            />
          </div>
        )}

        {/* Motion Detection */}
        {motion && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Motion</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  motion.isStaticScene ? "bg-green-500" : "bg-orange-500"
                }`}
              />
              <span className="text-sm">
                {motion.isStaticScene
                  ? "Static"
                  : `Active (${Math.round(motion.intensity * 100)}%)`}
              </span>
            </div>
          </div>
        )}

        {/* Network Stats */}
        {(bandwidth !== undefined || bufferHealth !== undefined) && (
          <div className="border-t pt-3 space-y-2">
            {bandwidth !== undefined && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bandwidth</span>
                <span className="font-mono">{formatBandwidth(bandwidth)}</span>
              </div>
            )}
            {bufferHealth !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Buffer Health</span>
                  <span>{Math.round(bufferHealth * 100)}%</span>
                </div>
                <Progress
                  value={bufferHealth * 100}
                  className="h-1"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for individual metric bars
function MetricBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            value >= 0.7
              ? "bg-green-500"
              : value >= 0.5
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default VideoQualityPanel;
