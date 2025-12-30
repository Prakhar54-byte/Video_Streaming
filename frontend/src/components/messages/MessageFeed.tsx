"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useMessageStore, Message } from "@/store/messageStore";
import apiClient from "@/lib/api";
import { Send, Heart, Trash2, Reply, X } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toBackendAssetUrl } from "@/lib/utils";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { AvatarFallback } from "../ui/avatar";

interface MessageWithChildren extends Message {
  children: MessageWithChildren[];
}

export function MessageFeed() {
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, deleteMessage } = useMessageStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get("/tweets");
      const fetchedMessages = response.data.data || [];
      // Map backend fields to store interface
      const mappedMessages = fetchedMessages.map((msg: any) => ({
        ...msg,
        likes: msg.likesCount !== undefined ? msg.likesCount : (msg.likes || 0),
        liked: msg.isLiked !== undefined ? msg.isLiked : (msg.liked || false)
      }));
      setMessages(mappedMessages);
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
        parentTweetId: replyingTo?._id
      });

      addMessage(response.data.data);
      setNewMessage("");
      setReplyingTo(null);
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

  const handleReply = (message: any) => {
    setReplyingTo(message);
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
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

  const handelLike=async(id:string)=>{
    try {
      // Find the message
      const message = messages.find(msg => msg._id === id);
      if (!message) return;

      const wasLiked = message.liked;
      const newLiked = !wasLiked;
      const newLikes = wasLiked ? Math.max(0, (message.likes || 0) - 1) : (message.likes || 0) + 1;

      // Optimistic update
      const updatedMessages = messages.map(msg => {
        if (msg._id === id) {
          return { ...msg, likes: newLikes, liked: newLiked };
        }
        return msg;
      });
      setMessages(updatedMessages);

      // Call API
      await apiClient.post(`/likes/tweet/${id}/toggle`);

      toast({ title: newLiked ? "Message liked" : "Message unliked" });
      
    } catch (error: any) {
      toast({
        title: "Error liking message",
        variant: "destructive",
      });
      // Revert changes by refetching
      fetchMessages();
    }
  }

  const messageTree = useMemo(() => {
    const messageMap = new Map<string, MessageWithChildren>();
    const roots: MessageWithChildren[] = [];

    // Initialize map
    messages.forEach(msg => {
      messageMap.set(msg._id, { ...msg, children: [] });
    });

    // Build tree
    messages.forEach(msg => {
      const node = messageMap.get(msg._id)!;
      if (msg.parentTweet && messageMap.has(msg.parentTweet._id)) {
        const parent = messageMap.get(msg.parentTweet._id)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children by date (oldest first) for conversation flow
    messageMap.forEach(node => {
      node.children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    // Sort roots by date (newest first)
    return roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Post Message */}
      <div className="bg-card p-8 rounded-lg border">
        {replyingTo && (
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-t-lg border-b mb-2">
            <span className="text-sm text-muted-foreground">
              Replying to <span className="font-semibold text-primary">@{replyingTo.owner?.username}</span>
            </span>
            <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
        {messageTree.map((message) => (
          <MessageItem 
            key={message._id} 
            message={message} 
            isRoot={true} 
            currentUserId={user?._id}
            onReply={handleReply}
            onDelete={handleDelete}
            onLike={handelLike}
          />
        ))}
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: MessageWithChildren;
  isRoot?: boolean;
  currentUserId?: string;
  onReply: (msg: any) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
}

const MessageItem = ({ message, isRoot = false, currentUserId, onReply, onDelete, onLike }: MessageItemProps) => {
  return (
    <div className="relative">
      <div className="bg-card p-8 rounded-lg border hover:border-primary/50 transition-colors">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 border border-primary/20">
            <AvatarImage src={message.owner?.avatar} alt={message.owner?.fullName} />
            <AvatarFallback>
              {message.owner?.fullName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">{message.owner?.fullName}</h4>
                <p className="text-base text-muted-foreground">
                  @{message.owner?.username} · {formatTimeAgo(message.createdAt)}
                </p>
              </div>
              {currentUserId === message.owner._id && (
                <button
                  onClick={() => onDelete(message._id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Show "Replying to" only if it's a root node (meaning parent is not in the list) but has a parentTweet */}
            {isRoot && message.parentTweet && (
              <div className="mt-2 mb-2 pl-3 border-l-2 border-primary/30 text-sm text-muted-foreground bg-muted/10 p-2 rounded-r">
                <p className="font-medium text-primary/80 text-xs mb-1">Replying to @{message.parentTweet.owner.username}</p>
                <p className="line-clamp-1 italic">{message.parentTweet.content}</p>
              </div>
            )}

            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
            <div className="flex items-center gap-6 mt-4 text-muted-foreground">
              <button onClick={() => onReply(message)} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Reply className="w-5 h-5" />
                <span className="text-base">Reply</span>
              </button>
              <button  
                onClick={() => onLike(message._id)} 
                className={`flex items-center gap-2 transition-colors ${message.liked ? 'text-red-500' : 'hover:text-red-500'}`}
              >
                <Heart className={`w-5 h-5 ${message.liked ? 'fill-current' : ''}`} />
                <span className="text-base">{message?.likes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render Children */}
      {message.children.length > 0 && (
        <div className="ml-8 mt-4 pl-4 border-l-2 border-border space-y-4">
          {message.children.map(child => (
            <MessageItem 
              key={child._id} 
              message={child} 
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};
