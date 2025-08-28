"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tab";
import VideoGrid from "@/components/ui/VideoGrid";
import { Card, CardContent } from "@/components/ui/Card";

export default function LikesPage() {
  const [likedVideos, setLikedVideos] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedContent = async () => {
      try {
        const [videosRes, commentsRes, tweetsRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/likes/videos", {
            credentials: "include",
          }),
          fetch("http://localhost:8000/api/v1/likes/comments", {
            credentials: "include",
          }),
          fetch("http://localhost:8000/api/v1/likes/tweets", {
            credentials: "include",
          }),
        ]);

        const [videosData, commentsData, tweetsData] = await Promise.all([
          videosRes.json(),
          commentsRes.json(),
          tweetsRes.json(),
        ]);

        setLikedVideos(videosData.videos);
        setLikedComments(commentsData.comments);
        setLikedTweets(tweetsData.tweets);
      } catch (error) {
        console.error("Error fetching liked content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedContent();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Liked Content</h1>

      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="tweets">Tweets</TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <VideoGrid videos={likedVideos} />
        </TabsContent>

        <TabsContent value="comments">
          <div className="space-y-4">
            {likedComments.map((comment) => (
              <Card key={comment._id}>
                <CardContent className="pt-6">
                  <p>{comment.content}</p>
                  <div className="text-sm text-muted-foreground mt-2">
                    On video: {comment.video.title}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tweets">
          <div className="space-y-4">
            {likedTweets.map((tweet) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
