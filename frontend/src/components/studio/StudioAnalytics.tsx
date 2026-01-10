"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Eye, Clock, ThumbsUp, MessageSquare,
  Users, Video, Calendar, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { toBackendAssetUrl, formatViewCount } from "@/lib/utils";
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
  AreaChart,
  Area,
} from "recharts";

interface Channel {
  subscribers?: any;
  _id: string;
  name: string;
  owner: string | {
    _id: string;
  };
}

interface StudioAnalyticsProps {
  channel: Channel;
}

interface VideoData {
  _id: string;
  title: string;
  views: number;
  duration: number;
  likesCount: number;
  commentsCount: number;
  isPublished: boolean;
  createdAt: string;
  thumbnail?: string;
}

interface VideoAnalytics {
  video: VideoData;
  engagementRate: number;
  avgViewDuration: number;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c43", "#a855f7"];

export function StudioAnalytics({ channel }: StudioAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("all");
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalViews: 0,
      totalVideos: 0,
      publishedVideos: 0,
      draftVideos: 0,
      totalLikes: 0,
      totalComments: 0,
      subscribersCount: 0,
      avgViewDuration: 0,
      totalWatchTime: 0,
    },
    viewsOverTime: [] as any[],
    engagementOverTime: [] as any[],
    topVideos: [] as any[],
    videoDistribution: [] as any[],
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const userId = typeof channel.owner === 'string' ? channel.owner : channel.owner?._id;
      
      // Fetch channel videos
      const videosResponse = await apiClient.get("/videos/search", {
        params: { userId }
      });
      const data = videosResponse.data.data;
      const videos: VideoData[] = Array.isArray(data) ? data : (data.videos || []);
      
      setAllVideos(videos);

      // Filter only published videos for analytics (exclude drafts)
      const publishedVideos = videos.filter(v => v.isPublished);
      const draftVideos = videos.filter(v => !v.isPublished);

      // Calculate analytics for published videos only
      const totalViews = publishedVideos.reduce((acc, v) => acc + (v?.views || 0), 0);
      const totalLikes = publishedVideos.reduce((acc, v) => acc + (v?.likesCount || 0), 0);
      const totalComments = publishedVideos.reduce((acc, v) => acc + (v?.commentsCount || 0), 0);
      const totalDuration = publishedVideos.reduce((acc, v) => acc + (v?.duration || 0), 0);
      
      // Calculate average view duration (assuming avg 60% watch time as estimate)
      const avgWatchPercentage = 0.6; // 60% average watch time
      const totalWatchTime = publishedVideos.reduce((acc, v) => {
        const estimatedWatchTime = (v?.duration || 0) * (v?.views || 0) * avgWatchPercentage;
        return acc + estimatedWatchTime;
      }, 0);
      
      const avgViewDuration = totalViews > 0 
        ? totalWatchTime / totalViews 
        : 0;

      // Generate last 7 days data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      // Views over time - simulate daily views distribution based on total views
      const viewsOverTime = last7Days.map((date, index) => {
        const videosOnDate = publishedVideos.filter(v => 
          v.createdAt.split('T')[0] === date
        );
        
        // Estimate views for this day (newer videos get more recent views)
        const baseViews = publishedVideos.reduce((acc, v) => {
          const videoDate = new Date(v.createdAt);
          const targetDate = new Date(date);
          const daysSinceUpload = Math.floor((targetDate.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceUpload >= 0 && daysSinceUpload < 30) {
            // Distribute views with decay factor
            const decayFactor = Math.max(0.1, 1 - (daysSinceUpload * 0.03));
            return acc + Math.floor((v.views || 0) * decayFactor * 0.1);
          }
          return acc;
        }, 0);

        const newVideos = videosOnDate.length;
        const likes = videosOnDate.reduce((acc, v) => acc + (v.likesCount || 0), 0);
        const comments = videosOnDate.reduce((acc, v) => acc + (v.commentsCount || 0), 0);

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: Math.max(baseViews, newVideos * 10),
          engagement: likes + comments,
          newVideos,
        };
      });

      // Top videos (published only)
      const topVideos = publishedVideos
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(v => ({
          id: v._id,
          title: v.title.length > 25 ? v.title.substring(0, 25) + '...' : v.title,
          fullTitle: v.title,
          views: v.views || 0,
          likes: v.likesCount || 0,
          comments: v.commentsCount || 0,
          duration: v.duration || 0,
          engagementRate: v.views > 0 
            ? (((v.likesCount || 0) + (v.commentsCount || 0)) / v.views * 100).toFixed(1)
            : 0,
        }));

      // Video distribution by views
      const viewRanges = [
        { name: '0-100', min: 0, max: 100, count: 0 },
        { name: '100-500', min: 100, max: 500, count: 0 },
        { name: '500-1K', min: 500, max: 1000, count: 0 },
        { name: '1K-5K', min: 1000, max: 5000, count: 0 },
        { name: '5K+', min: 5000, max: Infinity, count: 0 },
      ];

      publishedVideos.forEach(v => {
        const views = v.views || 0;
        const range = viewRanges.find(r => views >= r.min && views < r.max);
        if (range) range.count++;
      });

