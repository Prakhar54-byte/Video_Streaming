"use client"

import { useState, useEffect } from "react"
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
  TrendingUpIcon as Trending,
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { Card, CardContent } from "@/components/ui/Card"
import { Textarea } from "@/components/ui/Textarea"

export default function HomePage() {
  const router = useRouter()
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [videos, setVideos] = useState([])
  const [tweets, setTweets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("videos")
  const [tweetContent, setTweetContent] = useState("")
  const [isSubmittingTweet, setIsSubmittingTweet] = useState(false)

  // Fetch videos and tweets on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch videos
        const videosResponse = await fetch("/api/videos?limit=25")
        const videosData = await videosResponse.json()
        setVideos(videosData.videos || [])

        // Fetch tweets/messages
        const tweetsResponse = await fetch("/api/tweets")
        const tweetsData = await tweetsResponse.json()
        setTweets(tweetsData.tweets || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      if (!response.ok) throw new Error("An error occurred while logging out")
      router.push("/auth/login")
    } catch (error) {
      console.log("Error logging out", error)
    }
  }

  // Handle create button click
  const handleCreateClick = async () => {
    try {
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
        alert("Error checking channel: " + data.message)
      }
    } catch (error) {
      console.log("Error checking channel", error)
      alert("Error checking channel: " + error)
    }
  }

  // Handle tweet/message submission
  const handleTweetSubmit = async (e) => {
    e.preventDefault()

    if (!tweetContent.trim()) {
      alert("Please enter a message")
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
      } else {
        const error = await response.json()
        alert("Error posting message: " + error.message)
      }
    } catch (error) {
      console.error("Error posting message:", error)
      alert("Error posting message")
    } finally {
      setIsSubmittingTweet(false)
    }
  }

  // Video Card Component for better organization
  const VideoCard = ({ video }) => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
      <div className="aspect-video relative bg-muted overflow-hidden">
        <Image
          src={video.thumbnail || `/placeholder.svg?height=200&width=350&text=Video+${video.id}`}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 rounded">
          {formatDuration(video.duration || 0)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={video.owner?.avatar} alt={video.owner?.username} />
            <AvatarFallback>{video.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold line-clamp-2">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.owner?.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatViews(video.views)} views • {formatTimeAgo(video.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Tweet/Message Card Component
  const TweetCard = ({ tweet }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={tweet.owner?.avatar} alt={tweet.owner?.username} />
            <AvatarFallback>{tweet.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{tweet.owner?.fullName}</p>
              <p className="text-sm text-muted-foreground">@{tweet.owner?.username}</p>
              <p className="text-xs text-muted-foreground">• {formatTimeAgo(tweet.createdAt)}</p>
            </div>
            <p className="mt-1">{tweet.content}</p>
            <div className="flex gap-4 mt-3">
              <button className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> {Math.floor(Math.random() * 10)}
              </button>
              <button className="text-muted-foreground hover:text-red-500 text-sm flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-heart"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>{" "}
                {tweet.likes || 0}
              </button>
              <button className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1">
                <Bookmark className="h-4 w-4" />
              </button>
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
    return views.toString()
  }

  const formatTimeAgo = (dateString) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Home className="h-5 w-5" />
              <span className="hidden md:inline-block">Home</span>
            </Link>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" className="w-full rounded-full bg-muted pl-10 md:w-60 lg:w-80" />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="default" className="rounded-full gap-2" onClick={handleCreateClick}>
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline-block">Create</span>
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
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
                <Link href="/" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Home</span>
                </Link>

                <Link href="/explore" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <Hash className="h-5 w-5" />
                  <span className="font-medium">Explore</span>
                </Link>

                <Link href="/trending" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <Trending className="h-5 w-5" />
                  <span className="font-medium">Trending</span>
                </Link>

                <Link href="/playlists" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <List className="h-5 w-5" />
                  <span className="font-medium">Playlists</span>
                </Link>

                <Link href="/notifications" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notifications</span>
                </Link>

                <Link href="/messages" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Messages</span>
                </Link>

                <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>

              <div className="pt-4">
                <h3 className="mb-2 px-3 text-lg font-semibold">Subscriptions</h3>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Link key={i} href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{String.fromCharCode(65 + i)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">Channel {i + 1}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={sidebarVisible ? "" : "col-span-full"}>
          <Tabs defaultValue="videos" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="tweets">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
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
              ) : (
                <div className="grid gap-4 transition-all duration-300 ease-in-out grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tweets">
              <div className="max-w-2xl mx-auto">
                {/* Tweet/Message input form */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <form onSubmit={handleTweetSubmit}>
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <Textarea
                            placeholder="What's happening?"
                            value={tweetContent}
                            onChange={(e) => setTweetContent(e.target.value)}
                            className="resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmittingTweet || !tweetContent.trim()}>
                              {isSubmittingTweet ? "Posting..." : "Post"}
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
                ) : (
                  <div className="space-y-4">
                    {tweets.map((tweet) => (
                      <TweetCard key={tweet._id} tweet={tweet} />
                    ))}
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

