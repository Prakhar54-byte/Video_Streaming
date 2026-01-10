"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useQueueStore } from "@/store/queueStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Trash2, Play, ListEnd } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils"; // Assuming helper exists, or write inline
import { toast } from "sonner";

export default function QueuePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { queue, fetchQueue, removeFromQueue, clearQueue, isLoading } = useQueueStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchQueue();
    }
  }, [isAuthenticated, fetchQueue]);

  const handleRemove = async (id: string) => {
    try {
      await removeFromQueue(id);
      toast.success("Removed from queue");
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const handleClear = async () => {
    if (confirm("Clear entire queue?")) {
        try {
            await clearQueue();
            toast.success("Queue cleared");
        } catch (error) {
            toast.error("Failed to clear queue");
        }
    }
  };

  const formatDuration = (seconds?: number) => {
      if (!seconds) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <ListEnd className="w-8 h-8 text-primary" /> 
                Current Queue
            </h1>
            <p className="text-muted-foreground">{queue.length} videos</p>
          </div>
          <div className="flex gap-2">
              <Button disabled={queue.length === 0} onClick={() => alert("Play all implementation pending")}>
                  <Play className="mr-2 h-4 w-4" /> Play All
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={queue.length === 0}
            >
                  Clear
              </Button>
          </div>
        </div>

        <Separator />

        {queue.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
                <p>Your queue is empty.</p>
                <Button variant="link" asChild><Link href="/">Discover Videos</Link></Button>
            </div>
        ) : (
            <div className="space-y-4">
                {queue.map((video, index) => (
                    <div key={`${video._id}-${index}`} className="flex gap-4 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow group">
                        <div className="font-semibold text-muted-foreground self-center w-6 text-center">
                            {index + 1}
                        </div>
                        <div className="relative w-40 aspect-video rounded-md overflow-hidden bg-muted">
                            {video.thumbnail && (
                                <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                {formatDuration(video.duration)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                             <div>
                                 <Link href={`/video/${video._id}`} className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                                     {video.title}
                                 </Link>
                                 <div className="text-sm text-muted-foreground">{video.owner.username}</div>
                             </div>
                        </div>
                        <div className="self-center">
                             <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemove(video._id)}>
                                 <Trash2 className="h-5 w-5" />
                             </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </MainLayout>
  );
}
