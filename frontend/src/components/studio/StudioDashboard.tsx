"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Eye, Users, Video, Upload, 
  BarChart3, Clock, ThumbsUp, MessageSquare 
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";
import { toast } from "sonner";

interface Channel {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  subscribers?: string[];
  owner: string | {
    _id: string;
  };
}

interface StudioDashboardProps {
  channel: Channel;
}

export function StudioDashboard({ channel }: StudioDashboardProps) {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = typeof channel.owner === 'string' ? channel.owner : channel.owner?._id;
      // Fetch channel videos
      const videosResponse = await apiClient.get("/videos/search", {
        params: { userId }
      });
      const data = videosResponse.data.data;
      const videos = Array.isArray(data) ? data : (data.videos || []);
      
      // Calculate stats
      const totalViews = videos.reduce((acc: number, v: any) => acc + (v.views || 0), 0);
      const totalLikes = videos.reduce((acc: number, v: any) => acc + (v.likesCount || 0), 0);
      const totalComments = videos.reduce((acc: number, v: any) => acc + (v.commentsCount || 0), 0);

      setStats({
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalComments,
      });

      setRecentVideos(videos.slice(0, 5));
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [channel._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Channel Studio</h2>
          <p className="text-muted-foreground">{channel.name}</p>
        </div>
        <Link href="/upload">
          <Button size="lg" className="gap-2">
            <Upload className="w-5 h-5" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              Published videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All-time views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channel.subscribers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Channel subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes + stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              Likes & comments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Videos</CardTitle>
          <CardDescription>Your latest uploaded content</CardDescription>
        </CardHeader>
        <CardContent>
          {recentVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Video className="w-12 h-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No videos yet</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your first video to get started
                </p>
              </div>
              <Link href="/upload">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <div
                  key={video._id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="relative w-32 h-20 rounded-md overflow-hidden bg-muted">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail.replace('/public', '')}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{video.title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {video.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {video.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                  <Badge variant={video.isPublished ? "default" : "secondary"}>
                    {video.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <Upload className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>Share new content with your audience</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="w-8 h-8 text-primary mb-2" />
            <CardTitle>View Analytics</CardTitle>
            <CardDescription>Track your channel performance</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <Video className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Manage Content</CardTitle>
            <CardDescription>Edit and organize your videos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
