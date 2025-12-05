"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoGrid } from "@/components/video/VideoGrid";
import { MessageFeed } from "@/components/messages/MessageFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, MessageSquare } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-14">
            <TabsTrigger value="videos" className="flex items-center gap-2 text-base py-3">
              <Video className="w-5 h-5" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 text-base py-3">
              <MessageSquare className="w-5 h-5" />
              Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-6">
            <VideoGrid />
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-6">
            <MessageFeed />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
