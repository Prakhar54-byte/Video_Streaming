"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { GlowingCard } from "@/components/ui/glowing-card";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Sparkles, Users, User } from "lucide-react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { motion } from "framer-motion";

interface Conversation {
  _id: string;
  otherUser: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  tier: "subscriber" | "non_subscriber" | "following";
  badges: string[];
  lastMessage?: {
    content: string;
    createdAt: string;
    messageType: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface GroupedConversations {
  subscriber: Conversation[];
  following: Conversation[];
  non_subscriber: Conversation[];
}

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"subscriber" | "following" | "non_subscriber">("subscriber");
  const [conversations, setConversations] = useState<GroupedConversations>({
    subscriber: [],
    following: [],
    non_subscriber: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated) {
      fetchInbox();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/tweets/inbox?tier=all");
      setConversations(response.data.data);
    } catch (error: any) {
      console.error("Error fetching inbox:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "subscriber":
        return {
          title: "Top Fans 🔥",
          description: "Your subscribers",
          icon: Sparkles,
          gradient: "from-orange-500 to-red-500",
          count: conversations.subscriber.length,
        };
      case "following":
        return {
          title: "Creators You Follow ⭐",
          description: "Channels you subscribed to",
          icon: Users,
          gradient: "from-purple-500 to-pink-500",
          count: conversations.following.length,
        };
      case "non_subscriber":
        return {
          title: "General Messages 💬",
          description: "Other conversations",
          icon: User,
          gradient: "from-blue-500 to-cyan-500",
          count: conversations.non_subscriber.length,
        };
      default:
        return {
          title: "Messages",
          description: "",
          icon: MessageCircle,
          gradient: "from-gray-500 to-gray-600",
          count: 0,
        };
    }
  };

  const renderConversations = (convos: Conversation[]) => {
    if (convos.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No messages in this category yet</p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-3">
        {convos.map((conversation, index) => (
          <motion.div
            key={conversation._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlowingCard
              onClick={() => router.push(`/messages/${conversation.otherUser._id}`)}
              className="hover:bg-accent/50"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <Image
                    src={conversation.otherUser.avatar || "/placeholder/user-avatar.png"}
                    alt={conversation.otherUser.fullName}
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                  {conversation.unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      {conversation.unreadCount}
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {conversation.otherUser.fullName}
                    </h3>
                    {conversation.badges && conversation.badges.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {conversation.badges.slice(0, 2).map((badge) => (
                          <AnimatedBadge
                            key={badge}
                            variant={badge as any}
                            // eslint-disable-next-line react/no-children-prop
                            className="scale-75" children={undefined}                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    @{conversation.otherUser.username}
                  </p>
                  {conversation.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage.messageType === "auto_welcome" && "🎉 "}
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Time */}
                {conversation.lastMessage && (
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(conversation.lastMessage.createdAt)}
                  </div>
                )}
              </div>
            </GlowingCard>
          </motion.div>
        ))}
      </div>
    );
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent mb-2">
              Priority Inbox
            </h1>
            <p className="text-muted-foreground">
              Your messages organized by relationship
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {(["subscriber", "following", "non_subscriber"] as const).map((tier) => {
                const info = getTierInfo(tier);
                const Icon = info.icon;
                return (
                  <TabsTrigger key={tier} value={tier} className="relative">
                    <Icon className="w-4 h-4 mr-2" />
                    {info.title}
                    {info.count > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${info.gradient} text-white`}
                      >
                        {info.count}
                      </motion.span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="subscriber" className="mt-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
              >
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Top Fans
                </h3>
                <p className="text-sm text-muted-foreground">
                  Messages from your most engaged subscribers with badges showing their support level
                </p>
              </motion.div>
              {renderConversations(conversations.subscriber)}
            </TabsContent>

            <TabsContent value="following" className="mt-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
              >
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-purple-500" />
                  Creators You Follow
                </h3>
                <p className="text-sm text-muted-foreground">
                  Messages from channels youve subscribed to
                </p>
              </motion.div>
              {renderConversations(conversations.following)}
            </TabsContent>

            <TabsContent value="non_subscriber" className="mt-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
              >
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-blue-500" />
                  General Messages
                </h3>
                <p className="text-sm text-muted-foreground">
                  Other conversations and new connections
                </p>
              </motion.div>
              {renderConversations(conversations.non_subscriber)}
            </TabsContent>
          </Tabs>

          {/* Setup Auto-Welcome CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 border border-orange-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  🎉 Auto-Welcome Messages
                </h3>
                <p className="text-sm text-muted-foreground">
                  Automatically greet new subscribers with custom messages, videos, and coupons
                </p>
              </div>
              <Button
                onClick={() => router.push("/messages/auto-welcome")}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Setup Auto-Welcome
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
