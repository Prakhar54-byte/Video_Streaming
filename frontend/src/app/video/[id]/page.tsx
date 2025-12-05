"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import { formatViewCount, formatTimeAgo } from "@/lib/utils";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Share2, Bell, BellOff, Eye } from "lucide-react";

interface Video {
  _id: string;
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
}

interface Comment {
  _id: string;
  content: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
}

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchComments();
      checkSubscription();
      checkLikeStatus();
      addToWatchHistory();
    }
  }, [params.id]);

  const fetchVideo = async () => {
    try {
      const response = await apiClient.get(`/videos/${params.id}`);
      setVideo(response.data.data);
    } catch (error) {
      toast({
        title: "Error loading video",
        variant: "destructive",
      });
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await apiClient.get(`/comments/${params.id}`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkSubscription = async () => {
    if (!video) return;
    try {
      const response = await apiClient.get(`/subscriptions/u/${user?._id}`);
      const subscriptions = response.data.data || [];
      setIsSubscribed(
        subscriptions.some((sub: any) => sub.channel._id === video.owner._id),
      );
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const checkLikeStatus = async () => {
    try {
      // Get all liked videos for the user
      const response = await apiClient.get(
        `${user ? `/likes/videos/${user._id}` : `/likes/videos/`}`,
      );
      const likedVideos = response.data.data || [];
      console.log("Liked video", likedVideos);

      // const isVideoLiked = likedVideos.some((v: any) => v._id === params.id);
      // setIsLiked(isVideoLiked);
      // You can get likes count from video data
    } catch (error) {
      console.error("Error checking like status:", error);
      // Non-critical, continue without like status
    }
  };

  const addToWatchHistory = async () => {
    try {
      await apiClient.post(`/videos/watchhis/${params.id}`);
    } catch (error) {
      console.error("Error adding to watch history:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!video) return;
    try {
      await apiClient.post(`/subscriptions/c/${video.owner._id}`);
      setIsSubscribed(!isSubscribed);
      toast({
        title: isSubscribed ? "Unsubscribed" : "Subscribed successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    try {
      await apiClient.post(`/likes/video/${params.id}/toggle`);
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      toast({
        title: "Error liking video",
        variant: "destructive",
      });
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const response = await apiClient.post(`/comments/${params.id}`, {
        content: newComment,
      });
      setComments([response.data.data, ...comments]);
      setNewComment("");
      toast({ title: "Comment posted!" });
    } catch (error) {
      toast({
        title: "Error posting comment",
        variant: "destructive",
      });
    } finally {
      setPostingComment(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard!" });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <video
                src={video.videoFile}
                controls
                autoPlay
                className="w-full h-full"
                poster={video.thumbnail}
              />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{video.title}</h1>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-base text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {formatViewCount(video.views)} views
                  </span>
                  <span>•</span>
                  <span>{formatTimeAgo(video.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleLike}
                    variant={isLiked ? "default" : "outline"}
                    className="flex items-center gap-2 text-base py-5"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {likesCount}
                  </Button>

                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="flex items-center gap-2 text-base py-5"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Channel Info */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={video.owner?.avatar || "/placeholder/user-avatar.png"}
                    alt={video.owner?.username || "User"}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {video.owner.fullName}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      @{video.owner.username}
                    </p>
                  </div>
                </div>

                {user?._id !== video.owner._id && (
                  <Button
                    onClick={handleSubscribe}
                    className={`flex items-center gap-2 text-base py-5 px-6 ${
                      isSubscribed
                        ? "bg-muted text-foreground hover:bg-muted/80"
                        : "bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500"
                    }`}
                  >
                    {isSubscribed ? (
                      <BellOff className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </Button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{comments.length} Comments</h2>

              <div className="flex items-start gap-4">
                {user?.avatar ? (
                  <Image
                    src={user.avatar || "/placeholder/user-avatar.png"}
                    alt={user.username || "User"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted" />
                )}

                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-background border rounded-lg p-4 text-base min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end gap-3 mt-3">
                    <Button
                      onClick={() => setNewComment("")}
                      variant="outline"
                      disabled={postingComment}
                      className="text-base py-5"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || postingComment}
                      className="text-base py-5 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500"
                    >
                      {postingComment ? "Posting..." : "Comment"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-4">
                    <Image
                      src={
                        comment.owner?.avatar || "/placeholder/user-avatar.png"
                      }
                      alt={comment.owner?.username || "User"}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">
                          {comment.owner?.fullName || "Unknown User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-base leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Related Videos</h2>
            {/* Placeholder for related videos */}
            <p className="text-base text-muted-foreground">
              Related videos coming soon...
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
