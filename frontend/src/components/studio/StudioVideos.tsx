"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Video,
  Eye,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  Globe,
  Lock,
  Upload,
  Search,
  Filter,
} from "lucide-react";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { formatViewCount, formatTimeAgo } from "@/lib/utils";

interface Channel {
  _id: string;
  name: string;
}

interface StudioVideosProps {
  channel: Channel;
}

interface VideoItem {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
}

export function StudioVideos({ channel }: StudioVideosProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/videos/search", {
        params: { channelId: channel._id },
      });
      const videoData = response.data.data;
      setVideos(Array.isArray(videoData) ? videoData : []);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [channel._id]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDeleteClick = (video: VideoItem) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVideo) return;

    try {
      await apiClient.delete(`/videos/${selectedVideo._id}`);
      toast.success("Video deleted successfully");
      setDeleteDialogOpen(false);
      fetchVideos();
    } catch (error: any) {
      toast.error("Failed to delete video");
    }
  };

  const handleTogglePublish = async (video: VideoItem) => {
    try {
      await apiClient.patch(`/videos/toggle/publish/${video._id}`);
      toast.success(
        video.isPublished ? "Video unpublished" : "Video published",
      );
      fetchVideos();
    } catch (error: any) {
      toast.error("Failed to toggle publish status");
    }
  };

  const filteredVideos = Array.isArray(videos)
    ? videos.filter((video) => {
        const matchesSearch = video.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesTab =
          activeTab === "all" ||
          (activeTab === "published" && video.isPublished) ||
          (activeTab === "unpublished" && !video.isPublished);
        return matchesSearch && matchesTab;
      })
    : [];

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
          <h2 className="text-3xl font-bold">Content</h2>
          <p className="text-muted-foreground">Manage your videos</p>
        </div>
        <Button
          onClick={() => router.push("/upload")}
          size="lg"
          className="gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Video
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Video className="w-12 h-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">
                    {searchQuery ? "No videos found" : "No videos yet"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Upload your first video to get started"}
                  </p>
                </div>
                {!searchQuery && (
                  <Button onClick={() => router.push("/upload")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <Card
                  key={video._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Thumbnail */}
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail.replace("/public", "")}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {Math.floor(video.duration / 60)}:
                          {String(video.duration % 60).padStart(2, "0")}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {video.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {video.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {formatViewCount(video.views)} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTimeAgo(video.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                video.isPublished ? "default" : "secondary"
                              }
                              className="gap-1"
                            >
                              {video.isPublished ? (
                                <>
                                  <Globe className="w-3 h-3" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  Draft
                                </>
                              )}
                            </Badge>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/video/${video._id}`)
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/video/${video._id}/edit`)
                                  }
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(video)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedVideo?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
