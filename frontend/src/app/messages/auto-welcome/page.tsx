"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Video, Gift, BarChart3, Save } from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AutoWelcomeConfig {
  enabled: boolean;
  message: string;
  includeVideo: boolean;
  videoId?: string;
  includeCoupon: boolean;
  couponCode?: string;
  couponDescription?: string;
  includePoll: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
}

export default function AutoWelcomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AutoWelcomeConfig>({
    enabled: false,
    message: "Thanks for subscribing! 🎉 I'm excited to have you here!",
    includeVideo: false,
    includeCoupon: false,
    includePoll: false,
    pollOptions: ["", ""],
  });
  const [userVideos, setUserVideos] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated) {
      fetchConfig();
      fetchUserVideos();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/tweets/auto-welcome/config");
      if (response.data.data && response.data.data.enabled !== undefined) {
        setConfig({
          ...response.data.data,
          pollOptions: response.data.data.pollOptions || ["", ""],
        });
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVideos = async () => {
    try {
      const response = await apiClient.get("/videos?page=1&limit=100");
      const allVideos = response.data.data || [];
      // Filter to only user's own videos
      setUserVideos(allVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.post("/tweets/auto-welcome/setup", config);
      toast({
        title: "Success!",
        description: "Auto-welcome message configuration saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addPollOption = () => {
    setConfig({
      ...config,
      pollOptions: [...(config.pollOptions || []), ""],
    });
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...(config.pollOptions || [])];
    newOptions[index] = value;
    setConfig({ ...config, pollOptions: newOptions });
  };

  const removePollOption = (index: number) => {
    const newOptions = (config.pollOptions || []).filter((_, i) => i !== index);
    setConfig({ ...config, pollOptions: newOptions });
  };

  if (isLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.push("/messages")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Messages
            </Button>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent mb-2">
              Auto-Welcome Setup
            </h1>
            <p className="text-muted-foreground">
              Automatically greet new subscribers with a personalized message
            </p>
          </motion.div>

          {/* Enable/Disable */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Enable Auto-Welcome</CardTitle>
                    <CardDescription>
                      Send automatic messages to new subscribers
                    </CardDescription>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, enabled: checked })
                    }
                  />
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Welcome Message
                </CardTitle>
                <CardDescription>
                  The message that will be sent to new subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.message}
                  onChange={(e) =>
                    setConfig({ ...config, message: e.target.value })
                  }
                  placeholder="Type your welcome message..."
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Include Video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-500" />
                      Include Video
                    </CardTitle>
                    <CardDescription>
                      Share a welcome video with new subscribers
                    </CardDescription>
                  </div>
                  <Switch
                    checked={config.includeVideo}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, includeVideo: checked })
                    }
                  />
                </div>
              </CardHeader>
              {config.includeVideo && (
                <CardContent>
                  <Label htmlFor="videoId">Select Video</Label>
                  <select
                    id="videoId"
                    value={config.videoId || ""}
                    onChange={(e) =>
                      setConfig({ ...config, videoId: e.target.value })
                    }
                    className="w-full mt-2 p-2 border rounded-md bg-background"
                  >
                    <option value="">Choose a video...</option>
                    {userVideos.map((video) => (
                      <option key={video._id} value={video._id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Include Coupon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-500" />
                      Include Coupon
                    </CardTitle>
                    <CardDescription>
                      Offer a discount code to new subscribers
                    </CardDescription>
                  </div>
                  <Switch
                    checked={config.includeCoupon}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, includeCoupon: checked })
                    }
                  />
                </div>
              </CardHeader>
              {config.includeCoupon && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="couponCode">Coupon Code</Label>
                    <Input
                      id="couponCode"
                      value={config.couponCode || ""}
                      onChange={(e) =>
                        setConfig({ ...config, couponCode: e.target.value })
                      }
                      placeholder="e.g., WELCOME20"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="couponDescription">Description</Label>
                    <Input
                      id="couponDescription"
                      value={config.couponDescription || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          couponDescription: e.target.value,
                        })
                      }
                      placeholder="e.g., 20% off your first purchase"
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Include Poll */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      Include Poll
                    </CardTitle>
                    <CardDescription>
                      Ask new subscribers a question
                    </CardDescription>
                  </div>
                  <Switch
                    checked={config.includePoll}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, includePoll: checked })
                    }
                  />
                </div>
              </CardHeader>
              {config.includePoll && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="pollQuestion">Poll Question</Label>
                    <Input
                      id="pollQuestion"
                      value={config.pollQuestion || ""}
                      onChange={(e) =>
                        setConfig({ ...config, pollQuestion: e.target.value })
                      }
                      placeholder="What content would you like to see?"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Poll Options</Label>
                    <div className="space-y-2 mt-2">
                      {config.pollOptions?.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updatePollOption(index, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                          />
                          {config.pollOptions && config.pollOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePollOption(index)}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addPollOption}
                        className="w-full"
                      >
                        + Add Option
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end"
          >
            <ShimmerButton
              onClick={handleSave}
              disabled={saving}
              className="min-w-[200px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Configuration"}
            </ShimmerButton>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
