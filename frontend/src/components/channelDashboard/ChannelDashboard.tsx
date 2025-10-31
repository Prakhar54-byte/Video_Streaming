"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Video, 
  Users, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Upload, 
  Settings, 
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Play,
  Edit,
  Trash2,
  MoreVertical,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tab";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/Dropdown-menu";
import { useToast } from "@/hooks/useToast.js";

interface ChannelStats {
  totalVideos: number;
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
  totalComments: number;
  watchTime: number;
  revenue: number;
  growth: {
    videos: number;
    views: number;
    subscribers: number;
    likes: number;
  };
}

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  isPublished: boolean;
}

interface Channel {
  _id: string;
  name: string;
  description: string;
  email: string;
  avatar: string;
  coverImage?: string;
  subscribersCount: number;
  videosCount: number;
  createdAt: string;
}

export default function ChannelDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<ChannelStats>({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    totalLikes: 0,
    totalComments: 0,
    watchTime: 0,
    revenue: 0,
    growth: {
      videos: 0,
      views: 0,
      subscribers: 0,
      likes: 0,
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
      

        // Fetch current user data to get channel info
        const userResponse = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/current-user`, {
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          method: "GET"
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Mock channel data based on user data
          setChannel({
            _id: userData.data._id,
            name: userData.data.fullName || userData.data.username,
            description: "Welcome to my channel! Here you'll find amazing content.",
            email: userData.data.email,
            avatar: userData.data.avatar,
            subscribersCount: 1250,
            videosCount: 12,
            createdAt: userData.data.createdAt
          });
          const channelId = userData.data._id;


          // Fetch channel details
          const channelResponse = await fetch(`${process.env.NEXTAUTH_SECRET}/channels/${channelId}`, {
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
          }
          )

          if(channelResponse.ok) {
            const channelData = await channelResponse.json();
            setChannel(prev => ({
              ...prev,
              coverImage: channelData.data.coverImage || "/default-cover.jpg",  
            }));
            if(!channelData.data || channelData.data.length === 0) {
              toast({
                title: "No Channel Found",
                description: "You need to create a channel first.",
                variant: "destructive",
              });
              router.push("/channelDashboard/create");
            }
          } else {
            console.error("Failed to fetch channel details");
          }

          
          // Fetch user's videos
          const videosResponse = await fetch(`http://localhost:8000/api/v1/videos?channelId=${channelId}page=1&limit=10&sortBy=createdAt&sortType=-1`, {
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
          });
          
          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            setVideos(videosData.data.videos || []);
          }
          
        }
        // Calculate stats from videos
        const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
        const totalLikes = videos.reduce((sum, video) => sum + video.likes, 0);
        const totalComments = videos.reduce((sum, video) => sum + video.comments, 0);

        setStats({
          totalVideos: videos.length,
          totalViews: totalViews ,
          totalSubscribers: channel?.subscribersCount || 0,
          totalLikes: totalLikes ,
          totalComments: totalComments ,
          watchTime: 45600, // in minutes
          revenue: 1250.50,
          growth: {
            videos: 2,
            views: 12,
            subscribers: 8,
            likes: 15,
          }
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
  }, [router, toast, videos.length]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || "0";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

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
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/channelDashboard/upload")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/channelDashboard/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-7xl mx-auto">
        {/* Channel Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <CardContent className="pt-6 -mt-16 relative">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={channel.avatar} alt={channel.name} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {channel.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{channel.name}</h2>
                <p className="text-muted-foreground mb-4 max-w-2xl">{channel.description}</p>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    <Users className="h-4 w-4 mr-1" />
                    {stats.totalSubscribers.toLocaleString()} subscribers
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Video className="h-4 w-4 mr-1" />
                    {stats.totalVideos} videos
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Eye className="h-4 w-4 mr-1" />
                    {stats.totalViews.toLocaleString()} views
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {formatTimeAgo(channel.createdAt)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{stats.growth.videos} from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{stats.growth.views}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{stats.growth.subscribers}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{stats.growth.likes}% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105">
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

              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105">
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

              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105">
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
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Videos</h3>
              <Button onClick={() => router.push("/channelDashboard/upload")}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>

            {videos.length > 0 ? (
              <div className="grid gap-4">
                {videos.map((video) => (
                  <Card key={video._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="relative w-40 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={video.thumbnail || "/placeholder.svg?height=96&width=160"} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold line-clamp-2 mb-2">{video.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {formatViews(video.views)} views
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {video.likes} likes
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {video.comments} comments
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeAgo(video.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant={video.isPublished ? "default" : "secondary"}>
                            {video.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Play className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                  <p className="text-muted-foreground mb-4">Upload your first video to get started</p>
                  <Button onClick={() => router.push("/channelDashboard/upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Watch Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{(stats.watchTime / 60).toFixed(1)}h</div>
                  <p className="text-sm text-muted-foreground">Total watch time this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">${stats.revenue.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Estimated revenue this month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average View Duration</span>
                    <span className="font-semibold">3:45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Click-through Rate</span>
                    <span className="font-semibold">4.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Subscriber Conversion</span>
                    <span className="font-semibold">2.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
                  <p className="text-muted-foreground">Comments from your videos will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}