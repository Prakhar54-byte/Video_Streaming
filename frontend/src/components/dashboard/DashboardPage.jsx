"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, BarChart, Video, Users, Settings, Bell, MessageSquare, Search, Menu } from 'lucide-react'

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/hooks/useAuth"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSubscribers: 0,
    totalVideos: 0,
    recentActivity: []
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // In a real app, you would fetch data from your API
        // For now, we'll simulate a delay and use mock data
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalViews: 45600,
          totalSubscribers: 1250,
          totalVideos: 24,
          recentActivity: [
            { id: 1, type: 'comment', user: 'John Doe', content: 'Great video!', time: '2 hours ago' },
            { id: 2, type: 'subscription', user: 'Jane Smith', content: 'subscribed to your channel', time: '5 hours ago' },
            { id: 3, type: 'like', user: 'Mike Johnson', content: 'liked your video', time: '1 day ago' },
            { id: 4, type: 'comment', user: 'Sarah Williams', content: 'This was so helpful, thanks!', time: '2 days ago' },
          ]
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-10 border-r bg-card">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Video className="h-5 w-5 text-primary" />
              <span>Video Platform</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-2">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              <Link
                href="/channel/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Video className="h-5 w-5" />
                <span className="font-medium">My Channel</span>
              </Link>
              
              <Link
                href="/analytics"
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <BarChart className="h-5 w-5" />
                <span className="font-medium">Analytics</span>
              </Link>
              
              <Link
                href="/subscribers"
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Subscribers</span>
              </Link>
              
              <Link
                href="/messages"
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">Messages</span>
              </Link>
              
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/images/avatar-placeholder.png" alt={user?.fullName || "User"} />
                <AvatarFallback>{user?.fullName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{user?.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="md:pl-64 flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="w-full flex-1">
              <form>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-64 md:w-80 lg:w-96"
                  />
                </div>
              </form>
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/images/avatar-placeholder.png" alt={user?.fullName || "User"} />
              <AvatarFallback>{user?.fullName?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </header>
          <main className="grid gap-4 p-4 sm:p-6 md:gap-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <div className="flex items-center gap-2">
                <Button onClick={() => router.push("/channel/upload")}>Upload Video</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+18% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <p className="text-xs text-muted-foreground">+2 this month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{activity.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            <span className="font-semibold">{activity.user}</span> {activity.content}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" onClick={() => router.push("/channel/upload")}>
                    <Video className="mr-2 h-4 w-4" />
                    Upload New Video
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/channel/dashboard")}>
                    <BarChart className="mr-2 h-4 w-4" />
                    View Channel Analytics
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/messages")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Check Messages
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
