"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api";
import { Play, Eye, Clock, Bell } from "lucide-react";
import {formatViewCount,  formatTimeAgo } from "@/lib/utils";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: number;
  views: number;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
}

interface VideoGridProps {
  subscribedOnly?: boolean;
}

export function VideoGrid({ subscribedOnly = false }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  useEffect(() => {
    fetchVideosWithSubscriptions();
  }, [subscribedOnly, user]);

  const fetchVideosWithSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch subscribed channels
      let subscribedChannelIds: string[] = [];
      if (user) {
        try {
          const subsResponse = await apiClient.get(`/subscriptions/u/${user._id}`);
          subscribedChannelIds = subsResponse.data.data?.map((sub: any) => sub.channel._id) || [];
          setSubscribedChannels(new Set(subscribedChannelIds));
        } catch (error) {
          console.error("Error fetching subscriptions:", error);
        }
      }
      
      // Fetch all videos
      const videosResponse = await apiClient.get("/videos?page=1&limit=100");
      const allVideos = videosResponse.data.data || [];
      
      if (subscribedOnly) {
        // Filter to only show subscribed channel videos
        if (subscribedChannelIds.length > 0) {
          const filteredVideos = allVideos.filter((video: Video) => 
            subscribedChannelIds.includes(video.owner?._id)
          );
          setVideos(filteredVideos);
        } else {
          // If no subscriptions, show all videos
          setVideos(allVideos);
        }
      } else {
        // Show all videos but sort: subscribed channels first, then others
        if (subscribedChannelIds.length > 0) {
          const subscribedVideos = allVideos.filter((video: Video) => 
            subscribedChannelIds.includes(video.owner?._id)
          );
          const otherVideos = allVideos.filter((video: Video) => 
            !subscribedChannelIds.includes(video.owner?._id)
          );
          setVideos([...subscribedVideos, ...otherVideos]);
        } else {
          // No subscriptions, show all videos normally
          setVideos(allVideos);
        }
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSubscribedChannel = (ownerId: string) => {
    return subscribedChannels.has(ownerId);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted aspect-video rounded-lg"></div>
            <div className="mt-3 space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => {
        const isSubscribed = isSubscribedChannel(video.owner?._id);
        
        return (
          <Link key={video._id} href={`/video/${video._id}`}>
            <div className="group cursor-pointer">
              <div className={`relative aspect-video bg-muted rounded-lg overflow-hidden ${
                isSubscribed ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : ''
              }`}>
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                    <Play className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                
                {/* Subscribed badge */}
                {isSubscribed && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                    <Bell className="w-3 h-3" />
                    Subscribed
                  </div>
                )}
                
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                  {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                </div>
              </div>
              
              <div className="mt-3">
                <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className={`text-base mt-2 flex items-center gap-2 ${
                  isSubscribed ? 'text-orange-500 font-medium' : 'text-muted-foreground'
                }`}>
                  {isSubscribed && <Bell className="w-4 h-4" />}
                  {video.owner.fullName}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatViewCount(video.views)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(video.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
