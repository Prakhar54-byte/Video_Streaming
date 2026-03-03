"use client";

import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useWatchLaterStore } from "@/store/watchLaterStore";
import { useAuthStore } from "@/store/authStore";
import { VideoCard } from "@/components/video/VideoCard";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BookmarkCheck, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
}

export default function WatchLaterPage() {
  const { videoIds, clearWatchLater } = useWatchLaterStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    if (videoIds.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch each video's details
      const results = await Promise.allSettled(
        videoIds.map((id) => apiClient.get(`/videos/${id}`))
      );

      const fetched: Video[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          const videoData = result.value.data?.data;
          if (videoData) fetched.push(videoData);
        }
      }
      setVideos(fetched);
    } catch (error) {
      console.error("Error fetching watch later videos:", error);
    } finally {
      setLoading(false);
    }
  }, [videoIds]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleClearAll = () => {
    if (confirm("Remove all videos from Watch Later?")) {
      clearWatchLater();
      setVideos([]);
      toast.success("Watch Later cleared");
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <BookmarkCheck className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Log in to view Watch Later</h2>
          <Button asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookmarkCheck className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Watch Later</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {videoIds.length} {videoIds.length === 1 ? "video" : "videos"} saved
            </p>
          </div>
          {videoIds.length > 0 && (
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookmarkCheck className="w-24 h-24 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-semibold mb-2 text-muted-foreground">
              No videos saved yet
            </h2>
            <p className="text-lg text-muted-foreground">
              Use the &quot;Watch Later&quot; option on any video to save it here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
