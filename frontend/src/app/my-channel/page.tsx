"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Video as VideoIcon,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";

// Lazy-load heavy studio components to reduce HMR invalidation scope
const StudioDashboard = dynamic(
  () =>
    import("@/components/studio/StudioDashboard").then((m) => ({
      default: m.StudioDashboard,
    })),
  { ssr: false }
);
const StudioVideos = dynamic(
  () =>
    import("@/components/studio/StudioVideos").then((m) => ({
      default: m.StudioVideos,
    })),
  { ssr: false }
);
const StudioAnalytics = dynamic(
  () =>
    import("@/components/studio/StudioAnalytics").then((m) => ({
      default: m.StudioAnalytics,
    })),
  { ssr: false }
);

interface Channel {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  subscribers?: string[];
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

export default function MyChannel() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchChannel = useCallback(async () => {
    try {
      const response = await apiClient.get("/channels/user/me");
      if (response.data.success) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          setChannel(data[0] || null);
        } else {
          setChannel(data);
        }
      }
    } catch (error) {
      console.error("Error fetching channel:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated && user) {
      fetchChannel();
    }
  }, [isAuthenticated, isLoading, user, router, fetchChannel]);

  if (isLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
              My Channel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and grow your channel
            </p>
          </div>
          <Link href="/upload">
            <Button size="lg" className="gap-2">
              <Upload className="w-5 h-5" />
              Upload Video
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {channel ? (
            <>
              <TabsContent value="dashboard" className="space-y-6">
                <StudioDashboard channel={channel} />
              </TabsContent>
              <TabsContent value="content" className="space-y-6">
                <StudioVideos channel={channel} />
              </TabsContent>
              <TabsContent value="analytics" className="space-y-6">
                <StudioAnalytics channel={channel} />
              </TabsContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <VideoIcon className="w-16 h-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No channel found</h3>
              <p className="text-muted-foreground">
                Create a channel to start uploading videos
              </p>
            </div>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
