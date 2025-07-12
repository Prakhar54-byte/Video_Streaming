"use client";

import * as React from "react";
import { Slider } from "./Slider";
import { cn } from "@/lib/utils";

interface ProgressSliderProps {
  value: number;
  max: number;
  onValueChange?: (value: number) => void;
  className?: string;
  showTime?: boolean;
  formatTime?: (seconds: number) => string;
}

export function ProgressSlider({
  value,
  max,
  onValueChange,
  className,
  showTime = false,
  formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  },
}: ProgressSliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(value);

  const handleValueChange = (newValue: number[]) => {
    const newVal = newValue[0];
    setTempValue(newVal);
    if (!isDragging) {
      onValueChange?.(newVal);
    }
  };

  const handleValueCommit = (newValue: number[]) => {
    const newVal = newValue[0];
    setIsDragging(false);
    onValueChange?.(newVal);
  };

  const displayValue = isDragging ? tempValue : value;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showTime && (
        <span className="text-xs text-muted-foreground min-w-[40px]">
          {formatTime(Math.floor(displayValue))}
        </span>
      )}
      <Slider
        value={[displayValue]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        onPointerDown={() => setIsDragging(true)}
        max={max}
        step={1}
        className="flex-1"
      />
      {showTime && (
        <span className="text-xs text-muted-foreground min-w-[40px]">
          {formatTime(Math.floor(max))}
        </span>
      )}
    </div>
  );
}
