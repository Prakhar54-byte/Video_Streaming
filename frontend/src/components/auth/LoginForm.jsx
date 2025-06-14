"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/CheckBox";
import { useToast } from "@/hooks/useToast";

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" })); // Clear error as user types
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }));
  };

  const validate = () => {
    const newErrors = {
      username: "",
      email: "",
      password: "",
    };

    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const storage = formData.rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", data.accessToken);

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-lg">
      <div className="hidden md:block w-1/2 bg-primary/10 relative p-8">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <div className="w-4/5 h-4/5 relative">
              <Image
                src="/login/stock-vector-dragon-sun-mascot-logo.jpeg"
                width={430}
                height={500}
                alt="Login illustration"
                className="object-contain"
              />
              <div className="absolute bottom-10 left-0 right-0 text-center bg-white/90 py-4 px-6 rounded-lg shadow-md">
                <p className="text-primary font-semibold">
                  Start for free and get attractive offers from the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-white p-8 md:p-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight">Login to your Account</h1>
            <p className="text-muted-foreground">See what is going on with your business</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  className={`pl-10 ${errors.username ? "border-red-500" : ""}`}
                />
              </div>
              {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                />
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Remember Me
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Register Prompt */}
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
