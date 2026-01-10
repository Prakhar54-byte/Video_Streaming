"use client";

import { useState, useEffect } from "react";
import { 
  LogOut, Plus, Settings, 
  Check, MoreVertical
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";
import axios from "axios";
import { TiltCard } from "@/components/ui/tilt-card";

// Mock other accounts for demonstration
// const MOCK_ACCOUNTS: any[] = [];

export function UserAccountMenu({ 
  user, 
  sidebarOpen, 
  logout 
}: { 
  user: any, 
  sidebarOpen: boolean, 
  logout: () => void 
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [otherAccounts, setOtherAccounts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const knownAccountsStr = localStorage.getItem("known_accounts");
      if (knownAccountsStr) {
        const accounts = JSON.parse(knownAccountsStr);
        const currentUserId = user._id || user.id;
        
        // Filter out current user
        setOtherAccounts(accounts.filter((acc: any) => {
          const accId = acc._id || acc.id;
          return accId && accId !== currentUserId;
        }));
      }
    } catch (err) {
      console.error("Failed to load known accounts", err);
    }
  }, [user._id, user.id]);

  const handleSwitchAccount = async (account: any) => {
    const targetUserId = account._id || account.id;
    console.log("[Switch] Switching to:", account.username, targetUserId);
    
    try {
      const accountTokensStr = localStorage.getItem("account_tokens");

      if (accountTokensStr) {
        const accountTokens = JSON.parse(accountTokensStr);
        const tokens = accountTokens[targetUserId];
        
        if (tokens && tokens.refreshToken) {
          // Verify the stored token actually belongs to the target user
          try {
            const payloadPart = tokens.refreshToken.split('.')[1];
            const decoded = JSON.parse(atob(payloadPart));
            console.log("Devoe",decoded._id);
            console.log("target",targetUserId);
            
            
            if (decoded._id !== targetUserId) {
              console.error("[Switch] Stored token is corrupt! Belongs to:", decoded._id);
              toast({ 
                title: `Session for @${account.username} is invalid`, 
                description: "Please log in again",
                variant: "destructive" 
              });
              router.push("/auth/login");
              setIsOpen(false);
              return;
            }
          } catch (decodeErr) {
            console.error("[Switch] Could not verify token:", decodeErr);
          }
          
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

          try {
            // We intentionally force a refresh to ensure:
            // 1. The token is valid
            // 2. The httpOnly cookies are updated to match the target user
            const refreshRes = await axios.post(
                `${BACKEND_URL}/users/refresh-token`,
                { refreshToken: tokens.refreshToken },
                { withCredentials: true }
            );

            if (refreshRes.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
                
                // Verify we got the correct user back
                try {
                  const newPayload = accessToken.split('.')[1];
                  const newDecoded = JSON.parse(atob(newPayload));
                  if (newDecoded._id !== targetUserId) {
                    console.error("[Switch] Backend returned wrong user:", newDecoded._id);
                    toast({ 
                      title: "Switch failed", 
                      description: "Session mismatch. Please log in again.",
                      variant: "destructive" 
                    });
                    router.push("/auth/login");
                    setIsOpen(false);
                    return;
                  }
                } catch (e) {
                  console.error("[Switch] Could not verify result:", e);
                }
                
                console.log("[Switch] Success! Updating storage...");
                localStorage.setItem("accessToken", accessToken);
                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }
                
                // Update the account tokens map
                const currentMap = JSON.parse(localStorage.getItem("account_tokens") || "{}");
                currentMap[targetUserId] = {
                    accessToken: accessToken,
                    refreshToken: newRefreshToken || tokens.refreshToken
                };
                localStorage.setItem("account_tokens", JSON.stringify(currentMap));

                toast({ title: `Switched to @${account.username}` });
                window.location.reload();
                return;
            }
          } catch (refreshErr) {
            console.error("Session refresh failed for target account:", refreshErr);
            // Fall through to login redirect
          }
        }
      }
      
      console.log("Switch fallback: Redirecting to login");
      toast({ title: `Please log in as @${account.username}` });
      router.push("/auth/login");
    } catch (err) {
      console.error("Error switching account", err);
      router.push("/auth/login");
    }
    setIsOpen(false);
  };

  const handleAddAccount = () => {
    toast({ title: "Redirecting to login..." });
    router.push("/auth/login?add_account=true");
    setIsOpen(false);
  };

  const handleSignOutAll = async () => {
    try {
      await apiClient.post("/users/logout"); // Assuming this clears server session
      logout();
      toast({ title: "Signed out from all accounts" });
      router.push("/auth/login");
    } catch (error) {
      toast({ title: "Error signing out", variant: "destructive" });
    }
  };

  const renderAccountContent = (accountUser: any, isActive: boolean) => (
    <div className="relative flex items-center gap-3">
      <div className="relative">
        <Avatar className={cn("w-10 h-10 ring-2 transition-all", isActive ? "ring-orange-500" : "ring-transparent group-hover:ring-primary/20")}>
          <AvatarImage src={accountUser.avatar} alt={accountUser.username} />
          <AvatarFallback className={cn(isActive ? "bg-gradient-to-br from-orange-500 to-red-500 text-white" : "")}>
            {accountUser.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        {isActive && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-background" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <p className={cn("font-semibold text-sm truncate transition-colors", isActive ? "text-orange-600 dark:text-orange-400" : "group-hover:text-primary")}>
          {accountUser.fullName || accountUser.username}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          @{accountUser.username}
        </p>
      </div>

      {isActive && <Check className="w-4 h-4 text-orange-500" />}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="w-full">
          <TiltCard 
            isActive={isOpen}
            className={cn(
              "p-4 w-full transition-all duration-200",
              !sidebarOpen && "p-2 justify-center"
            )}
          >
            <div className="flex items-center gap-3 group">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20 group-hover:ring-primary transition-all">
                <AvatarImage src={user.avatar} alt={user.username}  className="w-10 h-10" />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  {user.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              )}
              {sidebarOpen && <MoreVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </TiltCard>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start" side="right" sideOffset={20}>
        <div className="space-y-4">
          {/* Header */}
          <div className="px-2 py-1.5">
            <h3 className="font-semibold text-sm text-muted-foreground">Accounts</h3>
          </div>

          {/* Active Account */}
          <TiltCard 
            isActive={true} 
            onClick={() => {
              router.push("/profile");
              setIsOpen(false);
            }}
            className="p-4"
          >
            {renderAccountContent(user, true)}
          </TiltCard>

          {/* Other Accounts */}
          <div className="space-y-1">
            {otherAccounts.map((account) => (
              <TiltCard 
                key={account._id} 
                onClick={() => handleSwitchAccount(account)}
                className="p-4"
              >
                {renderAccountContent(account, false)}
              </TiltCard>
            ))}
          </div>

          {/* Add Account */}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 h-auto py-3"
            onClick={handleAddAccount}
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-dashed border-muted-foreground/50">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Add another account</span>
          </Button>

          <div className="h-px bg-border my-2" />

          {/* Settings & Logout */}
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="text-[10px]">
                  {user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              Profile
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={() => router.push("/settings")}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOutAll}
            >
              <LogOut className="w-4 h-4" />
              Sign out of all accounts
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}