"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {  Mail, Lock } from "lucide-react";
// import { log } from "console";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Can be email or username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if identifier is email or username

      console.log("This dumb fuck has identifier lets see what info it has in identifier",identifier);
      
      const isEmail = identifier.includes('@');
      const loginData = isEmail 
        ? { email: identifier, password }
        : { username: identifier, password };

      console.log("Sending login data:", { ...loginData, password: "***" });

      const response = await apiClient.post("/users/login", loginData);

      setUser(response.data.data.user);
      setAuthenticated(true);
      toast({ title: "Login successful!" });
      router.push("/");
    } catch (error: any) {
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
      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text mb-4">
            ✨ Spark
          </h1>
          <p className="text-muted-foreground text-lg mt-3">
            Welcome back! Sign in to continue to Spark.
          </p>
        </div>

        <div className="bg-card p-10 rounded-xl border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
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
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:from-orange-600 hover:via-red-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
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
  );
}