      const videoDistribution = viewRanges
        .filter(r => r.count > 0)
        .map(r => ({ name: r.name, value: r.count }));

      setAnalytics({
        overview: {
          totalViews,
          totalVideos: videos.length,
          publishedVideos: publishedVideos.length,
          draftVideos: draftVideos.length,
          totalLikes,
          totalComments,
          subscribersCount: channel.subscribers?.length || 0,
          avgViewDuration,
          totalWatchTime,
        },
        viewsOverTime,
        engagementOverTime: viewsOverTime,
        topVideos,
        videoDistribution,
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [channel._id, channel.owner, channel.subscribers]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Get individual video analytics
  const getVideoAnalytics = (videoId: string): VideoAnalytics | null => {
    const video = allVideos.find(v => v._id === videoId);
    if (!video) return null;

    const engagementRate = video.views > 0 
      ? ((video.likesCount || 0) + (video.commentsCount || 0)) / video.views * 100
      : 0;
    
    const avgViewDuration = (video.duration || 0) * 0.6; // Estimate 60% watch time

    return {
      video,
      engagementRate,
      avgViewDuration,
    };
  };

  const selectedVideoAnalytics = selectedVideoId !== "all" 
    ? getVideoAnalytics(selectedVideoId) 
    : null;

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <h2 className="text-3xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Track your channel&apos;s performance</p>
        </div>
        
        {/* Video Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View analytics for:</span>
          <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Videos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Published Videos</SelectItem>
              {allVideos.filter(v => v.isPublished).map(video => (
                <SelectItem key={video._id} value={video._id}>
                  {video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Individual Video Analytics */}
      {selectedVideoAnalytics && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              {selectedVideoAnalytics.video.thumbnail && (
                <img 
                  src={toBackendAssetUrl(selectedVideoAnalytics.video.thumbnail)}
                  alt={selectedVideoAnalytics.video.title}
                  className="w-32 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-xl">{selectedVideoAnalytics.video.title}</CardTitle>
                <CardDescription className="mt-1">
                  Published {new Date(selectedVideoAnalytics.video.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={selectedVideoAnalytics.video.isPublished ? "default" : "secondary"}>
                {selectedVideoAnalytics.video.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{formatViewCount(selectedVideoAnalytics.video.views)}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <ThumbsUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{selectedVideoAnalytics.video.likesCount || 0}</div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <MessageSquare className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{selectedVideoAnalytics.video.commentsCount || 0}</div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{selectedVideoAnalytics.engagementRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Engagement Rate</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Video Duration</span>
                </div>
                <div className="text-lg font-semibold">{formatDuration(selectedVideoAnalytics.video.duration)}</div>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg. View Duration</span>
                </div>
                <div className="text-lg font-semibold">{formatDuration(selectedVideoAnalytics.avgViewDuration)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats (All Videos) */}
      {selectedVideoId === "all" && (
        <>
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
                <p className="text-xs text-muted-foreground">From published videos only</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.overview.publishedVideos}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (+{analytics.overview.draftVideos} drafts)
                  </span>
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
                  {(analytics.overview.totalLikes + analytics.overview.totalComments).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.totalLikes} likes • {analytics.overview.totalComments} comments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.overview.subscribersCount}
                </div>
                <p className="text-xs text-muted-foreground">Total subscribers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. View Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(analytics.overview.avgViewDuration)}
                </div>
                <p className="text-xs text-muted-foreground">Average watch time per view</p>
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
                <p className="text-xs text-muted-foreground">From all published videos</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="views" className="space-y-6">
            <TabsList>
              <TabsTrigger value="views">Views & Engagement</TabsTrigger>
              <TabsTrigger value="top">Top Videos</TabsTrigger>
              <TabsTrigger value="distribution">Video Distribution</TabsTrigger>
            </TabsList>

            <TabsContent value="views" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Views & Engagement Trend</CardTitle>
                  <CardDescription>Last 7 days performance (published videos only)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.viewsOverTime}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                        name="Views"
                      />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorEngagement)"
                        name="Engagement"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Videos</CardTitle>
                  <CardDescription>Your most viewed published content</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Video className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No published video data available</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.topVideos} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" />
                          <YAxis dataKey="title" type="category" width={150} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="views" fill="#8884d8" name="Views" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="likes" fill="#82ca9d" name="Likes" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Top Videos Table */}
                      <div className="space-y-2">
                        {analytics.topVideos.map((video, index) => (
                          <div 
                            key={video.id} 
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedVideoId(video.id)}
                          >
                            <span className="text-2xl font-bold text-muted-foreground w-8">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{video.fullTitle}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDuration(video.duration)} • {video.engagementRate}% engagement
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatViewCount(video.views)} views</p>
                              <p className="text-sm text-muted-foreground">
                                {video.likes} likes • {video.comments} comments
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Video Performance Distribution</CardTitle>
                  <CardDescription>How your published videos are performing by view count</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.videoDistribution.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <PieChartIcon className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No published video data available</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.videoDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => 
                              `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.videoDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
