"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock } from "lucide-react";
import { formatViewCount, formatTimeAgo } from "@/lib/utils";
import apiClient from "@/lib/api";
import video from "video.js";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  processingStatus?: "pending" | "processing" | "completed" | "failed";
}

interface VideoCardProps {
  video: Video;
}

const backendOrigin = (() => {
  const base = (apiClient.defaults.baseURL || "").toString();
  if (base) return base.replace(/\/api\/v1\/?$/, "");
  const envBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "").toString();
  if (envBase) return envBase.replace(/\/api\/v1\/?$/, "");
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").toString();
  if (apiUrl) return apiUrl.replace(/\/api\/v1\/?$/, "");
  return "http://localhost:8000";
})();

const toBackendAssetUrl = (maybePath?: string) => {
  if (!maybePath) return "";
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  const normalized = maybePath.replace(/\\/g, "/").replace(/^\//, "");
  const withoutPublic = normalized.startsWith("public/")
    ? normalized.slice("public/".length)
    : normalized;
  return `${backendOrigin}/${withoutPublic}`;
};

console.log("Views, ", formatTimeAgo("2023-10-10T10:00:00Z"));

export function VideoCard({ video }: VideoCardProps) {
  const duration = Math.floor(video?.duration);
  const min = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <Link href={`/video/${video._id}`}>
      <div className="group relative flex flex-col gap-3 cursor-pointer">
        {/* Thumbnail Container */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
          {video?.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toBackendAssetUrl(video?.thumbnail)}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Processing Overlay */}
          {video.processingStatus === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="text-white text-xs font-medium">
                  Processing...
                </span>
              </div>
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
            {min}:{String(seconds).padStart(2, "0")}
          </div>

          {!video.isPublished && (
            <Badge className="absolute top-2 right-2 bg-yellow-500/90 hover:bg-yellow-500 text-black border-none backdrop-blur-sm">
              Draft
            </Badge>
          )}
        </div>

        {/* Info Section */}
        <div className="flex gap-3 px-1">
          <Avatar className="w-9 h-9 flex-shrink-0 border border-white/10">
            <AvatarImage
              src={video.owner?.avatar}
              alt={video.owner?.fullName}
            />
            <AvatarFallback>{video.owner?.fullName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <h3 className="font-semibold leading-tight line-clamp-2 text-sm group-hover:text-primary transition-colors">
              {video?.title}
            </h3>
            <div className="text-xs text-muted-foreground flex flex-col">
              <span className="hover:text-foreground transition-colors">
                {video.owner?.fullName}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span>{formatViewCount(video?.views)} views</span>
                <span className="text-[10px]">•</span>
                <span>{formatTimeAgo(video?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
