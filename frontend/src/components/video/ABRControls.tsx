/**
 * ABR Controls Component
 * Quality selector and adaptive bitrate controls for video player
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Wifi, Check, Zap } from "lucide-react";

interface QualityLevel {
  level: number;
  name: string;
  bitrate: number;
  height: number;
}

interface ABRControlsProps {
  currentQuality: number;
  recommendedQuality: number;
  isAutoMode: boolean;
  bandwidth: number;
  rebufferRisk: number;
  estimatedQoE: number;
  qualityLevels: QualityLevel[];
  maxQuality?: number;
  onQualityChange: (level: number) => void;
  onAutoModeToggle: () => void;
  compact?: boolean;
  className?: string;
}

export function ABRControls({
  currentQuality,
  recommendedQuality,
  isAutoMode,
  bandwidth,
  rebufferRisk,
  estimatedQoE,
  qualityLevels,
  maxQuality = 4,
  onQualityChange,
  onAutoModeToggle,
  compact = false,
  className = "",
}: ABRControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLevel = qualityLevels[currentQuality] || qualityLevels[2];
  const recommendedLevel = qualityLevels[recommendedQuality] || qualityLevels[2];

  const formatBitrate = (bitrate: number) => {
    if (bitrate >= 1000) {
      return `${(bitrate / 1000).toFixed(1)} Mbps`;
    }
    return `${bitrate} Kbps`;
  };

  const getQualityBadgeColor = (level: number) => {
    if (level >= 4) return "bg-purple-500";
    if (level >= 3) return "bg-blue-500";
    if (level >= 2) return "bg-green-500";
    if (level >= 1) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return "text-red-500";
    if (risk > 0.4) return "text-yellow-500";
    return "text-green-500";
  };

  if (compact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1 ${className}`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs">{currentLevel.name}</span>
            {isAutoMode && <Zap className="w-3 h-3 text-yellow-400" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="flex items-center justify-between">
            Quality
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto</span>
              <Switch
                checked={isAutoMode}
                onCheckedChange={onAutoModeToggle}
                className="scale-75"
              />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {qualityLevels
            .slice(0, maxQuality + 1)
            .reverse()
            .map((level) => (
              <DropdownMenuItem
                key={level.level}
                onClick={() => onQualityChange(level.level)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {currentQuality === level.level && (
                    <Check className="w-3 h-3" />
                  )}
                  {level.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBitrate(level.bitrate)}
                </span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Auto Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isAutoMode ? "text-yellow-400" : "text-gray-400"}`} />
          <span className="text-sm font-medium">Auto Quality</span>
        </div>
        <Switch checked={isAutoMode} onCheckedChange={onAutoModeToggle} />
      </div>

      {/* Current Quality Display */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Current Quality</p>
          <p className="text-lg font-bold">{currentLevel.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBitrate(currentLevel.bitrate)}
          </p>
        </div>
        <Badge className={`${getQualityBadgeColor(currentQuality)} text-white`}>
          {currentLevel.height}p
        </Badge>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted rounded-md">
          <Wifi className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <p className="text-xs text-muted-foreground">Bandwidth</p>
          <p className="text-sm font-medium">{formatBitrate(bandwidth)}</p>
        </div>
        <div className="p-2 bg-muted rounded-md">
          <p className="text-lg mb-1">⚠️</p>
          <p className="text-xs text-muted-foreground">Buffer Risk</p>
          <p className={`text-sm font-medium ${getRiskColor(rebufferRisk)}`}>
            {Math.round(rebufferRisk * 100)}%
          </p>
        </div>
        <div className="p-2 bg-muted rounded-md">
          <p className="text-lg mb-1">✨</p>
          <p className="text-xs text-muted-foreground">QoE Score</p>
          <p className="text-sm font-medium">{Math.round(estimatedQoE * 100)}%</p>
        </div>
      </div>

      {/* Recommended Quality */}
      {isAutoMode && recommendedQuality !== currentQuality && (
        <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-md">
          <p className="text-xs text-blue-400">
            Switching to {recommendedLevel.name} based on network conditions
          </p>
        </div>
      )}

      {/* Quality Selector */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Manual Quality Selection</p>
        <div className="grid grid-cols-3 gap-2">
          {qualityLevels.slice(0, maxQuality + 1).map((level) => (
            <Button
              key={level.level}
              variant={currentQuality === level.level ? "default" : "outline"}
              size="sm"
              onClick={() => onQualityChange(level.level)}
              disabled={isAutoMode}
              className="text-xs"
            >
              {level.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ABRControls;
