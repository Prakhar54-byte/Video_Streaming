"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import {
  Send,
  ArrowLeft,
  Sparkles,
  Video as VideoIcon,
  Gift,
} from "lucide-react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  _id: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  receiver: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  content: string;
  messageType: string;
  tier: "subscriber" | "non_subscriber" | "following";
  badges: string[];
  metadata?: {
    videoId?: string;
    couponCode?: string;
    pollOptions?: string[];
  };
  createdAt: string;
}

interface OtherUser {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (isAuthenticated && params.userId) {
      fetchUserInfo();
      fetchMessages();
    }
  }, [isAuthenticated, isLoading, router, params.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get(`/users/channel/${params.userId}`);
      setOtherUser(response.data.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/tweets/conversation/${params.userId}`,
      );
      setMessages(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await apiClient.post("/tweets/send", {
        receiverId: params.userId,
        content: newMessage.trim(),
        messageType: "text",
      });

      setMessages([...messages, response.data.data]);
      setNewMessage("");
      scrollToBottom();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (message: Message) => {
    const isAutoWelcome = message.messageType === "auto_welcome";
    const hasVideo = message.metadata?.videoId;
    const hasCoupon = message.metadata?.couponCode;

    return (
      <div className="space-y-2">
        {/* Show tier badge */}
        {message.tier === "subscriber" && (
          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 mb-1">
            🔥 Top Fan
          </div>
        )}
        {message.tier === "following" && (
          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 mb-1">
            ⭐ Creator You Follow
          </div>
        )}

        <p className="text-sm break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Show engagement badges */}
        {message.badges && message.badges.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {message.badges.map((badge, idx) => (
              // eslint-disable-next-line react/no-children-prop
              <AnimatedBadge
                key={idx}
                variant={badge as any}
                children={undefined}
              />
            ))}
          </div>
        )}

        {hasVideo && (
          <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center gap-2">
            <VideoIcon className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">
              Video included in message
            </span>
          </div>
        )}

        {hasCoupon && (
          <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold">Coupon Code</span>
            </div>
            <code className="text-sm font-mono bg-background px-2 py-1 rounded">
              {message.metadata?.couponCode}
            </code>
          </div>
        )}
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

  if (!isAuthenticated || !otherUser) {
    return null;
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="border-b p-4 bg-card">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/messages")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <Image
              src={otherUser.avatar || "/placeholder/user-avatar.png"}
              alt={otherUser.fullName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />

            <div className="flex-1">
              <h2 className="font-semibold">{otherUser.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                @{otherUser.username}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isOwnMessage = message.owner._id === user?._id;
                const isAutoWelcome = message.messageType === "auto_welcome";

                return (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                          : "bg-card border"
                      } rounded-2xl p-4 shadow-sm`}
                    >
                      {isAutoWelcome && !isOwnMessage && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-semibold">
                            Auto-Welcome Message
                          </span>
                        </div>
                      )}

                      {renderMessageContent(message)}

                      <p
                        className={`text-xs mt-2 ${
                          isOwnMessage
                            ? "text-white/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTimeAgo(message.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-card">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
