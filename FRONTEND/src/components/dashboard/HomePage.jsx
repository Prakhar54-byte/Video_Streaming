"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, Home, User, Hash, List, Bell, MessageSquare, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/Button.jsx"
import { Input } from "@/components/ui/Input.jsx"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar.jsx"
import LoginForm from "../auth/LoginForm"

export default function HomePage() {
  const router = useRouter()

  const handleLogout =async () => {
    // Ask for confirmation before logging out
    const isConfirmed = window.confirm("Are you sure you want to logout?")
    if(!isConfirmed) return

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      if(!response.ok) throw new Error("An error occurred while logging out")
      router.push("/auth/login")
      
    } catch (error) {
      console.error("Error logging out", error)
      
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/auth/dashboard" className="flex items-center gap-2 font-semibold">
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
            <Button variant="default" className="rounded-full gap-2">
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
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden md:block md:col-span-1">
          <nav className="sticky top-20 space-y-2">
            <div className="space-y-1">
              <Link
                href="/auth/dashboard"
                className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </Link>

              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <Hash className="h-5 w-5" />
                <span className="font-medium">Explore</span>
              </Link>

              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <List className="h-5 w-5" />
                <span className="font-medium">Playlists</span>
              </Link>

              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <Bell className="h-5 w-5" />
                <span className="font-medium">Notifications</span>
              </Link>

              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">Messages</span>
              </Link>

              <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
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

        {/* Main Content */}
        <main className="md:col-span-3">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="aspect-video relative bg-muted">
                  <Image
                    src={`/placeholder.svg?height=200&width=350&text=Video+${i + 1}`}
                    alt={`Video ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{String.fromCharCode(65 + i)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">Title {i + 1}</h3>
                      <p className="text-sm text-muted-foreground">Channel {i + 1}</p>
                      <p className="text-xs text-muted-foreground">10K views • 3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

