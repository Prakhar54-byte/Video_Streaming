"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Upload,
  Video,
  Image as ImageIcon,
  FileVideo,
  CheckCircle2,
  X,
  CloudUpload,
} from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept: string;
  type: "video" | "image";
  disabled?: boolean;
  maxSize?: number; // in bytes
  className?: string;
  preview?: string;
  fileName?: string;
  onClear?: () => void;
}

export function DropZone({
  onFileSelect,
  accept,
  type,
  disabled = false,
  maxSize = 10 * 1024 * 1024 * 1024, // 10GB default
  className,
  preview,
  fileName,
  onClear,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const acceptTypes = accept.split(",").map((t) => t.trim());
      const isValidType = acceptTypes.some((acceptType) => {
        if (acceptType.endsWith("/*")) {
          const category = acceptType.split("/")[0];
          return file.type.startsWith(category + "/");
        }
        return file.type === acceptType;
      });

      if (!isValidType) {
        return `Invalid file type. Please select a ${type} file.`;
      }

      // Check file size
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${formatFileSize(maxSize)}.`;
      }

      return null;
    },
    [accept, maxSize, type]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];
      const error = validateFile(file);

      if (error) {
        setDragError(error);
        return;
      }

      setDragError(null);
      onFileSelect(file);
    },
    [disabled, validateFile, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const error = validateFile(file);

      if (error) {
        setDragError(error);
        return;
      }

      setDragError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const Icon = type === "video" ? Video : ImageIcon;
  const maxSizeLabel = formatFileSize(maxSize);

  // If we have a preview, show the preview state
  if (preview) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden", className)}>
        {type === "video" ? (
          <video
            src={preview}
            controls
            className="w-full rounded-xl max-h-[400px] bg-black"
          />
        ) : (
          <div className="relative aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        )}

        {/* File info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {fileName}
              </span>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "w-full flex flex-col items-center justify-center",
          "min-h-[200px] p-8 rounded-xl",
          "border-2 border-dashed transition-all duration-300",
          "bg-muted/30 hover:bg-muted/50",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : dragError
            ? "border-destructive bg-destructive/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "pointer-events-none"
        )}
      >
        {/* Animated upload icon */}
        <div
          className={cn(
            "mb-4 p-4 rounded-full transition-all duration-300",
            isDragging
              ? "bg-primary/20 scale-110"
              : "bg-muted group-hover:bg-primary/10"
          )}
        >
          {isDragging ? (
            <CloudUpload className="w-10 h-10 text-primary animate-bounce" />
          ) : (
            <Icon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>

        {/* Text content */}
        <div className="text-center space-y-2">
          {isDragging ? (
            <p className="text-lg font-semibold text-primary">
              Drop your {type} here
            </p>
          ) : (
            <>
              <p className="text-lg font-semibold">
                <span className="text-primary">Click to upload</span> or drag and
                drop
              </p>
              <p className="text-sm text-muted-foreground">
                {type === "video"
                  ? "MP4, WebM, or OGG"
                  : "PNG, JPG, or WebP"}{" "}
                (MAX. {maxSizeLabel})
              </p>
            </>
          )}

          {/* Error message */}
          {dragError && (
            <p className="text-sm text-destructive font-medium mt-2">
              {dragError}
            </p>
          )}
        </div>

        {/* Decorative elements */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300",
            isDragging ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
        </div>
      </button>
    </div>
  );
}

export default DropZone;
