"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import { formatViewCount, formatTimeAgo } from "@/lib/utils";
import Image from "next/image";
import { VideoJsPlayer } from "@/components/video/VideoJsPlayer";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bell,
  BellOff,
  Eye,
  Video,
  Trash2,
} from "lucide-react";
// Removed server-only import

interface Video {
  _id: string;
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  processingStatus?: "pending" | "processing" | "completed" | "failed";
  hlsMasterPlaylist?: string; // Added for HLS support
  waveformUrl?: string; // Added for audio waveform display
  spriteSheetUrl?: string; // Added for seeking previews
  spriteSheetVttUrl?: string; // Added for seeking previews
  introStartTime?: number; // Added for skip intro
  introEndTime?: number; // Added for skip intro
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
  likesCount?: number;
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
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const backendOrigin = (() => {
    const base = (apiClient.defaults.baseURL || "").toString();
    if (base) return base.replace(/\/api\/v1\/?$/, "");
    const envBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "").toString();
    if (envBase) return envBase.replace(/\/api\/v1\/?$/, "");
    if (API_URL) return API_URL.replace(/\/api\/v1\/?$/, "");
    return "http://localhost:8000";
  })();

  const toUrl = (maybePath?: string) => {
    if (!maybePath) return "";
    // If backend already returned an absolute URL, use it.
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const normalized = maybePath.replace(/\\/g, "/").replace(/^\//, "");
    const withoutPublic = normalized.startsWith("public/")
      ? normalized.slice("public/".length)
      : normalized;
    return `${backendOrigin}/${withoutPublic}`;
  };

  const fetchVideo = useCallback(async () => {
    try {
      const response = await apiClient.get(`/videos/${params.id}`);
      setVideo(response.data.data);
      console.log("Response", response.data);
    } catch (error) {
      toast({
        title: "Error loading video",
        variant: "destructive",
      });
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [params.id, router, toast]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await apiClient.get(`/comments/${params.id}`);

      setComments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [params.id]);

  const checkSubscription = useCallback(
    async (channelId: string) => {
      if (!user?._id) return;
      try {
        const response = await apiClient.get(`/subscriptions/u/${user._id}`);
        const subscriptions = response.data.data || [];
        setIsSubscribed(
          subscriptions.some((sub: any) => sub.channel?._id === channelId),
        );
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    },
    [user?._id],
  );

  const checkLikeStatus = useCallback(async () => {
    try {
      // Get all liked videos for the user
      const response = await apiClient.get(`/likes/videos`);
      const likedVideos = response.data.data || [];

      const isVideoLiked = likedVideos?.videos.some(
        (v: any) => v._id === params.id,
      );
      setIsLiked(isVideoLiked);
    } catch (error) {
      console.error("Error checking like status:", error);
      // Non-critical, continue without like status
    }
  }, [params.id]);

  const addToWatchHistory = useCallback(async () => {
    try {
      await apiClient.post(`/videos/watchhis/${params.id}`);
    } catch (error) {
      console.error("Error adding to watch history:", error);
    }
  }, [params.id]);

  const fetchRelatedVideos = useCallback(async () => {
    if (!video?._id) return;
    setLoadingRelated(true);
    try {
      const [videosResponse, subsResponse] = await Promise.all([
        apiClient.get("/videos"),
        user?._id
          ? apiClient.get(`/subscriptions/u/${user._id}`)
          : Promise.resolve({ data: { data: [] } }),
      ]);

      let allVideos: Video[] = (videosResponse.data.data ||
        videosResponse.data ||
        []) as Video[];
      allVideos = Array.isArray(allVideos) ? allVideos : [];
      allVideos = allVideos.filter((v) => v?._id && v._id !== video._id);

      const checking = video.hlsMasterPlaylist;

      console.log("URL: ", toUrl(checking));

      const subscriptions = subsResponse?.data?.data || [];
      const subscribedChannelIds = new Set(
        Array.isArray(subscriptions)
          ? subscriptions.map((sub: any) => sub?.channel?._id).filter(Boolean)
          : [],
      );

      const thum = toUrl(video.thumbnail);
      console.log("Thumbnail URL: ", thum);

      const subscribedVideos = allVideos.filter((v) =>
        subscribedChannelIds.has(v.owner?._id),
      );
      const sameChannelVideos = allVideos.filter(
        (v) =>
          v.owner?._id === video.owner?._id &&
          !subscribedChannelIds.has(v.owner?._id),
      );
      const otherVideos = allVideos.filter(
        (v) =>
          v.owner?._id !== video.owner?._id &&
          !subscribedChannelIds.has(v.owner?._id),
      );

      const byRecent = (a: Video, b: Video) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      subscribedVideos.sort(byRecent);
      sameChannelVideos.sort(byRecent);
      otherVideos.sort(byRecent);

      setRelatedVideos(
        [...subscribedVideos, ...sameChannelVideos, ...otherVideos].slice(
          0,
          10,
        ),
      );
    } catch (error) {
      console.error("Error fetching related videos:", error);
      setRelatedVideos([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [user?._id, video?._id, video?.hlsMasterPlaylist, video?.owner?._id]);

  const handleSubscribe = async () => {
    if (!video) return;
    if (!user?._id) {
      router.push("/auth/login");
      return;
    }
    try {
      const wasSubscribed = isSubscribed;
      await apiClient.post(`/subscriptions/c/${video.owner._id}`);
      setIsSubscribed(!wasSubscribed);
      toast({
        title: wasSubscribed ? "Unsubscribed" : "Subscribed successfully!",
      });

      // Re-sync after backend toggle.
      setTimeout(() => {
        if (video?.owner?._id) checkSubscription(video.owner._id);
      }, 300);
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchComments();
      addToWatchHistory();
    }
  }, [params.id, addToWatchHistory, fetchComments, fetchVideo]);

  useEffect(() => {
    // Subscription depends on both the logged-in user and the loaded video owner.
    if (!user?._id || !video?.owner?._id) {
      setIsSubscribed(false);
      return;
    }

    checkSubscription(video.owner._id);
  }, [user?._id, video?.owner?._id, checkSubscription]);

  useEffect(() => {
    // Related videos should refresh when video changes or user subscriptions change.
    if (!video?._id) return;
    fetchRelatedVideos();
  }, [video?._id, fetchRelatedVideos]);

  useEffect(() => {
    if (video) {
      checkLikeStatus();
      setLikesCount(video.likesCount || 0);
    }
  }, [video, checkLikeStatus]);

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

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await apiClient.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
      toast({ title: "Comment deleted" });
    } catch (error) {
      toast({ title: "Error deleting comment", variant: "destructive" });
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
              {video.videoFile || video.hlsMasterPlaylist ? (
                <VideoJsPlayer
                  src={toUrl(video.hlsMasterPlaylist || video.videoFile)}
                  fallbackSrc={
                    video.hlsMasterPlaylist ? toUrl(video.videoFile) : undefined
                  }
                  poster={video.thumbnail ? toUrl(video.thumbnail) : undefined}
                  autoPlay
                  spriteSheetVttUrl={
                    video.spriteSheetVttUrl
                      ? toUrl(video.spriteSheetVttUrl)
                      : undefined
                  }
                  introStartTime={video.introStartTime}
                  introEndTime={video.introEndTime}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <p className="text-muted-foreground">
                    {video.processingStatus === "failed"
                      ? "Video processing failed."
                      : "Video is processing..."}
                  </p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{video.title}</h1>

              {video.waveformUrl && (
                <div className="w-full bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={toUrl(video.waveformUrl)}
                    alt="Audio Waveform"
                    width={1200}
                    height={120}
                    className="w-full h-auto object-cover"
                    unoptimized
                  />
                </div>
              )}

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
                    {user?._id === comment.owner?._id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Related Videos</h2>

            {loadingRelated ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-40 aspect-video bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : relatedVideos.length === 0 ? (
              <p className="text-base text-muted-foreground">
                No related videos found.
              </p>
            ) : (
              <div className="space-y-4">
                {relatedVideos.map((v) => (
                  <a
                    key={v._id}
                    href={`/video/${v._id}`}
                    className="flex gap-3 group"
                  >
                    <div className="w-40 rounded-lg overflow-hidden bg-muted aspect-video flex-shrink-0">
                      {v.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toUrl(v.thumbnail)}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {v.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {v.owner?.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatViewCount(v.views)} views •{" "}
                        {formatTimeAgo(v.createdAt)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
