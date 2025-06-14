import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Home,
  User,
  Hash,
  List,
  Bell,
  MessageSquare,
  Plus,
  LogOut,
  Menu,
  Bookmark,
  TrendingUp,
  X,
  Heart,
  Share,
  Filter,
  Loader2,
  Video,
  Settings,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const HomePage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const searchInputRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [tweetContent, setTweetContent] = useState("");
  const [isSubmittingTweet, setIsSubmittingTweet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, content: "Your video reached 1,000 views!", read: false },
    { id: 2, content: "Channel XYZ subscribed to you", read: false },
    { id: 3, content: "New comment on your video", read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sortOption, setSortOption] = useState("recent");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const videosResponse = await fetch("/api/videos?limit=25");
        const videosData = await videosResponse.json();
        setVideos(videosData.videos || []);
        setFilteredVideos(videosData.videos || []);

        const tweetsResponse = await fetch("/api/tweets");
        const tweetsData = await tweetsResponse.json();
        setTweets(tweetsData.tweets || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // --- Search and Sort Logic ---
  useEffect(() => {
    setIsSearching(true);
    let filtered = videos;
    if (searchQuery) {
      filtered = videos.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortOption === "trending") {
      filtered = [...filtered].sort((a, b) => b.views - a.views);
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setFilteredVideos(filtered);
    setIsSearching(false);
  }, [searchQuery, sortOption, videos]);

  // --- Tweet Submission ---
  const handleTweetSubmit = async (e) => {
    e.preventDefault();
    if (!tweetContent.trim()) return;
    setIsSubmittingTweet(true);
    try {
      const res = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tweetContent }),
      });
      if (res.ok) {
        const newTweet = await res.json();
        setTweets([newTweet, ...tweets]);
        setTweetContent("");
        toast({ title: "Tweet posted!" });
      } else {
        throw new Error("Failed to post tweet");
      }
    } catch {
      toast({ title: "Error", description: "Could not post tweet", variant: "destructive" });
    } finally {
      setIsSubmittingTweet(false);
    }
  };

  // --- Notification Logic ---
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // --- Sidebar Links ---
  const sidebarLinks = [
    { icon: <Home size={20} />, label: "Home", href: "/" },
    { icon: <TrendingUp size={20} />, label: "Trending", href: "/trending" },
    { icon: <Bookmark size={20} />, label: "Bookmarks", href: "/bookmarks" },
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarVisible((v) => !v)}
          >
            <Menu />
          </Button>
          <Link href="/">
            <a className="flex items-center font-bold text-lg gap-2">
              <Video className="text-primary" size={28} />
              <span>VideoApp</span>
            </a>
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative"
                  aria-label="Notifications"
                >
                  <Bell />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1" variant="destructive" size="sm">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="/avatar.png" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2" size={16} /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2" size={16} /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/logout")}>
                <LogOut className="mr-2" size={16} /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-8 top-14 bg-white border rounded shadow-lg w-72 z-20">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">Notifications</span>
              <Button variant="link" size="sm" onClick={markAllRead}>
                Mark all as read
              </Button>
            </div>
            <ul className="max-h-60 overflow-auto">
              {notifications.length === 0 && (
                <li className="p-4 text-center text-muted-foreground">No notifications</li>
              )}
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-2 hover:bg-muted-foreground/10 ${n.read ? "" : "font-bold"}`}
                >
                  {n.content}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div
        className="container grid gap-6 px-4 py-6 transition-all duration-300 ease-in-out"
        style={{ gridTemplateColumns: sidebarVisible ? "minmax(240px, 1fr) 3fr" : "1fr" }}
      >
        {/* Sidebar */}
        {sidebarVisible && (
          <aside className="hidden md:block pr-4">
            <nav className="flex flex-col gap-2">
              {sidebarLinks.map((link) => (
                <Link href={link.href} key={link.label}>
                  <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted-foreground/10 transition">
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                </Link>
              ))}
            </nav>
            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => setActiveTab("tweets")}
              >
                <MessageSquare size={18} />
                Tweet
              </Button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={sidebarVisible ? "" : "col-span-full"}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="videos">
                <Video size={16} className="mr-1" /> Videos
              </TabsTrigger>
              <TabsTrigger value="tweets">
                <MessageSquare size={16} className="mr-1" /> Tweets
              </TabsTrigger>
            </TabsList>
            <TabsContent value="videos">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant={sortOption === "recent" ? "default" : "outline"}
                  onClick={() => setSortOption("recent")}
                >
                  Recent
                </Button>
                <Button
                  variant={sortOption === "trending" ? "default" : "outline"}
                  onClick={() => setSortOption("trending")}
                >
                  Trending
                </Button>
                {isSearching && <Loader2 className="animate-spin ml-2" size={18} />}
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No videos found.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <Card key={video.id} className="overflow-hidden aspect-video">
                      <Link href={`/videos/${video.id}`}>
                        <a>
                          <div className="aspect-video">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              layout="fill"
                              objectFit="cover"
                              className="transition-transform hover:scale-105"
                            />
                          </div>
                          <CardContent className="p-3">
                            <div className="font-semibold truncate">{video.title}</div>
                            <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
                              <User size={14} /> {video.author}
                              <span>•</span>
                              {video.views} views
                              <span>•</span>
                              {new Date(video.createdAt).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </a>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="tweets">
              <form onSubmit={handleTweetSubmit} className="mb-4">
                <Textarea
                  placeholder="What's happening?"
                  value={tweetContent}
                  onChange={(e) => setTweetContent(e.target.value)}
                  rows={3}
                  className="mb-2"
                />
                <Button type="submit" disabled={isSubmittingTweet || !tweetContent.trim()}>
                  {isSubmittingTweet ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-2" size={16} />}
                  Tweet
                </Button>
              </form>
              <div className="flex flex-col gap-4">
                {tweets.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No tweets yet.
                  </div>
                ) : (
                  tweets.map((tweet) => (
                    <Card key={tweet.id}>
                      <CardContent className="flex gap-3 items-start p-4">
                        <Avatar>
                          <AvatarImage src={tweet.authorAvatar || "/avatar.png"} />
                          <AvatarFallback>{tweet.author?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{tweet.author || "User"}</div>
                          <div className="text-muted-foreground text-xs mb-1">
                            {new Date(tweet.createdAt).toLocaleString()}
                          </div>
                          <div>{tweet.content}</div>
                          <div className="flex gap-2 mt-2">
                            <Button variant="ghost" size="icon"><Heart size={16} /></Button>
                            <Button variant="ghost" size="icon"><Share size={16} /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <style jsx>{`
        .aspect-video {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
        }
        .aspect-video > * {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .overflow-hidden {
          transition: all 0.3s ease-in-out;
        }
        .layout-transitioning * {
          transition: width 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease;
        }
        img {
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
