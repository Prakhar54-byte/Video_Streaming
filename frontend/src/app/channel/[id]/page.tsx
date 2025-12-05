"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import { Bell, BellOff, Video, Eye, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatViewCount, formatTimeAgo } from "@/lib/utils";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFiles: string;
  duration: number;
  views: number;
  createdAt: string;
}

interface Channel {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  email?: string;
}

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchChannelData();
      fetchChannelVideos();
      checkSubscription();
    }
  }, [params.id]);

  const fetchChannelData = async () => {
    try {
      const response = await apiClient.get(`/users/channel/${params.id}`);
      const channelData = response.data.data;
      setChannel(channelData);
      setSubscribersCount(channelData.subscribersCount || 0);
    } catch (error: any) {
      console.error("Error fetching channel:", error);
      toast({
        title: "Error loading channel",
        description: error.response?.data?.message || "Channel not found",
        variant: "destructive",
      });
      router.push("/");
    }
  };

  const fetchChannelVideos = async () => {
    try {
      const response = await apiClient.get(`/videos?page=1&limit=100`);
      const allVideos = response.data.data || [];
      const channelVideos = allVideos.filter(
        (v: any) => v.owner?._id === params.id,
      );
      setVideos(channelVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/subscriptions/u/${user._id}`);
      const subscriptions = response.data.data || [];
      const subscribed = subscriptions.some(
        (sub: any) => sub.channel._id === params.id,
      );
      setIsSubscribed(subscribed);

      // Also fetch fresh channel data to get accurate subscriber count
      const channelResponse = await apiClient.get(
        `/users/channel/${params.id}`,
      );
      setSubscribersCount(channelResponse.data.data.subscribersCount || 0);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const wasSubscribed = isSubscribed;
      await apiClient.post(`/subscriptions/c/${params.id}`);

      // Toggle subscription state
      setIsSubscribed(!wasSubscribed);

      // Update count based on previous state
      setSubscribersCount((prev) => (wasSubscribed ? prev - 1 : prev + 1));

      toast({
        title: wasSubscribed ? "Unsubscribed" : "Subscribed successfully!",
        description: wasSubscribed
          ? "Channel removed from subscriptions"
          : "Channel added to subscriptions",
      });

      // Refresh to get accurate count from backend
      setTimeout(() => checkSubscription(), 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!channel) {
    return null;
  }

  const isOwnChannel = user?._id === channel._id;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Cover Image */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-yellow-500/20">
          {channel.coverImage ? (
            <Image
              src={channel.coverImage}
              alt="Channel cover"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Channel Info */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Avatar */}
              <div className="relative">
                <Image
                  src={channel.avatar || "/placeholder/user-avatar.png"}
                  alt={channel.fullName}
                  width={160}
                  height={160}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background object-cover shadow-2xl"
                />
              </div>

              {/* Channel Details */}
              <div className="flex-1 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {channel.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="text-lg">@{channel.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {videos.length} videos
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-4 h-4" />
                    {subscribersCount} subscribers
                  </span>
                </div>
              </div>

              {/* Subscribe Button */}
              {!isOwnChannel && (
                <Button
                  onClick={handleSubscribe}
                  className={`px-8 py-6 text-lg font-semibold ${
                    isSubscribed
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:shadow-lg hover:shadow-orange-500/50"
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <BellOff className="w-5 h-5 mr-2" />
                      Subscribed
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Videos Section */}
          <div className="py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Videos</h2>
              <span className="text-muted-foreground">
                {videos.length} uploads
              </span>
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-16 bg-card border rounded-xl">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground">
                  {isOwnChannel
                    ? "Upload your first video to get started!"
                    : "This channel hasn't uploaded any videos yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <Link key={video._id} href={`/video/${video._id}`}>
                    <div className="group cursor-pointer">
                      <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mb-3">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-sm font-semibold">
                          {Math.floor(video.duration / 60)}:
                          {(video.duration % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold line-clamp-2 text-lg group-hover:text-orange-500 transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatViewCount(video.views)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatTimeAgo(video.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
