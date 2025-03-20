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

  // ... (rest of the component logic remains the same)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        {/* ... (header content remains the same) */}
      </header>

      {/* Main Content */}
      <div
        className="container grid gap-6 px-4 py-6 transition-all duration-300 ease-in-out"
        style={{ gridTemplateColumns: sidebarVisible ? "minmax(240px, 1fr) 3fr" : "1fr" }}
      >
        {/* Sidebar */}
        {sidebarVisible && (
          <aside className="hidden md:block">
            {/* ... (sidebar content remains the same) */}
          </aside>
        )}

        {/* Main Content */}
        <main className={sidebarVisible ? "" : "col-span-full"}>
          {/* ... (main content remains the same) */}
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
        
        /* Add smooth transitions for all size changes */
        .overflow-hidden {
          transition: all 0.3s ease-in-out;
        }
        
        /* Add smooth transitions for layout changes */
        .layout-transitioning * {
          transition: width 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease;
        }
        
        /* Ensure images maintain aspect ratio during transitions */
        img {
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
