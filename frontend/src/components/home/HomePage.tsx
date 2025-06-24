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
  Play,
  Clock,
  Eye,
  ThumbsUp,
  Upload,
  MoreVertical,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tab"
import { Card, CardContent } from "@/components/ui/Card"
import { Textarea } from "@/components/ui/TextArea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown-menu"
import { Badge } from "@/components/ui/Badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip"
import { useToast } from "@/hooks/useToast.js"

interface Video {
  _id: string
  title: string
  description: string
  thumbnail?: string
  duration: number
  views: number
  owner: {
    _id: string
    username: string
    fullName: string
    avatar: string
  }
  createdAt: string
  isPublished: boolean
}

interface Tweet {
  _id: string
  content: string
  owner: {
    _id: string
    username: string
    fullName: string
    avatar: string
  }
  createdAt: string
  likes: number
  liked?: boolean
}

interface User {
  _id: string
  username: string
  fullName: string
  email: string
  avatar: string
  coverImage?: string
}

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // State management
  const [user, setUser] = useState<User | null>(null)
  const[userLoaded , setUserLoaded] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
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
  const [subscriptions, setSubscriptions] = useState([])

  console.log("This is home page");
  

  // Check authentication and fetch initial data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verify token and get user data using cookies
        const userResponse = await fetch("http://localhost:8000/api/v1/users/current-user", {
          credentials: "include"
        })

        if (!userResponse.ok) {
          router.push("/auth/login")
          return
        }

        const userData = await userResponse.json()
        setUser(userData.data)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login")
      }finally{
        setUserLoaded(true)
      }
    }

    checkAuth()
  }, [router])

  // Fetch videos and tweets
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      setIsLoading(true)
      try {
        // Fetch videos
        const videosResponse = await fetch("http://localhost:8000/api/v1/videos?page=1&limit=25&sortBy=createdAt&sortType=-1", {
          credentials: "include"
        })
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          setVideos(videosData.data.videos || [])
          setFilteredVideos(videosData.data.videos || [])
        }

        // Fetch tweets
        const tweetsResponse = await fetch("http://localhost:8000/api/v1/tweets", {
          credentials: "include"
        })
        
        if (tweetsResponse.ok) {
          const tweetsData = await tweetsResponse.json()
          setTweets(tweetsData.data || [])
        }

        // Fetch subscriptions
        const subscriptionsResponse = await fetch("http://localhost:8000/api/v1/subscriptions/c/subscribed", {
          credentials: "include"
        })
        
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json()
          setSubscriptions(subscriptionsData.data || [])
        }

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

    if(userLoaded && user){
      fetchData()
    }

    console.log("Fetching data for user:", user?.username);
    

  }, [user, toast,userLoaded])

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    document.body.classList.add("layout-transitioning")
    setSidebarVisible(!sidebarVisible)
    setTimeout(() => {
      document.body.classList.remove("layout-transitioning")
    }, 300)
  }

  // Handle logout
  const handleLogout = async () => {
    const isConfirmed = window.confirm("Are you sure you want to logout?")
    if (!isConfirmed) return

    try {
      await fetch("http://localhost:8000/api/v1/users/logout", {
        method: "POST",
        credentials: "include"
      })
      
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      })

      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle create/upload button click
  const handleCreateClick = async () => {
    try {
      // Check if user has a channel
      const channelResponse = await fetch("/api/channel/dashboard", {
        credentials: "include"
      })

      if (channelResponse.ok) {
        const data = await channelResponse.json()
        if (data.primaryChannel) {
          router.push("/channelDashboard/dashboard")
        } else {
          router.push("/channelDashboard/create")
        }
      } else {
        router.push("/channelDashboard/create")
      }
    } catch (error) {
      console.error("Error checking channel", error)
      toast({
        title: "Error",
        description: "Error checking channel. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle tweet submission
  const handleTweetSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch("http://localhost:8000/api/v1/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: tweetContent }),
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json()
        setTweets([data.data, ...tweets])
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
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setFilteredVideos(videos)
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(`http://localhost:8000/api/v1/videos?query=${encodeURIComponent(searchQuery)}&page=1&limit=25`, {
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json()
        setFilteredVideos(data.data.videos || [])
        
        if (data.data.videos.length === 0) {
          toast({
            title: "No results",
            description: `No videos found for "${searchQuery}"`,
          })
        } else {
          toast({
            title: "Search results",
            description: `Found ${data.data.videos.length} videos for "${searchQuery}"`,
          })
        }
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
  const handleLikeTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/likes/toggle/t/${tweetId}`, {
        method: "POST",
        credentials: "include"
      })

      if (response.ok) {
        setTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId
              ? { ...tweet, likes: tweet.liked ? tweet.likes - 1 : tweet.likes + 1, liked: !tweet.liked }
              : tweet
          )
        )

        toast({
          title: "Success",
          description: "Like updated",
        })
      }
    } catch (error) {
      console.error("Error liking tweet:", error)
    }
  }

  // Handle sorting videos
  const handleSortVideos = (option: string) => {
    setSortOption(option)

    const sorted = [...filteredVideos]

    switch (option) {
      case "recent":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "popular":
        sorted.sort((a, b) => b.views - a.views)
        break
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      default:
        break
    }

    setFilteredVideos(sorted)
  }

  // Helper functions
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views?.toString() || "0"
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "Unknown time"

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

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

  // Video Card Component
  const VideoCard = ({ video }: { video: Video }) => (
    <div className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="aspect-video relative bg-muted overflow-hidden">
        <Image
          src={video.thumbnail || "/placeholder.svg?height=200&width=350"}
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
            <AvatarFallback>{video.owner?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
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

  // Tweet Card Component
  const TweetCard = ({ tweet }: { tweet: Tweet }) => (
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  console.log("This is User:", user);
  

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

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
              <span className="hidden md:inline-block">Spark</span>
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
                          onClick={() => setShowNotifications(false)}
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
                </div>
              )}
            </div>

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
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/channelDashboard/dashboard")}>
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
                  href="/videos"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <Video className="h-5 w-5" />
                  <span className="font-medium">Videos</span>
                </Link>

                <Link
                  href="/tweets"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Tweets</span>
                </Link>

                <Link
                  href="/playlists"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <List className="h-5 w-5" />
                  <span className="font-medium">Playlists</span>
                </Link>

                <Link
                  href="/likes"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span className="font-medium">Liked Videos</span>
                </Link>

                <Link
                  href="/comments"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Comments</span>
                </Link>

                <Link
                  href="/subscriptions"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Subscriptions</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-red-100 hover:text-red-600 text-left transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>

              {subscriptions.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2 px-3">
                    <h3 className="text-lg font-semibold">Subscriptions</h3>
                  </div>
                  {subscriptions.slice(0, 5).map((subscription: any, i) => (
                    <Link
                      key={subscription._id || i}
                      href={`/channel/${subscription.channel?._id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors duration-200"
                    >
                      <Avatar className="h-6 w-6 transition-transform duration-200 hover:scale-110">
                        <AvatarImage src={subscription.channel?.avatar} alt={subscription.channel?.name} />
                        <AvatarFallback>{subscription.channel?.name?.[0] || 'C'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{subscription.channel?.name || `Channel ${i + 1}`}</span>
                    </Link>
                  ))}
                  {subscriptions.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-2 text-primary hover:bg-primary/10 transition-colors duration-200"
                      onClick={() => router.push("/subscriptions")}
                    >
                      Show more
                    </Button>
                  )}
                </div>
              )}
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
                  <p className="text-muted-foreground mb-4">We couldn&apos;t find any videos matching your search.</p>
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
                          <AvatarImage src={user.avatar} alt={user.username} />
                          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
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
    </div>
  )
}