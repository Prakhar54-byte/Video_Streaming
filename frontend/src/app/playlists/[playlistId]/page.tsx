"use client";

import { useEffect, useState, use } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { usePlaylistStore } from "@/store/playlistStore";
import { useParams, useRouter } from "next/navigation";
import { VideoCard } from "@/components/video/VideoCard";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const router = useRouter();
  const { getPlaylistById, removeVideoFromPlaylist, deletePlaylist, isLoading } = usePlaylistStore();
  const [playlist, setPlaylist] = useState<any>(null);

  useEffect(() => {
    if (playlistId) {
      loadPlaylist();
    }
  }, [playlistId]);

  const loadPlaylist = async () => {
    const data = await getPlaylistById(playlistId);
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
      loadPlaylist(); // Reload to refresh list
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

  if (isLoading || !playlist) return (
      <MainLayout>
          <div className="flex h-screen items-center justify-center">Loading...</div>
      </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: Playlist Info */}
        <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
                 {playlist.videos.length > 0 ? (
                     <img 
                        src={playlist.videos[0].thumbnail} 
                        alt="Playlist Cover" 
                        className="w-full h-full object-cover"
                     />
                 ) : (
                     <div className="text-muted-foreground">No videos</div>
                 )}
                 <div className="absolute inset-0 bg-black/20" />
                 <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
                     {playlist.videos.length} videos
                 </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold">{playlist.name}</h1>
                <p className="text-muted-foreground">{playlist.description}</p>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                     <span>Updated {formatDistanceToNow(new Date(playlist.updatedAt), { addSuffix: true })}</span>
                </div>
            </div>

            <div className="flex gap-2">
                 <Button className="flex-1" size="lg">
                    <Play className="mr-2 h-5 w-5 fill-current" /> Play All
                 </Button>
                 <Button variant="outline" size="icon" onClick={handleDeletePlaylist}>
                     <Trash2 className="h-5 w-5 text-destructive" />
                 </Button>
                 <Button variant="outline" size="icon">
                     <Share2 className="h-5 w-5" />
                 </Button>
            </div>
        </div>

        {/* Right Content: Video List */}
        <div className="flex-1 space-y-4">
             {playlist.videos.length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground">This playlist is empty.</div>
             ) : (
                 <div className="flex flex-col gap-4">
                     {playlist.videos.map((video: any, index: number) => (
                         <div key={video._id} className="flex gap-4 p-2 hover:bg-muted/50 rounded-lg group">
                             <span className="text-muted-foreground font-medium self-center w-6 text-center">
                                 {index + 1}
                             </span>
                             {/* Reusing VideoCard might be too big, let's make a horizontal list item or use VideoCard with modifications */}
                             {/* For now, just listing them using VideoCard but maybe wrapping it? VideoCard is blocky. Let's do a custom horizontal card here or minimal VideoCard */}
                             <div className="flex-1">
                                 <VideoCard video={video} isAboveFold={true} /> 
                             </div>
                             <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveVideo(video._id)}>
                                     <Trash2 className="h-4 w-4" />
                                 </Button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>

      </div>
    </MainLayout>
  );
}
