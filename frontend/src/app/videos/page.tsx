"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Grid, TrendingUp } from "lucide-react";

export default function VideosPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
            Discover Videos
          </h1>
          <p className="text-muted-foreground text-lg">
            Watch content from your subscriptions and explore new channels
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 h-14">
            <TabsTrigger value="subscribed" className="flex items-center gap-2 text-base py-3">
              <Bell className="w-5 h-5" />
              Subscribed
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2 text-base py-3">
              <Grid className="w-5 h-5" />
              All Videos
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2 text-base py-3">
              <TrendingUp className="w-5 h-5" />
              Trending
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscribed" className="space-y-6">
            <VideoGrid subscribedOnly={true} />
          </TabsContent>
          
          <TabsContent value="all" className="space-y-6">
            <VideoGrid />
          </TabsContent>
          
          <TabsContent value="trending" className="space-y-6">
            <VideoGrid sortBy="views" />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
