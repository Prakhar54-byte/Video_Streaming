"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { TextArea } from "../ui/TextArea";
import { Label } from "../ui/Label";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/Dialog";
import { useAuth } from "@/hooks/userAuth";
import { useToast } from "@/hooks/useToast";
import { playlistService } from "@/services/playlist.service";
import { Plus } from "lucide-react";

interface PlaylistCreatorProps {
  trigger?: React.ReactNode;
  onPlaylistCreated?: (playlist: any) => void;
  initialVideoId?: string;
}

interface CreatePlaylistData {
  name: string;
  description?: string;
  videoId?: string[];
}

export function PlaylistCreator({
  trigger,
  onPlaylistCreated,
  initialVideoId,
}: PlaylistCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlaylistData>({
    name: "",
    description: "",
    videoId: initialVideoId ? [initialVideoId] : [],
  });

  const handleInputChange = (field: keyof CreatePlaylistData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Unauthorized",
        description: "Please login to create a playlist",
        variant: "destructive",
      });
      return;
    }
    if (formData.videoId?.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one video",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const playlist = await playlistService.createPlaylist({
        name: formData.name,
        description: formData.description,
        videoId: formData.videoId,
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            videoId: formData.videoId,
          }),
        },
      );

      if (response.ok) {
        const createdPlaylist = await response.json();
        toast({
          title: "Success",
          description: "Playlist created successfully",
          variant: "success",
        });
        onPlaylistCreated?.(createdPlaylist);
        setOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to create playlist",
          variant: "destructive",
        });
      }

      if (playlist.success) {
        onPlaylistCreated?.(playlist.data);
        setOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Playlist created successfully",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      videoId: initialVideoId ? [initialVideoId] : [],
    });
  };
  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Playlist
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter playlist name"
              maxLength={100}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.name.length}/100
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your playlist (optional)"
              maxLength={500}
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/500
            </div>
          </div>

          {initialVideoId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This playlist will include the current video you are watching.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
