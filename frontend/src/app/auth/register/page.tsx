"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import apiClient from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    avatar: null as File | null,
    coverImage: null as File | null,
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatar" | "coverImage",
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);

      if (formData.avatar) {
        formDataToSend.append("avatar", formData.avatar);
      }
      if (formData.coverImage) {
        formDataToSend.append("coverImage", formData.coverImage);
      }

      const response = await apiClient.post("/users/register", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUser(response.data.data.user);

      toast({
        title: "Success!",
        description: "Account created successfully. Welcome to Spark!",
      });

      router.push("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
            ✨ Spark
          </h1>
          <p className="text-lg text-muted-foreground">
            Create your account and join the community
          </p>
        </div>

        <div className="bg-card border border-border p-10 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="w-full py-4 px-12 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value.toLowerCase().replace(/\s/g, ""),
                    }))
                  }
                  className="w-full py-4 px-12 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Choose a unique username"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full py-4 px-12 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full py-4 px-12 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Profile Picture <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => handleFileChange(e, "avatar")}
                  className="w-full py-4 px-12 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {formData.avatar && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {formData.avatar.name}
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Cover Image{" "}
                <span className="text-muted-foreground text-sm">
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "coverImage")}
                  className="w-full py-4 px-12 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {formData.coverImage && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {formData.coverImage.name}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-lg font-semibold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-transparent bg-clip-text hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
