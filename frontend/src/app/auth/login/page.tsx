"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock } from "lucide-react";
import { Mascot } from "@/components/Mascot";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Can be email or username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'learning' | 'celebrating' | 'error'>('idle');
  const [companionPet, setCompanionPet] = useState<'dog' | 'cat' | 'fox' | 'robot' | 'bunny'>('robot');
  
  const router = useRouter();
  const { setUser, setAuthenticated } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pet = localStorage.getItem("spark_mascot_type") as any || "robot";
      setCompanionPet(pet);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMascotState('learning');

    try {
      console.log("[Login] Starting login for:", identifier);
      
      const isEmail = identifier.includes('@');
      const loginData = isEmail 
        ? { email: identifier, password }
        : { username: identifier, password };

      const axios = (await import('axios')).default;
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';
      
      const response = await axios.post(`${BACKEND_URL}/users/login`, loginData, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data.data;
      const userData = data.user || data;
      const userId = userData._id || userData.id;
      
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
        }
        
        try {
          const accountTokensStr = localStorage.getItem("account_tokens");
          const accountTokens = accountTokensStr ? JSON.parse(accountTokensStr) : {};
          accountTokens[userId] = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          };
          localStorage.setItem("account_tokens", JSON.stringify(accountTokens));
        } catch (err) {
          console.error("Failed to save account tokens", err);
        }
      }

      setUser(userData);
      setAuthenticated(true);
      setMascotState('celebrating');

      // Save to known accounts in localStorage
      try {
        const knownAccountsStr = localStorage.getItem("known_accounts");
        let knownAccounts: any[] = knownAccountsStr ? JSON.parse(knownAccountsStr) : [];
        
        if (userId) {
          knownAccounts = knownAccounts.filter(acc => (acc._id || acc.id) !== userId);
          knownAccounts.unshift({
            _id: userId,
            username: userData.username,
            fullName: userData.fullName,
            email: userData.email,
            avatar: userData.avatar
          });
          if (knownAccounts.length > 5) {
            knownAccounts = knownAccounts.slice(0, 5);
          }
          localStorage.setItem("known_accounts", JSON.stringify(knownAccounts));
        }
      } catch (err) {
        console.error("Failed to save known accounts", err);
      }

      toast({ title: "Login successful!" });
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      setMascotState('error');
      setTimeout(() => setMascotState('idle'), 2500);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Mascot Coach Column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-6 bg-card border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden w-full max-w-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 blur-3xl -mr-16 -mt-16"></div>
            <h3 className="heading-font text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Companion Assistant</h3>
            
            <Mascot state={mascotState} level={5} type={companionPet} />
            
            <div className="mt-4 p-4 bg-background/50 rounded-2xl border border-white/5">
              <p className="text-sm font-medium text-gray-300">
                {mascotState === 'idle' && "Hey! Ready to learn some code today? Let's sign in!"}
                {mascotState === 'learning' && "Verifying your developer credentials..."}
                {mascotState === 'celebrating' && "Access granted! Welcome back to Spark!"}
                {mascotState === 'error' && "Passcode rejected! Try checking your credentials."}
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Column */}
        <div className="md:col-span-7 w-full max-w-lg mx-auto">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-[#00d2ff] to-primary text-transparent bg-clip-text mb-4">
              ✨ Spark
            </h1>
            <p className="text-muted-foreground text-lg mt-3">
              Enter your credentials to access your personal workspace.
            </p>
          </div>

          <div className="bg-card p-8 md:p-10 rounded-2xl border shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-semibold mb-3">Email or Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-background border rounded-lg pl-12 pr-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="your.email@example.com or username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold mb-3">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border rounded-lg pl-12 pr-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="Your secure password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary via-[#00d2ff] to-primary text-primary-foreground hover:opacity-95 transition-all duration-300 shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <p className="text-base text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-primary hover:underline font-semibold text-lg transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
