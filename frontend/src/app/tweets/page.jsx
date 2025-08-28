"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/userAuth";
import { useToast } from "@/hooks/useToast";

export default function TweetsPage() {
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      // API Call: GET /api/tweets
      const response = await fetch("/api/tweets");
      const data = await response.json();

      if (data.success) {
        setTweets(data.data);
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  };

  const handleSubmitTweet = async (e) => {
    e.preventDefault();

    if (!newTweet.trim()) {
      toast({
        title: "Error",
        description: "Tweet content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

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

      if (data.success) {
        setNewTweet("");
        fetchTweets(); // Refresh tweets
        toast({
          title: "Success",
          description: "Tweet posted successfully",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error posting tweet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post tweet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tweets</h1>

        {/* Tweet Composer */}
        {user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What's happening?</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTweet} className="space-y-4">
                <TextArea
                  value={newTweet}
                  onChange={(e) => setNewTweet(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  maxLength={280}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {newTweet.length}/280
                  </span>
                  <Button type="submit" disabled={loading || !newTweet.trim()}>
                    {loading ? "Posting..." : "Tweet"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tweets List */}
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <Card key={tweet._id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar
                    src={tweet.owner?.avatar}
                    alt={tweet.owner?.username}
                    fallback={tweet.owner?.username?.[0]?.toUpperCase()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {tweet.owner?.username}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(tweet.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-800">{tweet.content}</p>
                    <div className="mt-3 flex items-center space-x-4">
                      <Button variant="ghost" size="sm">
                        Like ({tweet.likesCount || 0})
                      </Button>
                      <Button variant="ghost" size="sm">
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
