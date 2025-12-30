"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/api";
import { VideoCard } from "@/components/video/VideoCard";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFiles: string;
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

export function LikedVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLikedVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/likes/videos");
      // Backend returns { data: { videos: [...] } }
      const responseData = response.data.data || {};
      const likedVideos = responseData.videos || responseData || [];
      setVideos(Array.isArray(likedVideos) ? likedVideos : []);
    } catch (error: any) {
      console.error("Error fetching liked videos:", error);
      toast.error("Failed to load liked videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLikedVideos();
  }, [fetchLikedVideos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Heart className="w-12 h-12 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No Liked Videos Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Videos you like will appear here. Start exploring and liking videos!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Liked Videos</h2>
        <p className="text-muted-foreground">Videos you&apos;ve liked</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
}
