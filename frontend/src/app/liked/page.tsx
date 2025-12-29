"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoCard } from "@/components/video/VideoCard";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Loader2, ThumbsUp } from "lucide-react";
import { LikedVideos } from "@/components/profile/LikedVideos";

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

export default function LikedVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    const fetchLikedVideos = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/likes/videos");

        // Handle nested response structure
        const likedData =
          response.data?.data?.videos || response.data?.data || [];
        setVideos(Array.isArray(likedData) ? likedData : []);
      } catch (error) {
        console.error("Error fetching liked videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLikedVideos();
    }
  }, [isAuthenticated, isLoading, router]);

  if (loading || isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ThumbsUp className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Liked Videos</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Videos you&apos;ve liked
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ThumbsUp className="w-24 h-24 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-semibold mb-2 text-muted-foreground">
              No liked videos yet
            </h2>
            <p className="text-lg text-muted-foreground">
              Videos you like will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video?._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
