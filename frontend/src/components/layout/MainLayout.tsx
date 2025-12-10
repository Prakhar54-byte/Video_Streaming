"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Home,
  Video,
  MessageSquare,
  Upload,
  User,
  Menu,
  X,
  LogOut,
  Bell,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasChannel, setHasChannel] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const checkUserChannel = async () => {
      if (user) {
        try {
          // Check if user has any videos (which means they have a channel)
          const response = await apiClient.get(`/videos?page=1&limit=1`);
          const videos = response.data.data || [];
          const userVideos = videos.filter(
            (v: any) => v.owner?._id === user._id,
          );
          setHasChannel(userVideos.length > 0);
        } catch (error) {
          console.error("Error checking user channel:", error);
          setHasChannel(false);
        }
      }
    };

    checkUserChannel();
  }, [user]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout");
      logout();
      toast({ title: "Logged out successfully" });
      router.push("/auth/login");
    } catch (error) {
      toast({ title: "Error logging out", variant: "destructive" });
    }
  };

  const baseNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/videos", icon: Video, label: "Videos" },
    { href: "/subscribed", icon: Bell, label: "Subscribed" },
    { href: "/messages", icon: MessageSquare, label: "Messages" },
  ];

  const channelNavItem = {
    href: "/my-channel",
    icon: User,
    label: "My Channel",
  };
  const uploadNavItem = { href: "/upload", icon: Upload, label: "Upload" };

  // Only show "My Channel" if user has uploaded videos
  const navItems = [
    ...baseNavItems,
    ...(hasChannel ? [channelNavItem] : []),
    uploadNavItem,
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r transition-all duration-300 flex flex-col z-50",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
                Spark
              </h1>
            </div>
          )}
          {!sidebarOpen && (
            <Sparkles className="w-8 h-8 text-orange-500 mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-primary/10"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base py-6 transition-all duration-200",
                    active && "bg-primary text-primary-foreground shadow-md",
                    !active && "hover:bg-accent hover:translate-x-1",
                    !sidebarOpen && "justify-center px-0",
                  )}
                >
                  <Icon className={cn("w-6 h-6", active && "animate-pulse")} />
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                  {active && sidebarOpen && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section - Sticky at Bottom */}
        <div className="mt-auto border-t bg-card/95 backdrop-blur-sm">
          {user && (
            <>
              {/* User Info */}
              <div
                className={cn(
                  "p-4 transition-all duration-200 hover:bg-accent/50",
                  !sidebarOpen && "p-2",
                )}
              >
                <Link href="/profile" className="flex items-center gap-3 group">
                  <Avatar className="w-10 h-10 ring-2 ring-primary/20 group-hover:ring-primary transition-all">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  )}
                </Link>
              </div>

              <Separator />

              {/* Profile & Logout Buttons */}
              <div className="p-3 space-y-1">
                <Link href="/profile">
                  <Button
                    variant={pathname === "/profile" ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-sm py-5",
                      pathname === "/profile" &&
                        "bg-primary text-primary-foreground",
                      !sidebarOpen && "justify-center px-0",
                    )}
                  >
                    <User className="w-5 h-5" />
                    {sidebarOpen && (
                      <span className="ml-3 font-medium">Profile</span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm py-5 text-destructive hover:text-destructive hover:bg-destructive/10",
                    !sidebarOpen && "justify-center px-0",
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">Logout</span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-20",
        )}
      >
        {children}
      </main>
    </div>
  );
}
