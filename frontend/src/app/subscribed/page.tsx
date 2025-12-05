"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Video, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Channel {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  videoCount?: number;
  subscribersCount?: number;
}

interface SubscribedChannel extends Channel {
  channel: Channel;
}

export default function SubscribedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"subscribed" | "explore">(
    "subscribed",
  );
  const [subscribedChannelsList, setSubscribedChannelsList] = useState<
    Channel[]
  >([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSubscribedChannels(), fetchAllChannels()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribedChannels = async () => {
    try {
      const subsResponse = await apiClient.get(`/subscriptions/u/${user?._id}`);
      const subs = subsResponse.data.data || [];

      // Get video counts for subscribed channels
      const videosResponse = await apiClient.get("/videos?page=1&limit=200");
      const allVideos = videosResponse.data.data || [];

      const videoCountMap = new Map<string, number>();
      allVideos.forEach((video: any) => {
        if (video.owner?._id) {
          videoCountMap.set(
            video.owner._id,
            (videoCountMap.get(video.owner._id) || 0) + 1,
          );
        }
      });

      // Fetch detailed channel info for each subscribed channel
      const channelPromises = subs.map((sub: any) =>
        apiClient.get(`/users/channel/${sub.channel._id}`).catch(() => null),
      );

      const channelResponses = await Promise.all(channelPromises);

      const channels = subs.map((sub: any, index: number) => {
        const channelData = channelResponses[index]?.data?.data;
        return {
          _id: sub.channel._id,
          username: sub.channel.username || channelData?.username || "unknown",
          fullName:
            sub.channel.fullName || channelData?.fullName || "Unknown User",
          avatar: sub.channel.avatar || channelData?.avatar,
          coverImage: channelData?.coverImage || sub.channel.coverImage,
          subscribersCount: channelData?.subscribersCount || 0,
          videoCount: videoCountMap.get(sub.channel._id) || 0,
        };
      });

      setSubscribedChannelsList(channels);
      setSubscribedIds(new Set(channels.map((c) => c._id)));

      // If no subscriptions, switch to explore tab
      if (channels.length === 0) {
        setActiveTab("explore");
      }
    } catch (error) {
      console.error("Error fetching subscribed channels:", error);
    }
  };

  const fetchAllChannels = async () => {
    try {
      // Fetch all videos to get unique channels with counts
      const response = await apiClient.get("/videos?page=1&limit=200");
      const videos = response.data.data || [];

      // Get unique channels with video counts
      const channelsMap = new Map<string, Channel>();
      videos.forEach((video: any) => {
        if (video.owner && video.owner._id !== user?._id) {
          if (!channelsMap.has(video.owner._id)) {
            channelsMap.set(video.owner._id, {
              _id: video.owner._id,
              username: video.owner.username || "unknown",
              fullName: video.owner.fullName || "Unknown User",
              avatar: video.owner.avatar,
              coverImage: video.owner.coverImage,
              videoCount: 1,
              subscribersCount: 0,
            });
          } else {
            const channel = channelsMap.get(video.owner._id)!;
            channel.videoCount = (channel.videoCount || 0) + 1;
          }
        }
      });

      // Fetch detailed channel info for each unique channel
      const channelIds = Array.from(channelsMap.keys());
      const channelPromises = channelIds.map((id) =>
        apiClient.get(`/users/channel/${id}`).catch(() => null),
      );

      const channelResponses = await Promise.all(channelPromises);

      channelResponses.forEach((resp, index) => {
        if (resp && resp.data.data) {
          const channelId = channelIds[index];
          const existingChannel = channelsMap.get(channelId);
          if (existingChannel) {
            channelsMap.set(channelId, {
              ...existingChannel,
              coverImage: resp.data.data.coverImage,
              subscribersCount: resp.data.data.subscribersCount || 0,
            });
          }
        }
      });

      // Convert to array and sort by video count
      const channels = Array.from(channelsMap.values()).sort(
        (a, b) => (b.videoCount || 0) - (a.videoCount || 0),
      );

      setAllChannels(channels);
    } catch (error) {
      console.error("Error fetching all channels:", error);
    }
  };

  const handleSubscribe = async (channelId: string) => {
    try {
      await apiClient.post(`/subscriptions/c/${channelId}`);

      // Find the channel in allChannels
      const channelToSubscribe = allChannels.find((ch) => ch._id === channelId);

      if (channelToSubscribe) {
        // Fetch updated channel info with correct subscriber count
        try {
          const channelResponse = await apiClient.get(
            `/users/channel/${channelId}`,
          );
          const updatedChannel = {
            ...channelToSubscribe,
            subscribersCount: channelResponse.data.data.subscribersCount || 0,
            coverImage:
              channelResponse.data.data.coverImage ||
              channelToSubscribe.coverImage,
          };

          // Add to subscribed list with updated data
          setSubscribedChannelsList((prev) => [...prev, updatedChannel]);
        } catch {
          // Fallback to incrementing count if fetch fails
          setSubscribedChannelsList((prev) => [
            ...prev,
            {
              ...channelToSubscribe,
              subscribersCount: (channelToSubscribe.subscribersCount || 0) + 1,
            },
          ]);
        }

        // Remove from explore list
        setAllChannels((prev) => prev.filter((ch) => ch._id !== channelId));

        // Update subscribed IDs
        setSubscribedIds((prev) => new Set([...prev, channelId]));
      }

      toast({
        title: "Subscribed successfully!",
        description: "Channel added to your subscriptions",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to subscribe",
        variant: "destructive",
      });
    }
  };

  const handleUnsubscribe = async (channelId: string) => {
    try {
      await apiClient.post(`/subscriptions/c/${channelId}`);

      // Find the channel in subscribed list
      const channelToUnsubscribe = subscribedChannelsList.find(
        (ch) => ch._id === channelId,
      );

      if (channelToUnsubscribe) {
        // Remove from subscribed list
        setSubscribedChannelsList((prev) =>
          prev.filter((ch) => ch._id !== channelId),
        );

        // Add to explore list with updated count (if not user's own channel)
        if (channelToUnsubscribe._id !== user?._id) {
          try {
            const channelResponse = await apiClient.get(
              `/users/channel/${channelId}`,
            );
            const updatedChannel = {
              ...channelToUnsubscribe,
              subscribersCount: channelResponse.data.data.subscribersCount || 0,
            };
            setAllChannels((prev) => [updatedChannel, ...prev]);
          } catch {
            // Fallback to decrementing count if fetch fails
            setAllChannels((prev) => [
              {
                ...channelToUnsubscribe,
                subscribersCount: Math.max(
                  0,
                  (channelToUnsubscribe.subscribersCount || 1) - 1,
                ),
              },
              ...prev,
            ]);
          }
        }

        // Update subscribed IDs
        setSubscribedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(channelId);
          return newSet;
        });
      }

      toast({
        title: "Unsubscribed",
        description: "Channel removed from your subscriptions",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unsubscribe",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayChannels =
    activeTab === "subscribed" ? subscribedChannelsList : allChannels;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            Channels
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover and subscribe to amazing content creators
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab("subscribed")}
            className={`px-6 py-3 text-lg font-semibold transition-all relative ${
              activeTab === "subscribed"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Subscribed ({subscribedChannelsList.length})
            </div>
            {activeTab === "subscribed" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-6 py-3 text-lg font-semibold transition-all relative ${
              activeTab === "explore"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Explore ({allChannels.length})
            </div>
            {activeTab === "explore" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500" />
            )}
          </button>
        </div>

        {/* Empty State for Subscribed */}
        {activeTab === "subscribed" && subscribedChannelsList.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-16 h-16 text-orange-500" />
            </div>
            <h2 className="text-3xl font-bold mb-3">No Subscriptions Yet</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
              Start following your favorite creators to see their content here
            </p>
            <Button
              onClick={() => setActiveTab("explore")}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white font-semibold px-8 py-6 text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Explore Channels
            </Button>
          </div>
        )}

        {/* Channels Grid */}
        {displayChannels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayChannels.map((channel) => (
              <div
                key={channel._id}
                className="group relative bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2"
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                }}
              >
                {/* Cover Image */}
                <div className="relative h-32 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-yellow-500/20 overflow-hidden">
                  {channel.coverImage ? (
                    <Image
                      src={channel.coverImage}
                      alt={`${channel.fullName} cover`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 opacity-30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>

                {/* Avatar */}
                <div className="relative px-6 pb-6">
                  <div className="absolute -top-12 left-6">
                    <div className="relative">
                      <Image
                        src={channel.avatar || "/placeholder/user-avatar.png"}
                        alt={channel.username}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full border-4 border-background object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-16 space-y-3">
                    <div>
                      <h3
                        className="text-xl font-bold mb-1 group-hover:text-orange-500 transition-colors line-clamp-1"
                        title={channel.fullName}
                      >
                        {channel.fullName}
                      </h3>
                      <p
                        className="text-sm text-muted-foreground truncate"
                        title={`@${channel.username}`}
                      >
                        @{channel.username}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {channel.videoCount || 0} videos
                        </span>
                      </div>
                      {channel.subscribersCount !== undefined && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {channel.subscribersCount} subs
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      <Link href={`/channel/${channel._id}`} className="w-full">
                        <Button
                          variant="outline"
                          className="w-full transition-all duration-300 hover:border-orange-500 text-sm"
                        >
                          View Channel
                        </Button>
                      </Link>
                      {subscribedIds.has(channel._id) ? (
                        <Button
                          onClick={() => handleUnsubscribe(channel._id)}
                          variant="outline"
                          className="w-full bg-muted transition-all duration-300 text-sm"
                        >
                          <BellOff className="w-4 h-4 mr-2" />
                          Subscribed
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(channel._id)}
                          className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 text-sm"
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Subscribe
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-red-500/0 to-yellow-500/0 group-hover:from-orange-500/5 group-hover:via-red-500/5 group-hover:to-yellow-500/5 transition-all duration-500 pointer-events-none rounded-2xl" />
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
