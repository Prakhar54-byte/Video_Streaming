"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";
import {
  Play,
  Eye,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  Globe,
  Lock,
  Upload,
  Video as VideoIcon,
  TrendingUp,
  Users,
  Settings,
  Scissors,
  Sparkles,
  Download,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatViewCount, formatTimeAgo, formatDuration } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFiles: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
}

interface Stats {
  totalVideos: number;
  totalViews: number;
  totalSubscribers: number;
}

export default function MyChannelPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { toast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    isPublished: true,
  });
  const [activeTab, setActiveTab] = useState("all");

  const fetchMyVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/videos/search", {
        params: { userId: user?._id },
      });
      const videoData = response.data.data;
      // Ensure videos is always an array
      const videoArray = Array.isArray(videoData) ? videoData : [];
      setVideos(videoArray);

      // Fetch stats after getting videos
      try {
        const userResponse = await apiClient.get("/users/current-user");
        const userData = userResponse.data.data;

        setStats({
          totalVideos: videoArray.length,
          totalViews: videoArray.reduce((acc, v) => acc + v.views, 0),
          totalSubscribers: userData.subscribersCount || 0,
        });
      } catch (statsError) {
        console.error("Error fetching stats:", statsError);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideos([]); // Set to empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch your videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?._id, toast]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated && user) {
      fetchMyVideos();
    }
  }, [isAuthenticated, isLoading, user, router, fetchMyVideos]);

  // Refresh on route change (when coming back from upload)
  useEffect(() => {
    if (isAuthenticated && user) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          fetchMyVideos();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () =>
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
    }
  }, [isAuthenticated, user, fetchMyVideos]);

  const handleEditClick = (video: Video) => {
    setSelectedVideo(video);
    setEditForm({
      title: video.title,
      description: video.description,
      isPublished: video.isPublished,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedVideo) return;

    try {
      await apiClient.patch(`/videos/${selectedVideo._id}`, editForm);
      toast({ title: "Video updated successfully" });
      setEditDialogOpen(false);
      fetchMyVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVideo) return;

    try {
      await apiClient.delete(`/videos/${selectedVideo._id}`);
      toast({ title: "Video deleted successfully" });
      setDeleteDialogOpen(false);
      fetchMyVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async (video: Video) => {
    try {
      await apiClient.patch(`/videos/toggle/publish/${video._id}`);
      toast({
        title: video.isPublished ? "Video unpublished" : "Video published",
      });
      fetchMyVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle publish status",
        variant: "destructive",
      });
    }
  };

  const handleProcessVideo = (video: Video) => {
    setSelectedVideo(video);
    setProcessDialogOpen(true);
  };

  const handleStartProcessing = async (action: string) => {
    if (!selectedVideo) return;

    try {
      await apiClient.post(`/video-processing/process/${selectedVideo._id}`, {
        action,
      });
      toast({
        title: "Processing started",
        description:
          "Your video is being processed. This may take a few minutes.",
      });
      setProcessDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start processing",
        variant: "destructive",
      });
    }
  };

  const filteredVideos = Array.isArray(videos)
    ? videos.filter((video) => {
        if (activeTab === "published") return video.isPublished;
        if (activeTab === "unpublished") return !video.isPublished;
        return true;
      })
    : [];

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
              Manage your videos and channel settings
            </p>
          </div>
          <Link href="/upload">
            <Button size="lg" className="gap-2">
              <Upload className="w-5 h-5" />
              Upload Video
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Videos
              </CardTitle>
              <VideoIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredVideos.filter((v) => v.isPublished).length} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatViewCount(stats.totalViews)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all videos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatViewCount(stats.totalSubscribers)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total followers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Videos Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All ({videos.length})</TabsTrigger>
            <TabsTrigger value="published">
              Published ({videos.filter((v) => v.isPublished).length})
            </TabsTrigger>
            <TabsTrigger value="unpublished">
              Unpublished ({videos.filter((v) => !v.isPublished).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredVideos.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <VideoIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first video to get started!
                  </p>
                  <Link href="/upload">
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredVideos.map((video) => (
                  <Card key={video._id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Thumbnail */}
                      <Link
                        href={`/video/${video._id}`}
                        className="relative w-full md:w-64 aspect-video shrink-0"
                      >
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                          {formatDuration(video.duration)}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors rounded-lg">
                          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>

                      {/* Video Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/video/${video._id}`}>
                              <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
                                {video.title}
                              </h3>
                            </Link>

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                  Video Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditClick(video)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTogglePublish(video)}
                                >
                                  {video.isPublished ? (
                                    <>
                                      <Lock className="w-4 h-4 mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="w-4 h-4 mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleProcessVideo(video)}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Process Video
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(video)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Video
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {video.description}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {formatViewCount(video.views)} views
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTimeAgo(video.createdAt)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {video.isPublished ? (
                                <>
                                  <Globe className="w-4 h-4 text-green-500" />
                                  <span className="text-green-500">
                                    Published
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4 text-orange-500" />
                                  <span className="text-orange-500">
                                    Private
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/video/${video._id}`)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Watch
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(video)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessVideo(video)}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Process
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Video Details</DialogTitle>
              <DialogDescription>
                Update your video information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Enter video title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Enter video description"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="publish">Publish Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this video public or private
                  </p>
                </div>
                <Switch
                  id="publish"
                  checked={editForm.isPublished}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, isPublished: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                video &quot;{selectedVideo?.title}&quot; and remove it from our
                servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Video Processing Dialog */}
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Video</DialogTitle>
              <DialogDescription>
                Choose a processing action for &quot;{selectedVideo?.title}
                &quot;
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleStartProcessing("hls")}
              >
                <TrendingUp className="w-8 h-8" />
                <span>Generate HLS</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleStartProcessing("thumbnail")}
              >
                <Image className="w-8 h-8" alt="thumbnail" src={""} />
                <span>Generate Thumbnails</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleStartProcessing("compress")}
              >
                <Download className="w-8 h-8" />
                <span>Compress</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleStartProcessing("trim")}
              >
                <Scissors className="w-8 h-8" />
                <span>Trim Video</span>
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setProcessDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
