"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { 
  Home, Video, MessageSquare, Upload, 
  User, Menu, X, LogOut, Bell 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-card border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/spark-logo.svg" alt="Spark" className="w-8 h-8" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
                Spark
              </h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-base py-6">
              <Home className="w-6 h-6" />
              {sidebarOpen && <span className="ml-3 font-medium">Home</span>}
            </Button>
          </Link>
          <Link href="/videos">
            <Button variant="ghost" className="w-full justify-start text-base py-6">
              <Video className="w-6 h-6" />
              {sidebarOpen && <span className="ml-3 font-medium">Videos</span>}
            </Button>
          </Link>
          <Link href="/subscribed">
            <Button variant="ghost" className="w-full justify-start text-base py-6">
              <Bell className="w-6 h-6" />
              {sidebarOpen && <span className="ml-3 font-medium">Subscribed</span>}
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" className="w-full justify-start text-base py-6">
              <MessageSquare className="w-6 h-6" />
              {sidebarOpen && <span className="ml-3 font-medium">Messages</span>}
            </Button>
          </Link>
          <Link href="/upload">
            <Button variant="ghost" className="w-full justify-start text-base py-6">
              <Upload className="w-6 h-6" />
              {sidebarOpen && <span className="ml-3 font-medium">Upload</span>}
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          {user && (
            <>
              <div className="flex items-center gap-3 mb-4 p-2">
                {user.avatar && (
                  <img 
                    src={user.avatar} 
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                  />
                )}
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{user.fullName || user.username}</p>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                  </div>
                )}
              </div>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start text-base py-6 mb-2">
                  <User className="w-6 h-6" />
                  {sidebarOpen && <span className="ml-3 font-medium">Profile</span>}
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-base py-6 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-6 h-6" />
                {sidebarOpen && <span className="ml-3 font-medium">Logout</span>}
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
