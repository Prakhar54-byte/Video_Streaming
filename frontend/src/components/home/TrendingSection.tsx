"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatViewCount, formatTimeAgo, toBackendAssetUrl } from "@/lib/utils";
import {
  Play,
  Flame,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Eye,
  MoreVertical,
  ListPlus,
  ListVideo,
  EyeOff,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQueueStore } from "@/store/queueStore";
import { useWatchLaterStore } from "@/store/watchLaterStore";
import { useHiddenVideosStore } from "@/store/hiddenVideosStore";
import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";
import { toast } from "sonner";

interface Video {
  _id: string;
  title: string;
  description: string;
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
  previewAnimationUrl?: string;
}

interface TrendingSectionProps {
  className?: string;
}

export function TrendingSection({ className }: TrendingSectionProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const fetchTrendingVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/videos");
      let allVideos = response.data.data || response.data || [];
      allVideos = Array.isArray(allVideos) ? allVideos : [];

      // Sort by views to get "trending"
      const sorted = [...allVideos].sort(
        (a: Video, b: Video) => b.views - a.views
      );
      setVideos(sorted.slice(0, 8));
    } catch (error) {
      console.error("Error fetching trending videos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingVideos();
  }, [fetchTrendingVideos]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 320 + 16; // card width + gap
    const newIndex =
      direction === "left"
        ? Math.max(0, currentIndex - 1)
        : Math.min(videos.length - 1, currentIndex + 1);

    setCurrentIndex(newIndex);
    scrollRef.current.scrollTo({
      left: newIndex * cardWidth,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <div className="w-32 h-6 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-80 aspect-video bg-muted animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold">Trending Now</h2>
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
            <TrendingUp className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
            disabled={currentIndex >= videos.length - 3}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative -mx-4 px-4">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {videos
            .filter((video) => !useHiddenVideosStore.getState().isHidden(video._id))
            .map((video, index) => (
            <TrendingCard key={video._id} video={video} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TrendingCardProps {
  video: Video;
  rank: number;
}

function TrendingCard({ video, rank }: TrendingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const { addToQueue } = useQueueStore();
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLaterStore();
  const { hideVideo } = useHiddenVideosStore();
  const { user } = useAuthStore();
  const inWatchLater = isInWatchLater(video._id);

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Login required");
    addToQueue(video._id);
    toast.success("Added to queue");
  };

  const handleWatchLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Login required");
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
    if (!user) return toast.error("Login required");
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
    <div className="shrink-0 w-80 snap-start group relative">
    <Link
      href={`/video/${video._id}`}
      className="block"
    >
      <div
        className="relative aspect-video rounded-xl overflow-hidden bg-muted"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        {video.thumbnail ? (
          <Image
            src={toBackendAssetUrl(video.thumbnail)}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="320px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Play className="w-12 h-12 text-muted-foreground opacity-50" />
          </div>
        )}

        {/* Rank Badge */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm font-bold text-white flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-500" />#{rank}
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-xs font-medium text-white">
          {Math.floor(video.duration / 60)}:
          {String(Math.floor(video.duration % 60)).padStart(2, "0")}
        </div>

        {/* Play Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center transform transition-transform group-hover:scale-110">
            <Play className="w-6 h-6 text-black fill-current ml-1" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="w-5 h-5">
            <AvatarImage src={toBackendAssetUrl(video.owner.avatar)} />
            <AvatarFallback>
              {video.owner.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{video.owner.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>{formatViewCount(video.views)} views</span>
          <span>•</span>
          <span>{formatTimeAgo(video.createdAt)}</span>
        </div>
      </div>
    </Link>

    {/* 3-dot menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/60 hover:bg-black/80 text-white">
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

export default TrendingSection;
