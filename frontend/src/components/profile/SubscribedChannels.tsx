"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import { Users, UserMinus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Channel {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
  };
  subscribersCount?: number;
}

export function SubscribedChannels() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscribedChannels = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      // Correct endpoint: /subscriptions/u/:userId
      const response = await apiClient.get(`/subscriptions/u/${user._id}`);
      const subscribedData = response.data.data || [];

      // Backend returns array of subscription objects with channel details
      // Extract the channel information from the response
      const channelsList = Array.isArray(subscribedData)
        ? subscribedData.map((sub: any) => {
            const channelData = sub.channel || sub.channelDetails || sub;
            return {
              _id: channelData._id,
              name: channelData.fullName || channelData.username, // Map fullName to name
              description: channelData.description || "",
              avatar: channelData.avatar,
              banner: channelData.coverImage,
              owner: {
                _id: channelData._id,
                username: channelData.username,
                fullName: channelData.fullName,
              },
              subscribersCount: channelData.subscribersCount || 0,
            };
          })
        : [];

      setChannels(channelsList);
    } catch (error: any) {
      console.error("Error fetching subscribed channels:", error);
      toast.error("Failed to load subscribed channels");
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchSubscribedChannels();
  }, [fetchSubscribedChannels]);

  const handleUnsubscribe = async (channelId: string) => {
    try {
      await apiClient.post(`/subscriptions/c/${channelId}`);
      toast.success("Unsubscribed successfully");
      fetchSubscribedChannels();
    } catch (error: any) {
      toast.error("Failed to unsubscribe");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No Subscriptions Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Channels you subscribe to will appear here. Start exploring and
              subscribing!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  channels.forEach((c) => {
    console.log("Check channel has name ", c?.name);
    console.log("Check channel has", c);
    console.log("Sub", c.subscribersCount);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscribed Channels</h2>
        <p className="text-muted-foreground">
          {channels.length} channel{channels.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <Card
            key={channel._id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={channel.avatar} alt={channel.name} />
                  <AvatarFallback className="text-lg">
                    {channel?.name?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/channel/${channel._id}`}>
                    <h3 className="font-semibold text-lg hover:underline truncate">
                      {channel.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    @{channel.owner?.username}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-2">
                    {channel?.subscribersCount || 0} subscribers
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {channel.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => handleUnsubscribe(channel._id)}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Unsubscribe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
