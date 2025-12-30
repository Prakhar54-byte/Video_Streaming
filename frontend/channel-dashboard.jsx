"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Home, BarChart, Upload, Video, Users, Settings, LogOut, Menu, Search, Bell, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ChannelDashboard() {
  const router = useRouter()
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
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

  // Sample channel data
  const channelData = {
    name: "My Awesome Channel",
    subscribers: 1250,
    totalViews: 45600,
    totalVideos: 24,
    recentVideos: [
      { id: 1, title: "How to Build a Next.js App", views: "1.2K", timeAgo: "2 days ago" },
      { id: 2, title: "React Hooks Explained", views: "3.4K", timeAgo: "1 week ago" },
      { id: 3, title: "CSS Grid Tutorial", views: "2.8K", timeAgo: "2 weeks ago" },
      { id: 4, title: "JavaScript Tips and Tricks", views: "5.1K", timeAgo: "3 weeks ago" },
    ],
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
            <Link href="/channel/dashboard" className="flex items-center gap-2 font-semibold">
              <BarChart className="h-5 w-5" />
              <span className="hidden md:inline-block">Channel Dashboard</span>
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
            <Button variant="default" className="rounded-full gap-2" onClick={() => router.push("/channel/upload")}>
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline-block">Upload</span>
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Channel" />
              <AvatarFallback>{channelData.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        className="container grid grid-cols-1 gap-6 px-4 py-6"
        style={{ gridTemplateColumns: sidebarVisible ? "1fr 3fr" : "1fr" }}
      >
        {/* Sidebar */}
        {sidebarVisible && (
          <aside className="hidden md:block">
            <nav className="sticky top-20 space-y-2">
              <div className="space-y-1">
                <Link
                  href="/channel/dashboard"
                  className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary"
                >
                  <BarChart className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>

                <Link href="/channel/videos" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <Video className="h-5 w-5" />
                  <span className="font-medium">Content</span>
                </Link>

                <Link href="/channel/analytics" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <BarChart className="h-5 w-5" />
                  <span className="font-medium">Analytics</span>
                </Link>

                <Link href="/channel/comments" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Comments</span>
                </Link>

                <Link
                  href="/channel/subscribers"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Subscribers</span>
                </Link>

                <Link href="/channel/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Settings</span>
                </Link>

                <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Back to Home</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={sidebarVisible ? "" : "col-span-full"}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Channel Dashboard</h1>
              <Button onClick={() => router.push("/channel/upload")}>
                <Upload className="mr-2 h-4 w-4" /> Upload Video
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{channelData.subscribers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{channelData.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+18% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{channelData.totalVideos}</div>
                  <p className="text-xs text-muted-foreground">+2 this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.6%</div>
                  <p className="text-xs text-muted-foreground">+0.8% from last month</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="recent">
              <TabsList>
                <TabsTrigger value="recent">Recent Videos</TabsTrigger>
                <TabsTrigger value="popular">Popular Videos</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="recent" className="space-y-4">
                <h2 className="text-xl font-semibold mt-4">Recent Videos</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {channelData.recentVideos.map((video) => (
                    <Card key={video.id}>
                      <div className="aspect-video relative bg-muted">
                        <Image
                          src={`/placeholder.svg?height=200&width=350&text=Video+${video.id}`}
                          alt={video.title}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-1">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {video.views} views • {video.timeAgo}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="popular">
                <div className="rounded-lg border bg-card p-8 text-center">
                  <h3 className="text-lg font-medium">Popular Videos</h3>
                  <p className="text-muted-foreground">View your most popular content here.</p>
                </div>
              </TabsContent>
              <TabsContent value="analytics">
                <div className="rounded-lg border bg-card p-8 text-center">
                  <h3 className="text-lg font-medium">Analytics Overview</h3>
                  <p className="text-muted-foreground">Detailed analytics will appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

