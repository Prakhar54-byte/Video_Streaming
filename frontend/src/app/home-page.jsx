"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
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
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Avatar,AvatarFallback,AvatarImage } from "../components/ui/Avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tab"
import { Card, CardContent } from "../components/ui/Card"
import { Textarea } from "../components/ui/TextArea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/Dropdown-menu"
import { Badge } from "../components/ui/Badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/Tooltip"
import { useToast } from "../hooks/useToast"

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchInputRef = useRef(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [videos, setVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [tweets, setTweets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("videos")
  const [tweetContent, setTweetContent] = useState("")
  const [isSubmittingTweet, setIsSubmittingTweet] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, content: "Your video reached 1,000 views!", read: false },
    { id: 2, content: "Channel XYZ subscribed to you", read: false },
    { id: 3, content: "New comment on your video", read: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [sortOption, setSortOption] = useState("recent")

  // Fetch videos and tweets on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch videos
        const videosResponse = await fetch("/api/videos?limit=25")
        const videosData = await videosResponse.json()
        setVideos(videosData.videos || [])
        setFilteredVideos(videosData.videos || [])

        // Fetch tweets/messages
        const tweetsResponse = await fetch("/api/tweets")
        const tweetsData = await tweetsResponse.json()
        setTweets(tweetsData.tweets || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Toggle sidebar visibility with smooth transition
  const toggleSidebar = () => {
    // Add a class to the body to trigger transitions
    document.body.classList.add("layout-transitioning")
    setSidebarVisible(!sidebarVisible)

    // Remove the class after transition completes
    setTimeout(() => {
      document.body.classList.remove("layout-transitioning")
    }, 300)
  }

  const handleLogout = async () => {
    // Ask for confirmation before logging out
    const isConfirmed = window.confirm("Are you sure you want to logout?")
    if (!isConfirmed) return

    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) throw new Error("An error occurred while logging out")

      toast({
        title: "Success",
        description: "You have been logged out successfully",
      })

      router.push("/auth/login")
    } catch (error) {
      console.log("Error logging out", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle create button click
  const handleCreateClick = async () => {
    try {
      setIsLoading(true)
      const responseCreate = await fetch("/api/channel/check", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      const data = await responseCreate.json()

      if (responseCreate.ok) {
        if (data.hasChannel) {
          router.push("/channel/dashboard")
        } else {
          router.push("/channel/create")
        }
      } else {
        console.log("Error checking channel", data.message)
        toast({
          title: "Error",
          description: "Error checking channel: " + data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.log("Error checking channel", error)
      toast({
        title: "Error",
        description: "Error checking channel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle tweet/message submission
  const handleTweetSubmit = async (e) => {
    e.preventDefault()

    if (!tweetContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingTweet(true)

    try {
      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tweetContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setTweets([data.tweet, ...tweets])
        setTweetContent("")
        toast({
          title: "Success",
          description: "Message posted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: "Error posting message: " + error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error posting message:", error)
      toast({
        title: "Error",
        description: "Error posting message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingTweet(false)
    }
  }

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setFilteredVideos(videos)
      return
    }

    setIsSearching(true)

    try {
      // In a real app, you would call your API with the search query
      // For now, we'll just filter the existing videos
      const filtered = videos.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.owner?.username.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      setFilteredVideos(filtered)

      if (filtered.length === 0) {
        toast({
          title: "No results",
          description: `No videos found for "${searchQuery}"`,
        })
      } else {
        toast({
          title: "Search results",
          description: `Found ${filtered.length} videos for "${searchQuery}"`,
        })
      }
    } catch (error) {
      console.error("Error searching:", error)
      toast({
        title: "Error",
        description: "Error performing search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle like functionality for tweets
  const handleLikeTweet = (tweetId) => {
    setTweets((prevTweets) =>
      prevTweets.map((tweet) =>
        tweet._id === tweetId
          ? { ...tweet, likes: tweet.liked ? tweet.likes - 1 : tweet.likes + 1, liked: !tweet.liked }
          : tweet,
      ),
    )

    toast({
      title: "Success",
      description: "Like updated",
    })
  }

  // Handle sorting videos
  const handleSortVideos = (option) => {
    setSortOption(option)

    const sorted = [...filteredVideos]

    switch (option) {
      case "recent":
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case "popular":
        sorted.sort((a, b) => b.views - a.views)
        break
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      default:
        break
    }

    setFilteredVideos(sorted)
  }

  // Handle notification click
  const handleNotificationClick = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
    setShowNotifications(false)
  }

  // Handle mark all notifications as read
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prevNotifications) => prevNotifications.map((notification) => ({ ...notification, read: true })))
    toast({
      title: "Success",
      description: "All notifications marked as read",
    })
  }

  // Video Card Component with enhanced hover effects
  const VideoCard = ({ video }) => (
    <div className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
      <div className="aspect-video relative bg-muted overflow-hidden">
        <Image
          src={video.thumbnail || `/frontend/src/public/images/c5db6fddca613053353a5acb9276c5c8.jpg+${video.id}`}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 rounded">
          {formatDuration(video.duration || 0)}
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button variant="secondary" size="sm" className="rounded-full">
            <Play className="h-5 w-5 mr-1" /> Watch Now
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
            <AvatarImage src={video.owner?.avatar} alt={video.owner?.username} />
            <AvatarFallback>{video.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground">{video.owner?.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatViews(video.views)} views • {formatTimeAgo(video.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Tweet/Message Card Component with enhanced interactions
  const TweetCard = ({ tweet }) => (
    <Card className="mb-4 group hover:border-primary/50 transition-colors duration-300">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
            <AvatarImage src={tweet.owner?.avatar} alt={tweet.owner?.username} />
            <AvatarFallback>{tweet.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold group-hover:text-primary transition-colors duration-300">
                {tweet.owner?.fullName}
              </p>
              <p className="text-sm text-muted-foreground">@{tweet.owner?.username}</p>
              <p className="text-xs text-muted-foreground">• {formatTimeAgo(tweet.createdAt)}</p>
            </div>
            <p className="mt-1">{tweet.content}</p>
            <div className="flex gap-4 mt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1 transition-colors duration-200">
                      <MessageSquare className="h-4 w-4" /> {Math.floor(Math.random() * 10)}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reply to message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`text-sm flex items-center gap-1 transition-colors duration-200 ${tweet.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                      onClick={() => handleLikeTweet(tweet._id)}
                    >
                      <Heart className={`h-4 w-4 ${tweet.liked ? "fill-current" : ""}`} /> {tweet.likes || 0}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tweet.liked ? "Unlike" : "Like"} this message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1 transition-colors duration-200">
                      <Share className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share this message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1 transition-colors duration-200">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save this message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Helper functions
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views?.toString() || "0"
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown time"

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Custom Play icon for video cards
  const Play = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  )

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 hover:bg-primary/10 transition-colors duration-200"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold hover:text-primary transition-colors duration-200"
            >
              <Home className="h-5 w-5" />
              <span className="hidden md:inline-block">Home</span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search videos"
              className="w-full rounded-full bg-muted pl-10 pr-16 md:w-60 lg:w-80 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => {
                  setSearchQuery("")
                  setFilteredVideos(videos)
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 hover:bg-primary/10 transition-colors duration-200"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 transition-colors duration-200"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadNotificationsCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg border shadow-lg z-50">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b hover:bg-muted cursor-pointer transition-colors duration-200 ${notification.read ? "" : "bg-primary/5"}`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <p className="text-sm">{notification.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(new Date(Date.now() - Math.random() * 86400000 * 3).toISOString())}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full hover:bg-primary/10 transition-colors duration-200"
                      onClick={handleMarkAllNotificationsAsRead}
                    >
                      Mark all as read
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-colors duration-200"
              onClick={() => router.push("/messages")}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Messages</span>
            </Button>

            <Button
              variant="default"
              className="rounded-full gap-2 hover:bg-primary/90 transition-colors duration-200"
              onClick={handleCreateClick}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline-block">Create</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200">
                  <AvatarImage src="/frontend/src/public/images/c5db6fddca613053353a5acb9276c5c8.jpg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/channel/dashboard")}>
                  <Video className="mr-2 h-4 w-4" />
                  <span>My Channel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        className="container grid gap-6 px-4 py-6 transition-all duration-300 ease-in-out"
        style={{ gridTemplateColumns: sidebarVisible ? "minmax(240px, 1fr) 3fr" : "1fr" }}
      >
        {/* Sidebar */}
        {sidebarVisible && (
          <aside className="hidden md:block">
            <nav className="sticky top-20 space-y-2">
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary hover:bg-primary/20 transition-colors duration-200"
                >
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Home</span>
                </Link>

                <Link
                  href="/explore"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <Hash className="h-5 w-5" />
                  <span className="font-medium">Explore</span>
                </Link>

                <Link
                  href="/trending"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">Trending</span>
                </Link>

                <Link
                  href="/playlists"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <List className="h-5 w-5" />
                  <span className="font-medium">Playlists</span>
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Messages</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-red-100 hover:text-red-600 text-left transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-2 px-3">
                  <h3 className="text-lg font-semibold">Subscriptions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add subscription</span>
                  </Button>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Link
                    key={i}
                    href="/channel/view"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                  >
                    <Avatar className="h-6 w-6 transition-transform duration-200 hover:scale-110">
                      <AvatarFallback>{String.fromCharCode(65 + i)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">Channel {i + 1}</span>
                    {i === 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Live
                      </Badge>
                    )}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-primary hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => router.push("/subscriptions")}
                >
                  Show more
                </Button>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={sidebarVisible ? "" : "col-span-full"}>
          <Tabs defaultValue="videos" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="videos" className="transition-all duration-200">
                Videos
              </TabsTrigger>
              <TabsTrigger value="tweets" className="transition-all duration-200">
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              {/* Video filters and sorting */}
              <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 hover:bg-muted transition-colors duration-200"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filter</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Filter Videos</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>All Videos</DropdownMenuItem>
                      <DropdownMenuItem>Watched</DropdownMenuItem>
                      <DropdownMenuItem>Unwatched</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Short Videos ({"<"} 5 min)</DropdownMenuItem>
                      <DropdownMenuItem>Medium Videos (5-20 min)</DropdownMenuItem>
                      <DropdownMenuItem>Long Videos ({">"} 20 min)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 hover:bg-muted transition-colors duration-200"
                      >
                        <span>Sort: {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Sort Videos</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSortVideos("recent")}>
                        Most Recent
                        {sortOption === "recent" && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortVideos("popular")}>
                        Most Popular
                        {sortOption === "popular" && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortVideos("oldest")}>
                        Oldest First
                        {sortOption === "oldest" && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {searchQuery && (
                  <div className="text-sm text-muted-foreground">
                    Showing results for: <span className="font-medium">{searchQuery}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 px-2 hover:bg-primary/10 transition-colors duration-200"
                      onClick={() => {
                        setSearchQuery("")
                        setFilteredVideos(videos)
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="grid gap-4 transition-all duration-300 ease-in-out grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-lg border bg-card shadow-sm animate-pulse">
                      <div className="aspect-video bg-muted"></div>
                      <div className="p-4">
                        <div className="flex gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0"></div>
                          <div className="space-y-2 w-full">
                            <div className="h-4 w-full bg-muted rounded"></div>
                            <div className="h-3 w-3/4 bg-muted rounded"></div>
                            <div className="h-3 w-1/2 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredVideos.length > 0 ? (
                <div className="grid gap-4 transition-all duration-300 ease-in-out grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No videos found</h3>
                  <p className="text-muted-foreground mb-4">We couldn't find any videos matching your search.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setFilteredVideos(videos)
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tweets">
              <div className="max-w-2xl mx-auto">
                {/* Tweet/Message input form */}
                <Card className="mb-6 hover:border-primary/50 transition-colors duration-300">
                  <CardContent className="pt-6">
                    <form onSubmit={handleTweetSubmit}>
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src="/frontend/src/public/images/c5db6fddca613053353a5acb9276c5c8.jpg" alt="User" />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <Textarea
                            placeholder="What's happening?"
                            value={tweetContent}
                            onChange={(e) => setTweetContent(e.target.value)}
                            className="resize-none focus-visible:ring-primary"
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isSubmittingTweet || !tweetContent.trim()}
                              className="hover:bg-primary/90 transition-colors duration-200"
                            >
                              {isSubmittingTweet ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                "Post"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="pt-6">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <div className="h-4 w-24 bg-muted rounded"></div>
                                <div className="h-4 w-16 bg-muted rounded"></div>
                              </div>
                              <div className="h-4 w-full bg-muted rounded"></div>
                              <div className="h-4 w-3/4 bg-muted rounded"></div>
                              <div className="flex gap-4 mt-2">
                                <div className="h-4 w-8 bg-muted rounded"></div>
                                <div className="h-4 w-8 bg-muted rounded"></div>
                                <div className="h-4 w-8 bg-muted rounded"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : tweets.length > 0 ? (
                  <div className="space-y-4">
                    {tweets.map((tweet) => (
                      <TweetCard key={tweet._id} tweet={tweet} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to post a message!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add this style tag to the document head or include in your global CSS */}
      <style jsx global>{`
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
  )
}

