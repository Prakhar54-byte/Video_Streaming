"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Video, Users, Eye, ThumbsUp, MessageSquare, Upload, Settings, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";

interface ChannelStats {
  totalVideos: number;
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
}

interface Channel {
  _id: string;
  name: string;
  description: string;
  email: string;
  avatar: string;
  subscribersCount: number;
  videosCount: number;
  createdAt: string;
}

export default function ChannelDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [stats, setStats] = useState<ChannelStats>({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    totalLikes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        // Fetch channel data
        const channelResponse = await fetch("http://localhost:8000/api/v1/subscriptions/c/subscribed", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          if (channelData.data && channelData.data.length > 0) {
            setChannel(channelData.data[0].channel);
          }
        }

        // Mock stats for now - in real app, fetch from analytics endpoint
        setStats({
          totalVideos: 12,
          totalViews: 15420,
          totalSubscribers: 1250,
          totalLikes: 890,
        });

      } catch (error) {
        console.error("Error fetching channel data:", error);
        toast({
          title: "Error",
          description: "Failed to load channel data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">No Channel Found</h2>
            <p className="text-muted-foreground mb-6">You need to create a channel first.</p>
            <Button onClick={() => router.push("/channelDashboard/create")}>
              Create Channel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 hover:bg-primary/10 transition-colors duration-200" 
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Channel Dashboard</h1>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-7xl mx-auto">
        {/* Channel Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage src={channel.avatar} alt={channel.name} />
                <AvatarFallback className="text-2xl">
                  {channel.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">{channel.name}</h2>
                <p className="text-muted-foreground mb-4">{channel.description}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Badge variant="secondary" className={undefined}>
                    <Users className="h-4 w-4 mr-1" />
                    {stats.totalSubscribers} subscribers
                  </Badge>
                  <Badge variant="secondary" className={undefined}>
                    <Video className="h-4 w-4 mr-1" />
                    {stats.totalVideos} videos
                  </Badge>
                  <Badge variant="secondary" className={undefined}>
                    <Eye className="h-4 w-4 mr-1" />
                    {stats.totalViews.toLocaleString()} views
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Video</h3>
                  <p className="text-sm text-muted-foreground">Add new content to your channel</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-muted-foreground">View detailed performance metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Comments</h3>
                  <p className="text-sm text-muted-foreground">Manage viewer comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}