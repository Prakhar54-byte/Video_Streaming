"use client"

import { useState, useEffect } from "react"
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { TextArea } from "@/components/ui/TextArea" // Assuming this is your component
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/context/AuthContext" // Assuming useAuth provides a 'user' object
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import LiveTimeAgo from "@components/LiveTimeAgo" // Your new .tsx component
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Import the new Tweet type
import { Tweet } from "@/lib/api/like"; // Adjust path as needed

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function TweetFeed() {
  // --- TYPED STATE ---
  const [tweets, setTweets] = useState<Tweet[]>([]); // Use the Tweet interface
  const [newTweet, setNewTweet] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State for editing
  const [editingTweetId, setEditingTweetId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  
  const { isAuthenticated, user } = useAuth(); // 'user' will be typed by your AuthContext

  const fetchTweets = async () => {
    if (!user || !user._id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Tell axios the expected response type
      const response = await axios.get<Tweet[]>(`${API_URL}/tweets/user/${user._id}`);
      setTweets(response.data || []);
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTweets();
    } else {
      setTweets([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleSubmitTweet = async (e: React.FormEvent) => { // Type the event
    e.preventDefault();
    if (!newTweet.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);
      // Tell axios what type of data it's expecting back
      const response = await axios.post<Tweet>(`${API_URL}/tweets/`, {
        content: newTweet,
      });

      // No need for optimistic update, just refetch
      setNewTweet("");
      await fetchTweets(); // This is simpler and gets the populated data

    } catch (error) {
      console.error("Error posting tweet:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // --- TYPED FUNCTIONS ---
  const handelDeleteTweet = async (tweetId: string) => { // Type the param
    if (!tweetId) return;

    if (!window.confirm("Are you sure you want to delete this tweet?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/tweets/${tweetId}`);
      setTweets(tweets.filter((tweet) => tweet._id !== tweetId));
    } catch (error)
 {
      console.error("Error deleting tweet:", error);
    }
  };

  const handelUpdateTweet = async (tweetId: string, newContent: string) => { // Type params
    if (!tweetId || !newContent) return;

    try {
      await axios.patch<Tweet>(`${API_URL}/tweets/${tweetId}`, {
        content: newContent,
      });

      // Re-fetch to get the updated, populated list
      await fetchTweets();

      // Clear editing state
      setEditingTweetId(null);
      setEditingContent("");

    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  // --- The JSX (Return) ---
  // (This part is identical to the one I sent before,
  // as it was already correct TSX syntax)
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tweet Composer */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={user?.avatar || "/placeholder/images.svg"} alt={user?.username} />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
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
                    <span className="text-sm text-gray-500">{newTweet.length}/280</span>
                    <Button type="submit" disabled={submitting || !newTweet.trim()} className="rounded-full">
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
          {tweets.map((tweet) => {
            const isEditing = editingTweetId === tweet._id;
            const isOwner = user?._id === tweet.owner?._id;

            return (
              <Card key={tweet._id} className="hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src={tweet.owner?.avatar || "/placeholder/images.svg"} alt={tweet.owner?.username} />
                      <AvatarFallback>{tweet.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 whitespace-nowrap">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {tweet.owner?.fullName || tweet.owner?.username}
                          </h3>
                          <span className="text-gray-500 text-sm">@{tweet.owner?.username}</span>
                          <span className="text-gray-500 text-sm">·</span>
                          <LiveTimeAgo dateString={tweet.createdAt} />
                        </div>
                        
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-500">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTweetId(tweet._id);
                                  setEditingContent(tweet.content);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handelDeleteTweet(tweet._id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <TextArea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            maxLength={280}
                            className="resize-none"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingTweetId(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              className="rounded-full"
                              onClick={() => handelUpdateTweet(editingTweetId, editingContent)}
                              disabled={!editingContent.trim()} // Good to add
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-gray-800 whitespace-pre-wrap">{tweet.content}</p>
                      )}

                      {/* ... Interaction Buttons ... */}
                      <div className="mt-4 flex items-center justify-between max-w-md">
                         {/* ... Heart, Message, Share ... */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      
      {!loading && tweets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Be the first to share something with the community!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}