"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Film,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

interface VideoProcessingBadgeProps {
  status: ProcessingStatus;
  className?: string;
  showLabel?: boolean;
}

export function VideoProcessingBadge({
  status,
  className,
  showLabel = true,
}: VideoProcessingBadgeProps) {
  const config = {
    pending: {
      icon: Clock,
      label: "Pending",
      variant: "secondary" as const,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      animate: false,
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      variant: "secondary" as const,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      animate: true,
    },
    completed: {
      icon: CheckCircle2,
      label: "Ready",
      variant: "secondary" as const,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      animate: false,
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      variant: "destructive" as const,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      animate: false,
    },
  };

  const currentConfig = config[status];
  const Icon = currentConfig.icon;

  return (
    <Badge
      variant={currentConfig.variant}
      className={cn(currentConfig.className, className)}
    >
      <Icon
        className={cn(
          "w-3 h-3",
          showLabel && "mr-1",
          currentConfig.animate && "animate-spin"
        )}
      />
      {showLabel && currentConfig.label}
    </Badge>
  );
}

interface ProcessingOverlayProps {
  status: ProcessingStatus;
  className?: string;
}

export function ProcessingOverlay({ status, className }: ProcessingOverlayProps) {
  if (status === "completed") return null;

  const config = {
    pending: {
      icon: Clock,
      message: "Waiting in queue...",
      bgClass: "bg-black/60",
    },
    processing: {
      icon: Film,
      message: "Processing video...",
      bgClass: "bg-black/70",
    },
    failed: {
      icon: XCircle,
      message: "Processing failed",
      bgClass: "bg-black/80",
    },
    completed: {
      icon: Sparkles,
      message: "Ready to watch",
      bgClass: "bg-black/50",
    },
  };

  const currentConfig = config[status];
  const Icon = currentConfig.icon;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center",
        currentConfig.bgClass,
        "backdrop-blur-sm transition-all duration-300",
        className
      )}
    >
      <Icon
        className={cn(
          "w-10 h-10 mb-2",
          status === "processing" && "animate-pulse",
          status === "pending" && "text-yellow-400",
          status === "processing" && "text-blue-400",
          status === "failed" && "text-red-400"
        )}
      />
      <span className="text-white text-sm font-medium">{currentConfig.message}</span>
      {status === "processing" && (
        <div className="flex gap-1 mt-2">
          <div
            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      )}
    </div>
  );
}

export default VideoProcessingBadge;
