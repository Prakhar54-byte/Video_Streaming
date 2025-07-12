"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function TweetFeed() {
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tweets");
      const data = await response.json();

      if (response.ok) {
        setTweets(data.tweets || []);
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTweet = async (e) => {
    e.preventDefault();

    if (!newTweet.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);

      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newTweet,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewTweet("");
        fetchTweets(); // Refresh tweets
      }
    } catch (error) {
      console.error("Error posting tweet:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates
    if (diffInSeconds < 0) {
      return "in the future";
    }

    // Handle very recent times
    if (diffInSeconds < 1) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInSeconds / 3600);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    // For older dates, show weeks or actual date
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}w ago`;
    }

    // For very old dates, show the actual date
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tweet Composer */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage
                  src={user?.avatar || "/placeholder.svg"}
                  alt={user?.username}
                />
                <AvatarFallback>
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <form onSubmit={handleSubmitTweet} className="space-y-4">
                  <TextArea
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    placeholder="What's happening in the video world?"
                    rows={3}
                    maxLength={280}
                    className="resize-none border-none focus:ring-0 text-lg placeholder:text-gray-500"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {newTweet.length}/280
                    </span>
                    <Button
                      type="submit"
                      disabled={submitting || !newTweet.trim()}
                      className="rounded-full"
                    >
                      {submitting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Tweets List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <Card
              key={tweet._id}
              className="hover:bg-gray-50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={tweet.owner?.avatar || "/placeholder.svg"}
                      alt={tweet.owner?.username}
                    />
                    <AvatarFallback>
                      {tweet.owner?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {tweet.owner?.fullName || tweet.owner?.username}
                      </h3>
                      <span className="text-gray-500 text-sm">
                        @{tweet.owner?.username}
                      </span>
                      <span className="text-gray-500 text-sm">·</span>
                      <span className="text-gray-500 text-sm">
                        {formatTimeAgo(tweet.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">
                      {tweet.content}
                    </p>
                    <div className="mt-4 flex items-center justify-between max-w-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Reply</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        <span className="text-sm">{tweet.likes || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-green-600"
                      >
                        <Share className="h-4 w-4 mr-1" />
                        <span className="text-sm">Share</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && tweets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600">
              Be the first to share something with the community!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
