"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/TextArea";

export default function TweetsPage() {
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/tweets", {
          credentials: "include",
        });
        const data = await response.json();
        setTweets(data.tweets);
      } catch (error) {
        console.error("Error fetching tweets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/v1/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: newTweet }),
      });
      const data = await response.json();
      setTweets([data.tweet, ...tweets]);
      setNewTweet("");
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tweets</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <Textarea
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
              placeholder="What's happening?"
              className="mb-4"
            />
            <Button type="submit" disabled={!newTweet.trim()}>
              Tweet
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tweets.map((tweet) => (
          <Card key={tweet._id}>
            <CardContent className="pt-6">
              <p>{tweet.content}</p>
              <div className="text-sm text-muted-foreground mt-2">
                {new Date(tweet.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
