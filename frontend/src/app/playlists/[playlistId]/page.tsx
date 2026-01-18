"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { usePlaylistStore } from "@/store/playlistStore";
import { usePlaylistQueueStore } from "@/store/playlistQueueStore";
import { useParams, useRouter } from "next/navigation";
import { VideoCard } from "@/components/video/VideoCard";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Share2, Shuffle, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { toBackendAssetUrl } from "@/lib/placeholder";
import { formatDuration } from "@/lib/utils";

// API base URL for images
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const toUrl = (path: string) => {
  if (!path) return "/placeholder/video.jpg";
  if (path.startsWith("http")) return path;
  // console.log("path",path);
  
  return `${API_BASE}/${path.replace(/^\//, "")}`;
};

// console.log("URL ",toUrl.toString);


export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const router = useRouter();
  const { getPlaylistById, removeVideoFromPlaylist, deletePlaylist, isLoading } = usePlaylistStore();
  const { setPlaylistQueue } = usePlaylistQueueStore();
  const [playlist, setPlaylist] = useState<any>(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [displayVideos, setDisplayVideos] = useState<any[]>([]);

  useEffect(() => {
    if (playlistId) {
      loadPlaylist();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  useEffect(() => {
    const videos = playlist?.videoDetails ?? [];
    setDisplayVideos(isShuffled 
      ? [...videos].sort(() => Math.random() - 0.5)
      : videos
    );
  }, [playlist?.videoDetails, isShuffled]);

  const loadPlaylist = async () => {
    const data = await getPlaylistById(playlistId);
    console.log("This fuck",data);
    
    if (!data) {
      toast.error("Playlist not found");
      router.push("/playlists");
      return;
    }
    setPlaylist(data);
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await removeVideoFromPlaylist(playlistId, videoId);
      toast.success("Video removed");
      loadPlaylist();
    } catch (error) {
      toast.error("Failed to remove video");
    }
  };

  const handleDeletePlaylist = async () => {
    if (confirm("Delete this playlist permanently?")) {
      try {
        await deletePlaylist(playlistId);
        toast.success("Playlist deleted");
        router.push("/playlists");
      } catch (error) {
        toast.error("Failed to delete playlist");
      }
    }
  };

  const handlePlayAll = () => {
    if (displayVideos.length === 0) {
      toast.error("No videos to play");
      return;
    }
    
    // Set up the playlist queue with all videos
    const videosForQueue = displayVideos.map((v: any) => ({
      _id: v._id,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration || 0,
      views: v.views,
      category: v.category,
      owner: v.owner,
    }));
    
    setPlaylistQueue(playlistId, playlist.name, videosForQueue, 0, isShuffled);
    
    // Navigate to first video
    const firstVideo = displayVideos[0];
    router.push(`/video/${firstVideo._id}?playlist=${playlistId}`);
  };

  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
    toast.success(isShuffled ? "Shuffle off" : "Shuffle on");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/playlists/${playlistId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (isLoading || !playlist) return (
      <MainLayout>
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
      </MainLayout>
  );

  const videos = playlist?.videoDetails ?? [];
  const totalDuration = videos.reduce((acc: number, v: any) => acc + (v.duration || 0), 0);

  

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: Playlist Info */}
        <div className="lg:w-80 flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl overflow-hidden shadow-lg">
                 {(playlist.videoDetails?.length ?? 0) > 0 && playlist.videoDetails?.[0]?.thumbnail ? (
                  
                  
                     <img 
                        src={toBackendAssetUrl(playlist.videoDetails[0].thumbnail)} 
                        alt="Playlist Cover" 
                        
                        className="object-cover"
                        
                     />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                       No videos
                     </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                 <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                   <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                       {playlist.videoDetails.length ?? 0} videos • {formatDuration(totalDuration)}
                   </div>
                 </div>
            </div>

            <div className="space-y-3">
                <h1 className="text-2xl font-bold leading-tight">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-muted-foreground text-sm">{playlist.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(playlist.updatedAt || playlist.createdAt), { addSuffix: true })}
                </p>
            </div>

            <div className="flex flex-col gap-2">
                 <Button 
                   className="w-full" 
                   size="lg"
                   onClick={handlePlayAll}
                   disabled={(playlist.videoDetails?.length ?? 0) === 0}
                 >
                    <Play className="mr-2 h-5 w-5 fill-current" /> Play All
                 </Button>
                 <div className="flex gap-2">
                   <Button 
                     variant={isShuffled ? "secondary" : "outline"} 
                     className="flex-1"
                     onClick={handleShuffle}
                   >
                     <Shuffle className={`mr-2 h-4 w-4 ${isShuffled ? "text-primary" : ""}`} /> 
                     Shuffle
                   </Button>
                   <Button variant="outline" size="icon" onClick={handleShare}>
                       <Share2 className="h-4 w-4" />
                   </Button>
                   <Button variant="outline" size="icon" onClick={handleDeletePlaylist}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                 </div>
            </div>
        </div>

        {/* Right Content: Video List */}
        <div className="flex-1 space-y-2">
             <div className="flex items-center justify-between mb-4 pb-2 border-b">
               <h2 className="font-semibold text-lg">Videos</h2>
               {isShuffled && (
                 <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Shuffled</span>
               )}
             </div>
             
             {displayVideos?.length === 0 ? (
                 <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl">
                   <Play className="w-12 h-12 mx-auto mb-4 opacity-30" />
                   <p>This playlist is empty.</p>
                   <p className="text-sm mt-2">Add videos from any video page using the &quot;Save&quot; button.</p>
                 </div>
             ) : (
                 <div className="flex flex-col">
                     {displayVideos.map((video: any, index: number) => (
                         <div 
                           key={video._id} 
                           className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg group transition-colors cursor-pointer"
                           onClick={() => {
                             // Set up the playlist queue starting from this video
                             const videosForQueue = displayVideos.map((v: any) => ({
                               _id: v._id,
                               title: v.title,
                               thumbnail: v.thumbnail,
                               duration: v.duration || 0,
                               views: v.views,
                               category: v.category,
                               owner: v.owner,
                             }));
                             setPlaylistQueue(playlistId, playlist.name, videosForQueue, index, isShuffled);
                             router.push(`/video/${video._id}?playlist=${playlistId}`);
                           }}
                         >
           
                             <div className="flex items-center gap-2 w-8">
                               <GripVertical className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                               <span className="text-muted-foreground text-sm font-medium">
                                   {index + 1}
                               </span>
                             </div>
                             
                             <div className="relative w-40 aspect-video rounded-md overflow-hidden bg-muted flex-shrink-0">
                               {video.thumbnail && (
                                 <img 
                                   src={toBackendAssetUrl(video?.thumbnail)}
                                   alt={video.title}
                                   
                                   className="object-cover"
                                   
                                 />
                               )}
                               <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                 {Math.floor((video.duration || 0) / 60)}:{String(Math.floor((video.duration || 0) % 60)).padStart(2, '0')}
                               </div>
                             </div>
                             
                             <div className="flex-1 min-w-0">
                               <h3 className="font-medium line-clamp-2 text-sm">{video.title}</h3>
                               <p className="text-xs text-muted-foreground mt-1">
                                 {playlist?.ownerDetails?.username || "Unknown"} • {video.views || 0} views
                               </p>
                             </div>
                             
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="opacity-0 group-hover:opacity-100 transition-opacity"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleRemoveVideo(video._id);
                               }}
                             >
                                 <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                             </Button>
                         </div>
                     ))}
                 </div>
             )}
        </div>

      </div>
    </MainLayout>
  );
}
