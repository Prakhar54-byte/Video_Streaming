"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { usePlaylistStore } from "@/store/playlistStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddToPlaylistModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPlaylistModal({ videoId, isOpen, onClose }: AddToPlaylistModalProps) {
  const { user } = useAuthStore();
  const { playlists, fetchUserPlaylists, createPlaylist, addVideoToPlaylist } = usePlaylistStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchUserPlaylists(user._id);
    }
  }, [isOpen, user?._id, fetchUserPlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setIsSubmitting(true);
    try {
      await createPlaylist(newPlaylistName, "", videoId);
      toast.success("Playlist created and video added");
      setShowCreateForm(false);
      setNewPlaylistName("");
      onClose(); // Close after successful creation + add
    } catch (error) {
      toast.error("Failed to create playlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
      try {
          await addVideoToPlaylist(playlistId, videoId);
          toast.success("Added to playlist");
          onClose(); 
      } catch (error) {
          toast.error("Failed to add to playlist");
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to...</DialogTitle>
        </DialogHeader>
        
        {!showCreateForm ? (
          <div className="space-y-4">
             {playlists.length > 0 ? (
                 <ScrollArea className="h-[300px] pr-4">
                     <div className="space-y-2">
                     {playlists.map((playlist) => (
                         <div 
                            key={playlist._id} 
                            className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                            onClick={() => handleAddToPlaylist(playlist._id)}
                         >
                             {/* In a real app, check if video is already in playlist to check checkbox */}
                             <Checkbox id={playlist._id} /> 
                             <label
                                htmlFor={playlist._id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {playlist.name}
                              </label>
                              <span className="text-xs text-muted-foreground">{playlist.videos.length} videos</span>
                         </div>
                     ))}
                     </div>
                 </ScrollArea>
             ) : (
                 <p className="text-sm text-center text-muted-foreground py-4">No playlists yet.</p>
             )}
             
             <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setShowCreateForm(true)}
             >
                 <Plus className="w-4 h-4" />
                 Create new playlist
             </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Enter playlist name..."
                      autoFocus
                  />
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                  <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button onClick={handleCreatePlaylist} disabled={isSubmitting || !newPlaylistName.trim()}>
                      Create
                  </Button>
              </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}