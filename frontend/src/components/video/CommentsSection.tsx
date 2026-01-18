"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatTimeAgo, toBackendAssetUrl } from "@/lib/utils";
import {
  MessageSquare,
  Trash2,
  MoreVertical,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Reply,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface User {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
}

interface Comment {
  _id: string;
  content: string;
  owner: User;
  createdAt: string;
  likesCount?: number;
}

interface CommentsSectionProps {
  comments: Comment[];
  currentUser?: User | null;
  onPostComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  className?: string;
}

export function CommentsSection({
  comments,
  currentUser,
  onPostComment,
  onDeleteComment,
  className,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);

  const displayedComments = showAll ? comments : comments.slice(0, 5);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      await onPostComment(newComment);
      setNewComment("");
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-xl font-bold">{comments.length} Comments</h2>
        {comments.length > 0 && (
          <Badge variant="outline" className="ml-auto">
            Sorted by newest
          </Badge>
        )}
      </div>

      {/* Comment Input */}
      {currentUser ? (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={toBackendAssetUrl(currentUser.avatar)} />
            <AvatarFallback>
              {currentUser.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="relative">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="min-h-[100px] resize-none pr-12"
                disabled={isPosting}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                ⌘+Enter to post
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim() || isPosting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isPosting}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {isPosting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Sign in to leave a comment</p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedComments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              currentUserId={currentUser?._id}
              onDelete={() => onDeleteComment(comment._id)}
              isFocused={focusedCommentId === comment._id}
            />
          ))}

          {/* Show more/less button */}
          {comments.length > 5 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show {comments.length - 5} more comments
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentCardProps {
  comment: Comment;
  currentUserId?: string;
  onDelete: () => void;
  isFocused?: boolean;
}

function CommentCard({
  comment,
  currentUserId,
  onDelete,
  isFocused = false,
}: CommentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId === comment.owner?._id;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-3 -mx-3 rounded-lg transition-colors",
        isFocused && "bg-primary/5",
        isDeleting && "opacity-50"
      )}
    >
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={toBackendAssetUrl(comment.owner?.avatar)} />
        <AvatarFallback>
          {comment.owner?.username?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">
            {comment.owner?.fullName || "Unknown User"}
          </span>
          <span className="text-xs text-muted-foreground">
            @{comment.owner?.username || "unknown"}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{comment.likesCount || 0}</span>
          </button>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Reply className="w-3.5 h-3.5" />
            Reply
          </button>
        </div>
      </div>

      {/* Menu */}
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={isDeleting}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default CommentsSection;
