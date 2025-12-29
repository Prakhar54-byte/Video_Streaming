"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoGrid } from "@/components/video/VideoGrid";
import { MessageFeed } from "@/components/messages/MessageFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, MessageSquare } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          {/* Tabs Skeleton */}
          <div className="w-full max-w-md mx-auto h-14 mb-8 bg-muted/50 animate-pulse rounded-lg" />

          {/* Content Skeleton (Grid of videos) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted/50 animate-pulse rounded-xl" />
                {/* Meta */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/50 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted/50 animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted/50 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-14">
            <TabsTrigger
              value="videos"
              className="flex items-center gap-2 text-base py-3"
            >
              <Video className="w-5 h-5" />
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="flex items-center gap-2 text-base py-3"
            >
              <MessageSquare className="w-5 h-5" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-6">
            <VideoGrid />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessageFeed />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
