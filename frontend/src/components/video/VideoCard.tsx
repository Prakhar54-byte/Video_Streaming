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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {video?.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toBackendAssetUrl(video?.thumbnail)}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {min}:{String(seconds).padStart(2, "0")}
          </div>
          {!video.isPublished && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Draft
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage
                src={video.owner?.avatar}
                alt={video.owner?.fullName}
              />
              <AvatarFallback>{video.owner?.fullName[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 text-sm mb-1">
                {video?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {video.owner?.fullName}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViewCount(video?.views)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(video?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
