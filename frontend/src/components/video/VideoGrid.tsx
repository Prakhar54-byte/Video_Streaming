import { useCallback, useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { Play, Eye, Clock, Bell, MoreVertical, CheckCircle2 } from "lucide-react";
import { formatViewCount, formatTimeAgo, toBackendAssetUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProcessingOverlay } from "@/components/video/VideoProcessingStatus";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: number;
  views: number;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
  previewAnimationUrl?: string; // Added for animated WebP previews
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  categories?: string[]; // Video categories for filtering
}

interface VideoGridProps {
  subscribedOnly?: boolean;
  sortBy?: 'recent' | 'views' | 'duration';
  channelId?: string;
  category?: string; // Category filter
}

const VideoCard = ({ video, isSubscribed, isAboveFold }: { video: Video, isSubscribed: boolean, isAboveFold: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout>(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (video.previewAnimationUrl) {
           hoverTimeoutRef.current = setTimeout(() => {
               setIsPlayingPreview(true);
           }, 300); // 300ms delay before playing preview
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsPlayingPreview(false);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    return (
        <div className="group flex flex-col gap-3">
             {/* Thumbnail Section */}
             <Link href={`/video/${video._id}`} className="block relative aspect-video rounded-xl overflow-hidden bg-muted outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary">
                 <div 
                    className="relative w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                 >
                     {/* Base Thumbnail */}
                     {video.thumbnail ? (
                         <Image 
                             src={toBackendAssetUrl(video.thumbnail)}
                             alt={video.title}
                             fill
                             className={`object-cover transition-opacity duration-300 ${isPlayingPreview ? 'opacity-0' : 'opacity-100'}`}
                             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                             priority={isAboveFold}
                         />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-secondary">
                             <Play className="w-12 h-12 text-muted-foreground opacity-50" />
                         </div>
                     )}

                     {/* Animated Preview Overlay */}
                     {isPlayingPreview && video.previewAnimationUrl && (
                         <div className="absolute inset-0 bg-black animate-in fade-in duration-300">
                             <img 
                                 src={video.previewAnimationUrl} 
                                 alt="Preview" 
                                 className="w-full h-full object-cover"
                             />
                         </div>
                     )}
                     
                     {/* Processing Overlay - Using component for consistent UI */}
                     {video.processingStatus && video.processingStatus !== 'completed' && (
                         <ProcessingOverlay status={video.processingStatus} />
                     )}

                     {/* Duration Badge */}
                     <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs font-medium text-white shadow-sm border border-white/10">
                         {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                     </div>
                 </div>
             </Link>

             {/* Info Section */}
             <div className="flex gap-3 items-start px-0.5">
                 {/* Avatar */}
                 <Link href={`/channel/${video.owner._id}`} className="flex-shrink-0 mt-0.5">
                     <Avatar className="w-9 h-9 border border-border/50 transition-transform group-hover:scale-110">
                         <AvatarImage src={toBackendAssetUrl(video.owner.avatar)} alt={video.owner.username} />
                         <AvatarFallback>{video.owner.username[0]?.toUpperCase()}</AvatarFallback>
                     </Avatar>
                 </Link>

                 {/* Text Info */}
                 <div className="flex flex-col flex-1 min-w-0">
                     <Link href={`/video/${video._id}`} className="group/title block">
                         <h3 className="font-semibold text-base leading-snug line-clamp-2 text-foreground group-hover/title:text-primary transition-colors">
                             {video.title}
                         </h3>
                     </Link>
                     
                     <Link href={`/channel/${video.owner._id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 flex items-center gap-1 w-fit">
                         {video.owner.fullName}
                         {isSubscribed && (
                             <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
                         )}
                     </Link>

                     <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                         <span>{formatViewCount(video.views)} views</span>
                         <span className="text-[10px]">•</span>
                         <span>{formatTimeAgo(video.createdAt)}</span>
                     </div>
                 </div>

                 {/* More Options (Placeholder) */}
                 <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-full -mr-2">
                     <MoreVertical className="w-4 h-4 text-foreground" />
                 </button>
             </div>
        </div>
    )
}

export function VideoGrid({ subscribedOnly = false, sortBy = 'recent', channelId, category = 'all' }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  const fetchVideosWithSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch subscribed channels
      let subscribedChannelIds: string[] = [];
      if (user) {
        try {
          const subsResponse = await apiClient.get(`/subscriptions/u/${user._id}`);
          subscribedChannelIds = subsResponse.data.data?.map((sub: any) => sub.channel._id) || [];
          setSubscribedChannels(new Set(subscribedChannelIds));
        } catch (error) {
          console.error("Error fetching subscriptions:", error);
        }
      }
      
      // Fetch videos with category filter
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      const videosResponse = await apiClient.get(`/videos${params.toString() ? '?' + params.toString() : ''}`);
      let allVideos = videosResponse.data.data || videosResponse.data || [];
      allVideos = Array.isArray(allVideos) ? allVideos : [];
      
      // Filter by channel if channelId is provided
      if (channelId) {
        allVideos = allVideos.filter((video: Video) => video.owner?._id === channelId);
      }
      
      // Sort videos
      if (sortBy === 'views') {
        allVideos.sort((a: Video, b: Video) => b.views - a.views);
      } else if (sortBy === 'duration') {
        allVideos.sort((a: Video, b: Video) => b.duration - a.duration);
      } else {
        allVideos.sort((a: Video, b: Video) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      if (subscribedOnly) {
        if (subscribedChannelIds.length > 0) {
          const filteredVideos = allVideos.filter((video: Video) => 
            subscribedChannelIds.includes(video.owner?._id)
          );
          setVideos(filteredVideos);
        } else {
          setVideos([]);
        }
      } else {
        if (subscribedChannelIds.length > 0 && sortBy === 'recent') {
          const subscribedVideos = allVideos.filter((video: Video) => 
            subscribedChannelIds.includes(video.owner?._id)
          );
          const otherVideos = allVideos.filter((video: Video) => 
            !subscribedChannelIds.includes(video.owner?._id)
          );
          setVideos([...subscribedVideos, ...otherVideos]);
        } else {
          setVideos(allVideos);
        }
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  }, [channelId, sortBy, subscribedOnly, user, category]);

  useEffect(() => {
    fetchVideosWithSubscriptions();
  }, [fetchVideosWithSubscriptions]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVideosWithSubscriptions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchVideosWithSubscriptions]);

  const isSubscribedChannel = (ownerId: string) => {
    return subscribedChannels.has(ownerId);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-10 gap-x-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="bg-muted aspect-video rounded-xl"></div>
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-muted rounded-full shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-muted rounded w-4/5"></div>
                <div className="h-3 bg-muted rounded w-3/5"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0 && subscribedOnly) {
    return (
      <div className="text-center py-16 bg-card border rounded-xl shadow-sm">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Subscriptions Yet</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          Subscribe to channels to see their latest videos appear here.
        </p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 bg-card border rounded-xl shadow-sm">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Videos Found</h3>
        <p className="text-muted-foreground">
          Check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-10 gap-x-6 pb-12">
      {videos.map((video, index) => (
        <VideoCard 
            key={video._id} 
            video={video} 
            isSubscribed={isSubscribedChannel(video.owner?._id)} 
            isAboveFold={index < 8}
        />
      ))}
    </div>
  );
}