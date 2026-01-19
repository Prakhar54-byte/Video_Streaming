'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistQueueStore } from '@/store/playlistQueueStore';
import apiClient from '@/lib/api';
import { formatViewCount, formatTimeAgo } from '@/lib/utils';
import Image from 'next/image';
import { VideoJsPlayer } from '@/components/video/VideoJsPlayer';
import { LiveAudioWaveform } from '@/components/video/LiveAudioWaveform';
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal';
import { ThumbsUp, ThumbsDown, Share2, Bell, BellOff, Eye, Video, Trash2, ListVideo, SkipForward, SkipBack, Shuffle, MoreVertical, Clock, Plus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  hlsMasterPlaylist?: string;
  waveformUrl?: string;
  spriteSheetUrl?: string;
  spriteSheetVttUrl?: string;
  introStartTime?: number;
  introEndTime?: number;
  category?: string;
  metadata?: {
    codec?: string;
    format?: string;
    fps?: number;
    aspectRatio?: string;
    audioCodec?: string;
    audioChannels?: number;
    originalWidth?: number;
    originalHeight?: number;
    originalSize?: number;
    originalBitrate?: number;
  };
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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  // Playlist queue store
  const { 
    playlistId: queuePlaylistId, 
    playlistName,
    queue, 
    currentIndex, 
    isShuffled,
    isManualQueue,
    setCurrentIndex,
    nextVideo: getNextVideo,
    previousVideo: getPreviousVideo,
    toggleShuffle,
    hasNext,
    hasPrevious,
    clearQueue,
    addToQueue,
    removeFromQueue,
    isInQueue,
  } = usePlaylistQueueStore();
  
  // Check if we're in playlist mode - only when ?playlist= query param is present
  // This ensures playlist UI only shows when coming from playlist page, not on direct video navigation
  const playlistParam = searchParams.get('playlist');
  const isPlaylistMode = playlistParam !== null && queuePlaylistId !== null && playlistParam === queuePlaylistId;
  
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Video playback state for waveform
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const seekToRef = useRef<((time: number) => void) | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const backendOrigin = (() => {
    const base = (apiClient.defaults.baseURL || '').toString();
    if (base) return base.replace(/\/api\/v1\/?$/, '');
    const envBase = (process.env.NEXT_PUBLIC_BACKEND_URL || '').toString();
    if (envBase) return envBase.replace(/\/api\/v1\/?$/, '');
    if (API_URL) return API_URL.replace(/\/api\/v1\/?$/, '');
    return 'http://localhost:8000';
  })();

  const toUrl = (maybePath?: string) => {
    if (!maybePath) return '';
    // If backend already returned an absolute URL, use it.
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const normalized = maybePath.replace(/\\/g, '/').replace(/^\//, '');
    const withoutPublic = normalized.startsWith('public/') ? normalized.slice('public/'.length) : normalized;
    return `${backendOrigin}/${withoutPublic}`;
  };
  

  

  const fetchVideo = useCallback(async () => {
    try {
      const response = await apiClient.get(`/videos/${params.id}`);
      setVideo(response.data.data);
      console.log("Response",response.data);
      
    } catch (error) {
      toast({
        title: 'Error loading video',
        variant: 'destructive',
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [params.id, router, toast]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await apiClient.get(`/comments/${params.id}`);
      
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [params.id]);

  const checkSubscription = useCallback(async (channelId: string) => {
    if (!user?._id) return;
    try {
      const response = await apiClient.get(`/subscriptions/u/${user._id}`);
      const subscriptions = response.data.data || [];
      setIsSubscribed(subscriptions.some((sub: any) => sub.channel?._id === channelId));
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user?._id]);

  const checkLikeStatus = useCallback(async () => {
    try {
      // Get all liked videos for the user
      const response = await apiClient.get(`/likes/videos`);
      const likedVideos = response.data.data || [];
      
      const isVideoLiked = likedVideos?.videos.some((v: any) => v._id === params.id);
      setIsLiked(isVideoLiked);
    } catch (error) {
      console.error('Error checking like status:', error);
      // Non-critical, continue without like status
    }
  }, [params.id]);

  const addToWatchHistory = useCallback(async () => {
    try {
      await apiClient.post(`/videos/watchhis/${params.id}`);
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  }, [params.id]);

  const fetchRelatedVideos = useCallback(async () => {
    if (!video?._id) return;
    setLoadingRelated(true);
    try {
      const [videosResponse, subsResponse] = await Promise.all([
        apiClient.get('/videos'),
        user?._id ? apiClient.get(`/subscriptions/u/${user._id}`) : Promise.resolve({ data: { data: [] } }),
      ]);

      let allVideos: Video[] = (videosResponse.data.data || videosResponse.data || []) as Video[];
      allVideos = Array.isArray(allVideos) ? allVideos : [];
      
      // Exclude current video
      allVideos = allVideos.filter((v) => v?._id && v._id !== video._id);
      
      // If in playlist mode, exclude all playlist videos and filter by majority category
      if (isPlaylistMode && queue.length > 0) {
        const playlistVideoIds = new Set(queue.map(v => v._id));
        allVideos = allVideos.filter((v) => !playlistVideoIds.has(v._id));
        
        // Find majority category from playlist
        const categoryCounts: Record<string, number> = {};
        queue.forEach(v => {
          const cat = v.category || 'all';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        // Get the most common category (excluding 'all' if there are other categories)
        const sortedCategories = Object.entries(categoryCounts)
          .filter(([cat]) => cat !== 'all')
          .sort((a, b) => b[1] - a[1]);
        
        const majorityCategory = sortedCategories[0]?.[0] || 'all';
        
        // Filter by majority category if it's not 'all'
        if (majorityCategory !== 'all') {
          const categoryVideos = allVideos.filter(v => v.category === majorityCategory);
          if (categoryVideos.length >= 3) {
            allVideos = categoryVideos;
          }
        }
      }

      const subscriptions = subsResponse?.data?.data || [];
      const subscribedChannelIds = new Set(
        Array.isArray(subscriptions)
          ? subscriptions.map((sub: any) => sub?.channel?._id).filter(Boolean)
          : []
      );

      const subscribedVideos = allVideos.filter((v) => subscribedChannelIds.has(v.owner?._id));
      const sameChannelVideos = allVideos.filter(
        (v) => v.owner?._id === video.owner?._id && !subscribedChannelIds.has(v.owner?._id)
      );
      const otherVideos = allVideos.filter(
        (v) => v.owner?._id !== video.owner?._id && !subscribedChannelIds.has(v.owner?._id)
      );

      const byRecent = (a: Video, b: Video) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      subscribedVideos.sort(byRecent);
      sameChannelVideos.sort(byRecent);
      otherVideos.sort(byRecent);

      setRelatedVideos([...subscribedVideos, ...sameChannelVideos, ...otherVideos].slice(0, 10));
    } catch (error) {
      console.error('Error fetching related videos:', error);
      setRelatedVideos([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [user?._id, video?._id, video?.owner?._id, isPlaylistMode, queue]);

  // Update current index when video changes (for playlist mode)
  useEffect(() => {
    if (isPlaylistMode && queue.length > 0) {
      const idx = queue.findIndex(v => v._id === params.id);
      if (idx >= 0 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, queue, isPlaylistMode]);

  // Handle video end - auto-play next in playlist
  const handleVideoEnd = useCallback(() => {
    if (isPlaylistMode && hasNext()) {
      const nextVid = getNextVideo();
      if (nextVid) {
        router.push(`/video/${nextVid._id}?playlist=${queuePlaylistId}`);
      }
    }
  }, [isPlaylistMode, hasNext, getNextVideo, router, queuePlaylistId]);

  const handleNextVideo = () => {
    if (hasNext()) {
      const nextVid = getNextVideo();
      if (nextVid) {
        router.push(`/video/${nextVid._id}?playlist=${queuePlaylistId}`);
      }
    }
  };

  const handlePreviousVideo = () => {
    if (hasPrevious()) {
      const prevVid = getPreviousVideo();
      if (prevVid) {
        router.push(`/video/${prevVid._id}?playlist=${queuePlaylistId}`);
      }
    }
  };

  // Handle adding video to queue
  const handleAddToQueue = (v: Video) => {
    addToQueue({
      _id: v._id,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      views: v.views,
      category: v.category,
      owner: v.owner,
    });
    toast({
      title: 'Added to queue',
      description: v.title,
    });
  };

  // Handle saving to Watch Later playlist
  const handleSaveToWatchLater = async (videoId: string) => {
    if (!user?._id) {
      router.push('/auth/login');
      return;
    }
    
    try {
      // First, try to get or create Watch Later playlist
      const playlistsResponse = await apiClient.get(`/playlists/user/${user._id}`);
      const playlists = playlistsResponse.data.data || [];

      console.log("Fuck play",playlists);
      
      
      let watchLaterPlaylist = playlists.find((p: any) => p.name === 'Watch Later');
      
      if (!watchLaterPlaylist) {
        // Create Watch Later playlist
        const createResponse = await apiClient.post('/playlist', {
          name: 'Watch Later',
          description: 'Videos to watch later',
        });
        watchLaterPlaylist = createResponse.data.data;
      }
      
      // Add video to Watch Later playlist
      await apiClient.patch(`/playlist/add/${videoId}/${watchLaterPlaylist._id}`);
      
      toast({
        title: 'Saved to Watch Later',
      });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
        toast({
          title: 'Already in Watch Later',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error saving video',
          variant: 'destructive',
        });
      }
    }
  };

const handleSubscribe = async () => {
    if (!video) return;
    if (!user?._id) {
      router.push('/auth/login');
      return;
    }
    try {
      const wasSubscribed = isSubscribed;
      await apiClient.post(`/subscriptions/c/${video.owner._id}`);
      setIsSubscribed(!wasSubscribed);
      toast({
        title: wasSubscribed ? 'Unsubscribed' : 'Subscribed successfully!',
      });

      // Re-sync after backend toggle.
      setTimeout(() => {
        if (video?.owner?._id) checkSubscription(video.owner._id);
      }, 300);
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
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
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      toast({
        title: 'Error liking video',
        variant: 'destructive',
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
      setNewComment('');
      toast({ title: 'Comment posted!' });
    } catch (error) {
      toast({
        title: 'Error posting comment',
        variant: 'destructive',
      });
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await apiClient.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      toast({ title: "Comment deleted" });
    } catch (error) {
      toast({ title: "Error deleting comment", variant: "destructive" });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard!' });
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
            {video.processingStatus === 'processing' && (
               <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg flex items-center gap-2">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                 <span className="text-sm">Video is currently processing. Quality might be limited.</span>
               </div>
            )}
            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden">
              {(video.videoFile || video.hlsMasterPlaylist) ? (
                <VideoJsPlayer
                  src={toUrl(video.hlsMasterPlaylist || video.videoFile)}
                  fallbackSrc={video.hlsMasterPlaylist ? toUrl(video.videoFile) : undefined}
                  poster={video.thumbnail ? toUrl(video.thumbnail) : undefined}
                  autoPlay
                  spriteSheetVttUrl={video.spriteSheetVttUrl ? toUrl(video.spriteSheetVttUrl) : undefined}
                  introStartTime={video.introStartTime}
                  introEndTime={video.introEndTime}
                  videoWidth={video?.metadata?.originalWidth}
                  videoHeight={video?.metadata?.originalHeight}
                  aspectRatioMode="auto"
                  onTimeUpdate={(time, duration) => {
                    setCurrentTime(time);
                    setVideoDuration(duration);
                  }}
                  onPlayerReady={(seekFn) => {
                    seekToRef.current = seekFn;
                  }}
                  onVideoElementReady={(el) => {
                    setVideoElement(el);
                  }}
                  onPlayStateChange={(playing) => {
                    setIsPlaying(playing);
                  }}
                  onVolumeChange={(vol) => {
                    setVolume(vol);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <p className="text-muted-foreground">
                    {video.processingStatus === 'failed' ? 'Video processing failed.' : 'Video is processing...'}
                  </p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{video.title}</h1>
              
              {/* Live Audio Waveform */}
              <LiveAudioWaveform
                videoElement={videoElement}
                duration={videoDuration || video.duration || 0}
                currentTime={currentTime}
                isPlaying={isPlaying}
                volume={volume}
                onSeek={(time) => {
                  if (seekToRef.current) {
                    seekToRef.current(time);
                  }
                }}
                compact
                className="border-0 shadow-none bg-muted/50"
              />

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
                    variant={isLiked ? 'default' : 'outline'}
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

                  <Button
                    onClick={() => setShowPlaylistModal(true)}
                    variant="outline"
                    className="flex items-center gap-2 text-base py-5"
                  >
                    <ListVideo className="w-5 h-5" />
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Add to Playlist Modal */}
            {video._id && (
              <AddToPlaylistModal
                videoId={video._id}
                isOpen={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
              />
            )}

            {/* Channel Info */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={video.owner?.avatar || '/placeholder/user-avatar.png'}
                    alt={video.owner?.username || 'User'}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{video.owner.fullName}</h3>
                    <p className="text-base text-muted-foreground">@{video.owner.username}</p>
                  </div>
                </div>

                {user?._id !== video.owner._id && (
                  <Button
                    onClick={handleSubscribe}
                    className={`flex items-center gap-2 text-base py-5 px-6 ${
                      isSubscribed
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500'
                    }`}
                  >
                    {isSubscribed ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{video.description}</p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{comments.length} Comments</h2>

              <div className="flex items-start gap-4">
                {user?.avatar ? (
                  <Image
                    src={user.avatar || '/placeholder/user-avatar.png'}
                    alt={user.username || 'User'}
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
                      onClick={() => setNewComment('')}
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
                      {postingComment ? 'Posting...' : 'Comment'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((comment, index) => (
                  <div key={comment._id || `comment-${index}`} className="flex gap-4">
                    {comment.owner?.avatar ? (
                      <Image
                        src={comment.owner.avatar}
                        alt={comment.owner?.username || 'User'}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                        {(comment.owner?.fullName || comment.owner?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{comment?.owner?.fullName || 'Unknown User'}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-base leading-relaxed">{comment.content}</p>
                    </div>
                    {user?._id === comment.owner?._id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteComment(comment._id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Playlist Queue & Related Videos */}
          <div className="space-y-6">
            {/* Playlist Queue Box */}
            {isPlaylistMode && queue.length > 0 && (
              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden">
                {/* Playlist Header */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ListVideo className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-white truncate">{playlistName || 'Playlist'}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleShuffle}
                      className={`h-8 px-2 ${isShuffled ? 'text-primary' : 'text-zinc-400'}`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {currentIndex + 1} / {queue.length} videos
                  </p>
                  {/* Navigation Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousVideo}
                      disabled={!hasPrevious()}
                      className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    >
                      <SkipBack className="w-4 h-4 mr-1" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextVideo}
                      disabled={!hasNext()}
                      className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    >
                      Next
                      <SkipForward className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                {/* Playlist Videos List */}
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                  {queue.map((v, idx) => (
                    <a
                      key={v._id}
                      href={`/video/${v._id}?playlist=${queuePlaylistId}`}
                      className={`flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors ${
                        idx === currentIndex ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <span className={`w-6 text-center text-sm font-medium ${
                        idx === currentIndex ? 'text-primary' : 'text-zinc-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="w-24 aspect-video rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                        {v.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={toUrl(v.thumbnail)}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium line-clamp-2 ${
                          idx === currentIndex ? 'text-white' : 'text-zinc-300'
                        }`}>
                          {v.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {Math.floor((v.duration || 0) / 60)}:{String(Math.floor((v.duration || 0) % 60)).padStart(2, '0')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Queue Box (when videos are added to queue manually) */}
            {isManualQueue && queue.length > 0 && (
              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden">
                {/* Queue Header */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ListVideo className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-white">Queue</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearQueue}
                      className="h-8 px-2 text-zinc-400 hover:text-red-400"
                      title="Clear queue"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {queue.length} video{queue.length !== 1 ? 's' : ''} in queue
                  </p>
                </div>
                
                {/* Queue Videos List */}
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                  {queue.map((v, idx) => (
                    <div
                      key={v._id}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <span className="w-6 text-center text-sm font-medium text-zinc-500">
                        {idx + 1}
                      </span>
                      <a href={`/video/${v._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-20 aspect-video rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                          {v.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={toUrl(v.thumbnail)}
                              alt={v.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 text-zinc-300">
                            {v.title}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {Math.floor((v.duration || 0) / 60)}:{String(Math.floor((v.duration || 0) % 60)).padStart(2, '0')}
                          </p>
                        </div>
                      </a>
                      <button
                        onClick={() => removeFromQueue(v._id)}
                        className="p-1.5 rounded-full hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from queue"
                      >
                        <X className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Videos Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {isPlaylistMode ? 'More Videos' : 'Related Videos'}
              </h2>

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
                <p className="text-base text-muted-foreground">No related videos found.</p>
              ) : (
                <div className="space-y-4">
                  {relatedVideos.map((v) => (
                    <div key={v._id} className="flex gap-3 group relative">
                      <a href={`/video/${v._id}`} className="flex gap-3 flex-1">
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
                          <p className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors pr-8">
                            {v.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 truncate">{v.owner?.fullName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatViewCount(v.views)} views • {formatTimeAgo(v.createdAt)}
                          </p>
                        </div>
                      </a>
                      
                      {/* 3-dot menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute top-0 right-0 p-1.5 rounded-full hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleSaveToWatchLater(v._id)}>
                            <Clock className="w-4 h-4 mr-2" />
                            Save to Watch Later
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAddToQueue(v)}
                            disabled={isInQueue(v._id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {isInQueue(v._id) ? 'Already in Queue' : 'Add to Queue'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
