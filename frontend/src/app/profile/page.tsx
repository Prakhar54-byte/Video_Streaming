"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { useChannelStore } from "@/store/channelStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Video,
  Heart,
  Users,
  Settings,
  Plus,
  TrendingUp,
  Upload,
  Edit,
  BarChart3,
  Film,
  Tv,
} from "lucide-react";
import { channelApi } from "@/lib/api/channel";
import { CreateChannelModal } from "@/components/channel/CreateChannelModal";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { LikedVideos } from "@/components/profile/LikedVideos";
import { SubscribedChannels } from "@/components/profile/SubscribedChannels";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { StudioDashboard } from "@/components/studio/StudioDashboard";
import { StudioVideos } from "@/components/studio/StudioVideos";
import { StudioAnalytics } from "@/components/studio/StudioAnalytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const {
    channels,
    setChannels,
    setLoading: setChannelLoading,
  } = useChannelStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEmail, setShowEmail] = useState(false);

  // All hooks must be called before any conditional returns
  const fetchUserChannels = useCallback(async () => {
    setChannelLoading(true);
    try {
      const response = await channelApi.getUserChannels();
      if (response.success) {
        setChannels(response.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching channels:", error);
    } finally {
      setChannelLoading(false);
    }
  }, [setChannels, setChannelLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated) {
      fetchUserChannels();
    }
  }, [isAuthenticated, isLoading, router, fetchUserChannels]);

  // Helper function for masking email
  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    return `${name[0]}****@${domain}`;
  };

  // Now we can have conditional logic after all hooks
  const hasChannel = channels && channels.length > 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={user.avatar} alt={user.fullName} />
                <AvatarFallback className="text-2xl">
                  {user.fullName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {showEmail
                    ? user.email
                    : maskEmail(user.email) && (
                        <Badge variant="secondary" className="text-sm">
                          {user.email}
                        </Badge>
                      )}
                  {user.isVerified && (
                    <Badge className="text-sm">✓ Verified</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!hasChannel && (
                  <Button
                    size="lg"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your Channel
                  </Button>
                )}
                {hasChannel && (
                  <Badge variant="outline" className="text-sm px-4 py-2">
                    <Tv className="w-4 h-4 mr-2" />
                    Content Creator
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Creation Prompt for Users Without Channel */}
        {!hasChannel && (
          <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-primary/10 p-6">
                <Tv className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">
                  Start Your Creator Journey
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Create your channel to upload videos, build an audience, and
                  share your content with the world.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Channel Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={cn(
              "grid w-full max-w-4xl mx-auto mb-8 h-auto",
              hasChannel ? "grid-cols-7" : "grid-cols-4",
            )}
          >
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 py-3"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center gap-2 py-3">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Liked</span>
            </TabsTrigger>
            <TabsTrigger
              value="subscribed"
              className="flex items-center gap-2 py-3"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Subscribed</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 py-3"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>

            {/* Studio Tabs - Only show if user has channel */}
            {hasChannel && (
              <>
                <TabsTrigger
                  value="studio"
                  className="flex items-center gap-2 py-3"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Studio</span>
                </TabsTrigger>
                <TabsTrigger
                  value="content"
                  className="flex items-center gap-2 py-3"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2 py-3"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Tabs */}
          <TabsContent value="overview" className="space-y-6">
            <ProfileInfo />
          </TabsContent>

          <TabsContent value="liked" className="space-y-6">
            <LikedVideos />
          </TabsContent>

          <TabsContent value="subscribed" className="space-y-6">
            <SubscribedChannels />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          {/* Studio Tabs - Only accessible if user has channel */}
          {hasChannel && (
            <>
              <TabsContent value="studio" className="space-y-6">
                <StudioDashboard channel={channels[0]} />
              </TabsContent>

              <TabsContent value="videos" className="space-y-6">
                <StudioVideos channel={channels[0]} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <StudioAnalytics channel={channels[0]} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <CreateChannelModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </MainLayout>
  );
}
