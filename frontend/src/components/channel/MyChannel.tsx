"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Users, Video, Edit, Trash2, Settings } from "lucide-react";
import { useChannelStore } from "@/store/channelStore";
import { channelApi } from "@/lib/api/channel";
import { CreateChannelModal } from "./CreateChannelModal";
import { toast } from "sonner";

export function MyChannel() {
  const { channels, setChannels, setLoading, isLoading } = useChannelStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchUserChannels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await channelApi.getUserChannels();
      if (response.success) {
        setChannels(response.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching channels:", error);
      toast.error(error.response?.data?.message || "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [setChannels, setLoading]);

  useEffect(() => {
    fetchUserChannels();
  }, [fetchUserChannels]);

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Are you sure you want to delete this channel? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await channelApi.deleteChannel(channelId);
      if (response.success) {
        toast.success("Channel deleted successfully");
        fetchUserChannels();
      }
    } catch (error: any) {
      console.error("Error deleting channel:", error);
      toast.error(error.response?.data?.message || "Failed to delete channel");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <>
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="rounded-full bg-primary/10 p-6">
              <Video className="w-12 h-12 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Create Your Channel</h3>
              <p className="text-muted-foreground max-w-md">
                Start your journey as a content creator. Create your channel and share your videos with the world.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Channel
            </Button>
          </CardContent>
        </Card>
        
        <CreateChannelModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Channels</h2>
            <p className="text-muted-foreground">Manage your content channels</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Channel
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Banner */}
              {channel.banner && (
                <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 relative">
                  <Image
                    src={channel.banner}
                    alt={`${channel.name} banner`}
                    className="w-full h-full object-cover"
                    width={400}
                    height={128}
                  />
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-2 border-background -mt-8">
                    <AvatarImage src={channel.avatar} alt={channel.name} />
                    <AvatarFallback className="text-lg">
                      {channel.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pt-2">
                    <CardTitle className="text-xl">{channel.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {channel.subscribers?.length || 0} subscribers
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">
                  {channel.description}
                </CardDescription>

                <Separator />

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteChannel(channel._id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CreateChannelModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
