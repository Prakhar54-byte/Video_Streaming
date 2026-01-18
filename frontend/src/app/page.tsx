"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoGrid } from "@/components/video/VideoGrid";
import { MessageFeed } from "@/components/messages/MessageFeed";
import { CategoryTabs } from "@/components/home/CategoryTabs";
import { TrendingSection } from "@/components/home/TrendingSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, MessageSquare, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          {/* Category Skeleton */}
          <div className="flex gap-2 mb-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-24 bg-muted/50 animate-pulse rounded-full shrink-0" />
            ))}
          </div>

          {/* Trending Skeleton */}
          <div className="mb-8">
            <div className="h-6 w-40 bg-muted/50 animate-pulse rounded mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shrink-0 w-80">
                  <div className="aspect-video bg-muted/50 animate-pulse rounded-xl" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-3/4 bg-muted/50 animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted/50 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
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
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 h-14">
            <TabsTrigger value="videos" className="flex items-center gap-2 text-base py-3">
              <Video className="w-5 h-5" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 text-base py-3">
              <MessageSquare className="w-5 h-5" />
              Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-8">
            {/* Category Filter Tabs */}
            <CategoryTabs 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {/* Trending Section - Only show on "all" or "trending" */}
            {(activeCategory === "all" || activeCategory === "trending") && (
              <TrendingSection className="pb-4 border-b border-border/50" />
            )}

            {/* Main Video Grid */}
            <div>
              {activeCategory !== "trending" && (
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">
                    {activeCategory === "all" ? "Recommended For You" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Videos`}
                  </h2>
                </div>
              )}
              <VideoGrid sortBy={activeCategory === "trending" ? "views" : "recent"} />
            </div>
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-6">
            <MessageFeed />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
