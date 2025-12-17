"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoCard } from "@/components/video/VideoCard";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Loader2, History as HistoryIcon } from "lucide-react";

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

export default function HistoryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    const fetchWatchHistory = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/users/history");
        const historyData = response.data.data;

        // Extract videos from watch history
        setVideos(Array.isArray(historyData) ? historyData : []);
      } catch (error) {
        console.error("Error fetching watch history:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchWatchHistory();
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
            <HistoryIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Watch History</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Videos you&apos;ve watched recently
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <HistoryIcon className="w-24 h-24 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-semibold mb-2 text-muted-foreground">
              No watch history yet
            </h2>
            <p className="text-lg text-muted-foreground">
              Videos you watch will appear here
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
