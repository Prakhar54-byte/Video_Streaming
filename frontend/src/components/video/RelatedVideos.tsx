"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatViewCount, formatTimeAgo, toBackendAssetUrl } from "@/lib/utils";
import {
  Play,
  Clock,
  Eye,
  CheckCircle2,
  ListVideo,
  MoreVertical,
  ListPlus,
  EyeOff,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQueueStore } from "@/store/queueStore";
import { useWatchLaterStore } from "@/store/watchLaterStore";
import { useHiddenVideosStore } from "@/store/hiddenVideosStore";
import { useAuthStore } from "@/store/authStore";
import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";
import { toast } from "sonner";

interface Video {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number;
  views: number;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
}

interface RelatedVideosProps {
  videos: Video[];
  loading?: boolean;
  currentVideoId?: string;
  subscribedChannels?: Set<string>;
  className?: string;
}

export function RelatedVideos({
  videos,
  loading = false,
  currentVideoId,
  subscribedChannels = new Set(),
  className,
}: RelatedVideosProps) {
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <ListVideo className="w-5 h-5" />
          <h2 className="font-semibold">Related Videos</h2>
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-40 aspect-video bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <ListVideo className="w-5 h-5" />
          <h2 className="font-semibold">Related Videos</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <ListVideo className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No related videos found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <ListVideo className="w-5 h-5" />
        <h2 className="font-semibold">Related Videos</h2>
        <Badge variant="secondary" className="ml-auto">
          {videos.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {videos
          .filter((video) => !useHiddenVideosStore.getState().isHidden(video._id))
          .map((video) => (
          <RelatedVideoCard
            key={video._id}
            video={video}
            isSubscribed={subscribedChannels.has(video.owner._id)}
            isCurrentVideo={video._id === currentVideoId}
          />
        ))}
      </div>
    </div>
  );
}

interface RelatedVideoCardProps {
  video: Video;
  isSubscribed?: boolean;
  isCurrentVideo?: boolean;
}

function RelatedVideoCard({
  video,
  isSubscribed = false,
  isCurrentVideo = false,
}: RelatedVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const { addToQueue } = useQueueStore();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLaterStore();
  const { hideVideo } = useHiddenVideosStore();
  const { isAuthenticated } = useAuthStore();
  const inWatchLater = isInWatchLater(video._id);

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Login required");
    addToQueue(video._id);
    toast.success("Added to queue");
  };

  const handleWatchLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Login required");
    if (inWatchLater) {
      removeFromWatchLater(video._id);
      toast.success("Removed from Watch Later");
    } else {
      addToWatchLater(video._id);
      toast.success("Added to Watch Later");
    }
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Login required");
    setShowPlaylistModal(true);
  };

  const handleHideVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hideVideo(video._id);
    toast.success("Video hidden");
  };

  return (
    <>
    <AddToPlaylistModal
      videoId={video._id}
      isOpen={showPlaylistModal}
      onClose={() => setShowPlaylistModal(false)}
    />
    <div className="relative group">
    <Link
      href={`/video/${video._id}`}
      className={cn(
        "flex gap-3 rounded-lg p-2 -mx-2 transition-colors",
        isCurrentVideo
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
        {video.thumbnail ? (
          <Image
            src={toBackendAssetUrl(video.thumbnail)}
            alt={video.title}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              isHovered && "scale-105"
            )}
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Play className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
          {Math.floor(video.duration / 60)}:
          {String(Math.floor(video.duration % 60)).padStart(2, "0")}
        </div>

        {/* Play overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-black fill-current ml-0.5" />
          </div>
        </div>

        {/* Now playing indicator */}
        {isCurrentVideo && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
              Now Playing
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3
          className={cn(
            "font-medium text-sm leading-snug line-clamp-2 transition-colors",
            isHovered && "text-primary"
          )}
        >
          {video.title}
        </h3>

        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <span className="truncate">{video.owner.fullName}</span>
          {isSubscribed && (
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>{formatViewCount(video.views)}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(video.createdAt)}</span>
        </div>
      </div>
    </Link>

    {/* 3-dot menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-2 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleWatchLater}>
          {inWatchLater ? <BookmarkCheck className="mr-2 h-4 w-4 text-primary" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
          {inWatchLater ? "Remove from Watch Later" : "Watch Later"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToQueue}>
          <ListPlus className="mr-2 h-4 w-4" /> Add to queue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToPlaylist}>
          <ListVideo className="mr-2 h-4 w-4" /> Save to playlist
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleHideVideo}>
          <EyeOff className="mr-2 h-4 w-4" /> Hide video
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
    </>
  );
}

export default RelatedVideos;
