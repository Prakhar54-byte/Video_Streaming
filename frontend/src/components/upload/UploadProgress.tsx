"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  CloudUpload,
  Cog,
  Sparkles,
  Film,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  fileName?: string;
  errorMessage?: string;
  className?: string;
}

const stages = [
  { id: "upload", label: "Uploading", icon: CloudUpload, threshold: 0 },
  { id: "process", label: "Processing", icon: Cog, threshold: 100 },
  { id: "transcode", label: "Transcoding", icon: Film, threshold: 101 },
  { id: "complete", label: "Complete", icon: CheckCircle2, threshold: 102 },
];

export function UploadProgress({
  progress,
  status,
  fileName,
  errorMessage,
  className,
}: UploadProgressProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "uploading":
        return {
          icon: CloudUpload,
          color: "text-blue-500",
          bgColor: "bg-blue-500",
          message: `Uploading${fileName ? `: ${fileName}` : ""}...`,
          showProgress: true,
        };
      case "processing":
        return {
          icon: Cog,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500",
          message: "Processing video...",
          showProgress: false,
        };
      case "complete":
        return {
          icon: CheckCircle2,
          color: "text-green-500",
          bgColor: "bg-green-500",
          message: "Upload complete!",
          showProgress: false,
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-destructive",
          bgColor: "bg-destructive",
          message: errorMessage || "Upload failed",
          showProgress: false,
        };
      default:
        return {
          icon: Upload,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          message: "Ready to upload",
          showProgress: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "rounded-xl border p-6 space-y-4",
        status === "error"
          ? "bg-destructive/5 border-destructive/20"
          : status === "complete"
          ? "bg-green-500/5 border-green-500/20"
          : "bg-card border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-full",
            status === "uploading" ? "bg-blue-500/10" : "",
            status === "processing" ? "bg-yellow-500/10 animate-pulse" : "",
            status === "complete" ? "bg-green-500/10" : "",
            status === "error" ? "bg-destructive/10" : ""
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              config.color,
              status === "processing" && "animate-spin"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{config.message}</p>
          {status === "uploading" && (
            <p className="text-sm text-muted-foreground">
              {progress}% • Please don&apos;t close this page
            </p>
          )}
        </div>
        {status === "uploading" && (
          <span className="text-lg font-bold text-primary">{progress}%</span>
        )}
      </div>

      {/* Progress Bar */}
      {config.showProgress && (
        <div className="space-y-2">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out rounded-full",
                "bg-gradient-to-r from-blue-500 via-primary to-purple-500"
              )}
              style={{ width: `${progress}%` }}
            />
            {/* Animated shine effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: "shine 1.5s infinite",
                transform: `translateX(${progress - 100}%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {status === "processing" && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span>
            Optimizing your video for streaming. This may take a few minutes...
          </span>
        </div>
      )}

      {/* Success message */}
      {status === "complete" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Sparkles className="w-4 h-4" />
          <span>Your video is ready! Redirecting to your channel...</span>
        </div>
      )}

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default UploadProgress;
