"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { usePlaylistStore } from "@/store/playlistStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListVideo, PlayCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";  // Need to make sure Textarea exists
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function PlaylistsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { playlists, fetchUserPlaylists, createPlaylist, deletePlaylist, isLoading } = usePlaylistStore();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (user?._id) {
      fetchUserPlaylists(user._id);
    }
  }, [user?._id, fetchUserPlaylists]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createPlaylist(newName, newDesc);
      toast.success("Playlist created");
      setIsCreateOpen(false);
      setNewName("");
      setNewDesc("");
    } catch (error) {
      toast.error("Failed to create playlist");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // update: stop propagation if inside a link
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this playlist?")) {
      try {
        await deletePlaylist(id);
        toast.success("Playlist deleted");
      } catch (error) {
        toast.error("Failed to delete playlist");
      }
    }
  }

  if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) return (
      <MainLayout>
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <ListVideo className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Log in to view playlists</h2>
              <Button asChild><Link href="/auth/login">Login</Link></Button>
          </div>
      </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Playlists</h1>
            <p className="text-muted-foreground mt-2">Manage and organize your video collections</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="My Awesome Playlist"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="desc" className="text-sm font-medium">Description</label>
                  <Input
                    id="desc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Optional description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newName.trim() || isLoading}>
                    {isLoading ? "Creating..." : "Create Playlist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length === 0 && !isLoading ? (
             <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
                 <ListVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-semibold">No playlists yet</h3>
                 <p className="text-muted-foreground mb-6">Create your first playlist to start collecting videos.</p>
                 <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create Playlist</Button>
             </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist) => (
                    <Link href={`/playlists/${playlist._id}`} key={playlist._id}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="pb-2">
                                <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                                <CardDescription className="line-clamp-1">
                                    {playlist.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="components-center flex justify-center py-8 bg-muted/20">
                                <div className="relative">
                                    <ListVideo className="w-16 h-16 text-muted-foreground/50" />
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                        {playlist?.videos?.length || 0}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 flex justify-between text-sm text-muted-foreground border-t bg-muted/10">
                                <span>Updated {formatDistanceToNow(new Date(playlist.createdAt), { addSuffix: true })}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => handleDelete(e, playlist._id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
             </div>
        )}
      </div>
    </MainLayout>
  );
}
