"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "./Slider";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function VolumeSlider({
  volume,
  onVolumeChange,
  className,
}: VolumeSliderProps) {
  const [isMuted, setIsMuted] = React.useState(false);
  const [previousVolume, setPreviousVolume] = React.useState(volume);

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    onVolumeChange(volumeValue);
    setIsMuted(volumeValue === 0);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMuteToggle}
        className="h-8 w-8 p-0"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <Slider
        value={[isMuted ? 0 : volume]}
        onValueChange={handleVolumeChange}
        max={100}
        step={1}
        className="w-20"
      />
    </div>
  );
}
