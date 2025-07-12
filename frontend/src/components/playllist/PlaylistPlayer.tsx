"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { playlistService } from "@/services/playlist.service";
import {
  Play,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  List,
  X,
} from "lucide-react";

interface PlaylistPlayerProps {
  playlistId: string;
  currentVideoId?: string;
  onVideoSelect: (videoId: string, index: number) => void;
  onClose?: () => void;
  className?: string;
}

interface PlaylistVideo {
  _id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
}

interface PlaylistData {
  _id: string;
  name: string;
  description: string;
  videoDetails: PlaylistVideo[];
}

export function PlaylistPlayer({
  playlistId,
  currentVideoId,
  onVideoSelect,
  onClose,
  className = "",
}: PlaylistPlayerProps) {
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none");
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  useEffect(() => {
    if (playlist && currentVideoId) {
      const index = playlist.videoDetails.findIndex(
        (video) => video._id === currentVideoId,
      );
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [playlist, currentVideoId]);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);

      // API Call: GET /{playlistId}
      const response = await playlistService.getPlaylistById(playlistId);

      if (response.success && response.data && response.data.length > 0) {
        setPlaylist(response.data[0]);
        // Initialize shuffled order
        const order = Array.from(
          { length: response.data[0].videoDetails.length },
          (_, i) => i,
        );
        setShuffledOrder(order);
      }
    } catch (error: any) {
      console.error("Error fetching playlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoOrder = () => {
    if (!playlist) return [];
    return isShuffled
      ? shuffledOrder
      : Array.from({ length: playlist.videoDetails.length }, (_, i) => i);
  };

  const getCurrentVideoIndex = () => {
    const order = getVideoOrder();
    return order.indexOf(currentIndex);
  };

  const playNext = () => {
    if (!playlist) return;

    const order = getVideoOrder();
    const currentOrderIndex = getCurrentVideoIndex();

    let nextIndex: number;

    if (repeatMode === "one") {
      nextIndex = currentIndex;
    } else if (currentOrderIndex < order.length - 1) {
      nextIndex = order[currentOrderIndex + 1];
    } else if (repeatMode === "all") {
      nextIndex = order[0];
    } else {
      return; // End of playlist
    }

    setCurrentIndex(nextIndex);
    onVideoSelect(playlist.videoDetails[nextIndex]._id, nextIndex);
  };

  const playPrevious = () => {
    if (!playlist) return;

    const order = getVideoOrder();
    const currentOrderIndex = getCurrentVideoIndex();

    let prevIndex: number;

    if (repeatMode === "one") {
      prevIndex = currentIndex;
    } else if (currentOrderIndex > 0) {
      prevIndex = order[currentOrderIndex - 1];
    } else if (repeatMode === "all") {
      prevIndex = order[order.length - 1];
    } else {
      return; // Beginning of playlist
    }

    setCurrentIndex(prevIndex);
    onVideoSelect(playlist.videoDetails[prevIndex]._id, prevIndex);
  };

  const toggleShuffle = () => {
    if (!playlist) return;

    if (!isShuffled) {
      // Create shuffled order
      const order = Array.from(
        { length: playlist.videoDetails.length },
        (_, i) => i,
      );
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      setShuffledOrder(order);
    }

    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes: Array<"none" | "one" | "all"> = ["none", "one", "all"];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!playlist) {
    return null;
  }

  const currentVideo = playlist.videoDetails[currentIndex];
  const order = getVideoOrder();
  const currentOrderIndex = getCurrentVideoIndex();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <List className="h-4 w-4" />
            {playlist.name}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Current Video Info */}
        {currentVideo && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <img
                src={
                  currentVideo.thumbnail ||
                  "/placeholder.svg?height=48&width=80"
                }
                alt={currentVideo.title}
                className="w-16 h-10 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">
                  {currentVideo.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentOrderIndex + 1} of {playlist.videoDetails.length}
                  </Badge>
                  {currentVideo.duration && (
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(currentVideo.duration)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShuffle}
            className={isShuffled ? "text-primary" : ""}
          >
            <Shuffle className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={playPrevious}
            disabled={currentOrderIndex === 0 && repeatMode !== "all"}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={playNext}
            disabled={
              currentOrderIndex === order.length - 1 && repeatMode !== "all"
            }
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRepeat}
            className={repeatMode !== "none" ? "text-primary" : ""}
          >
            <Repeat className="h-4 w-4" />
            {repeatMode === "one" && <span className="text-xs ml-1">1</span>}
          </Button>
        </div>

        {/* Video List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {order.map((videoIndex, orderIndex) => {
              const video = playlist.videoDetails[videoIndex];
              const isCurrentVideo = videoIndex === currentIndex;

              return (
                <div
                  key={video._id}
                  className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                    isCurrentVideo
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setCurrentIndex(videoIndex);
                    onVideoSelect(video._id, videoIndex);
                  }}
                >
                  <div className="flex-shrink-0 text-xs text-muted-foreground w-6 text-center">
                    {orderIndex + 1}
                  </div>

                  <img
                    src={
                      video.thumbnail || "/placeholder.svg?height=32&width=56"
                    }
                    alt={video.title}
                    className="w-12 h-8 object-cover rounded flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h5
                      className={`text-xs line-clamp-2 ${isCurrentVideo ? "font-medium text-primary" : ""}`}
                    >
                      {video.title}
                    </h5>
                    {video.duration && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>

                  {isCurrentVideo && (
                    <Play className="h-3 w-3 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
