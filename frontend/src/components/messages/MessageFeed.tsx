"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import apiClient from "@/lib/api";
import { Send, Heart, Trash2, Reply } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function MessageFeed() {
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, deleteMessage } =
    useMessageStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get("/tweets");
      setMessages(response.data.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      const response = await apiClient.post("/tweets", {
        content: newMessage,
      });
      addMessage(response.data.data);
      setNewMessage("");
      toast({ title: "Message sent successfully" });
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/tweets/${id}`);
      deleteMessage(id);
      toast({ title: "Message deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Post Message */}
      <div className="bg-card p-8 rounded-lg border">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-background border rounded-lg p-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary text-base"
          maxLength={280}
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-base text-muted-foreground">
            {newMessage.length}/280
          </span>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-base"
          >
            <Send className="w-5 h-5" />
            Post
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className="bg-card p-8 rounded-lg border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <img
                src={message.owner.avatar || "/placeholder.png"}
                alt={message.owner.username}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {message.owner.fullName}
                    </h4>
                    <p className="text-base text-muted-foreground">
                      @{message.owner.username} ·{" "}
                      {formatTimeAgo(message.createdAt)}
                    </p>
                  </div>
                  {user?._id === message.owner._id && (
                    <button
                      onClick={() => handleDelete(message._id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed">
                  {message.content}
                </p>
                <div className="flex items-center gap-6 mt-4 text-muted-foreground">
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Reply className="w-5 h-5" />
                    <span className="text-base">Reply</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-base">{message.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
