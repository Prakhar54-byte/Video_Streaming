"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePlus, Loader2 } from "lucide-react";
import { channelApi } from "@/lib/api/channel";
import { useChannelStore } from "@/store/channelStore";
import { toast } from "sonner";

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelModal({
  open,
  onOpenChange,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { addChannel } = useChannelStore();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Channel description is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await channelApi.createChannel({
        name: name.trim(),
        description: description.trim(),
        avatar: avatar || undefined,
      });

      if (response.success) {
        addChannel(response.data);
        toast.success("Channel created successfully!");

        // Reset form
        setName("");
        setDescription("");
        setAvatar(null);
        setAvatarPreview("");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error creating channel:", error);
      toast.error(error.response?.data?.message || "Failed to create channel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Your Channel</DialogTitle>
          <DialogDescription>
            Start sharing your content by creating your own channel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarPreview} alt="Channel avatar" />
              <AvatarFallback className="text-2xl">
                {name ? (
                  name[0].toUpperCase()
                ) : (
                  <ImagePlus className="w-8 h-8" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="avatar-upload"
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                {avatar ? "Change Avatar" : "Upload Avatar"}
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              placeholder="Enter channel name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell viewers about your channel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Channel"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
