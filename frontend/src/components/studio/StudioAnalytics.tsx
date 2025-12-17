"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Eye,
  Clock,
  ThumbsUp,
  MessageSquare,
  Users,
  Video,
  Calendar,
} from "lucide-react";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Channel {
  _id: string;
  name: string;
}

interface StudioAnalyticsProps {
  channel: Channel;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function StudioAnalytics({ channel }: StudioAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalViews: 0,
      totalVideos: 0,
      totalLikes: 0,
      totalComments: 0,
      subscribersGained: 0,
      avgViewDuration: 0,
    },
    viewsOverTime: [] as any[],
    topVideos: [] as any[],
    audienceRetention: [] as any[],
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch channel videos
      const videosResponse = await apiClient.get("/videos/search", {
        params: { channelId: channel._id },
      });
      const videos = Array.isArray(videosResponse.data.data)
        ? videosResponse.data.data
        : [];

      // Calculate analytics
      const totalViews = videos.reduce(
        (acc: number, v: any) => acc + (v.views || 0),
        0,
      );
      const totalLikes = videos.reduce(
        (acc: number, v: any) => acc + (v.likesCount || 0),
        0,
      );
      const totalComments = videos.reduce(
        (acc: number, v: any) => acc + (v.commentsCount || 0),
        0,
      );

      // Mock views over time data (in real app, this would come from backend)
      const viewsOverTime = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(
          Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: Math.floor(Math.random() * 1000) + 100,
        engagement: Math.floor(Math.random() * 100) + 20,
      }));

      // Top videos
      const topVideos = videos
        .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((v: any) => ({
          title:
            v.title.length > 30 ? v.title.substring(0, 30) + "..." : v.title,
          views: v.views || 0,
          likes: v.likesCount || 0,
        }));

      setAnalytics({
        overview: {
          totalViews,
          totalVideos: videos.length,
          totalLikes,
          totalComments,
          subscribersGained: Math.floor(Math.random() * 100) + 10,
          avgViewDuration: Math.floor(Math.random() * 300) + 60,
        },
        viewsOverTime,
        topVideos,
        audienceRetention: [],
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [channel._id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
      <div>
        <h2 className="text-3xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">
          Track your channel&apos;s performance
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time channel views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.totalVideos}
            </div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                analytics.overview.totalLikes + analytics.overview.totalComments
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Likes & comments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subscribers Gained
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{analytics.overview.subscribersGained}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. View Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(analytics.overview.avgViewDuration / 60)}:
              {String(analytics.overview.avgViewDuration % 60).padStart(2, "0")}
            </div>
            <p className="text-xs text-muted-foreground">Minutes per view</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.totalLikes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All videos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="views" className="space-y-6">
        <TabsList>
          <TabsTrigger value="views">Views Over Time</TabsTrigger>
          <TabsTrigger value="top">Top Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Views & Engagement Trend</CardTitle>
              <CardDescription>Last 7 days performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Engagement"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Videos</CardTitle>
              <CardDescription>Your most viewed content</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Video className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No video data available
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topVideos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="title"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" name="Views" />
                    <Bar dataKey="likes" fill="#82ca9d" name="Likes" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
