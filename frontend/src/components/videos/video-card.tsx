"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { Play, Clock, Eye, ThumbsUp, MoreVertical } from "lucide-react"

export function VideoCard({ video, layout = "grid" }) {
  const [isHovered, setIsHovered] = useState(false)

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatViews = (views) => {
    if (!views) return "0 views"
    if (views < 1000) return `${views} views`
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`
    return `${(views / 1000000).toFixed(1)}M views`
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  if (layout === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="relative flex-shrink-0">
              <Link href={`/watch/${video._id}`}>
                <div
                  className="relative w-48 h-28 bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Image
                    src={
                      video.thumbnail || `/placeholder.svg?height=112&width=192&text=${video.title?.slice(0, 2) || "V"}`
                    }
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                  {isHovered && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <Link href={`/watch/${video._id}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer">
                      {video.title}
                    </h3>
                  </Link>
                  <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                    <span>{formatViews(video.views)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(video.createdAt)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Link href={`/channel/${video.owner?._id}`}>
                  <Avatar className="h-6 w-6 cursor-pointer">
                    <AvatarImage src={video.owner?.avatar || "/placeholder.svg"} alt={video.owner?.username} />
                    <AvatarFallback className="text-xs">
                      {video.owner?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link href={`/channel/${video.owner?._id}`}>
                  <span className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    {video.owner?.username}
                  </span>
                </Link>
              </div>

              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{video.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/watch/${video._id}`}>
            <div
              className="relative w-full aspect-video bg-gray-200 rounded-t-lg overflow-hidden cursor-pointer"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Image
                src={video.thumbnail || `/placeholder.svg?height=180&width=320&text=${video.title?.slice(0, 2) || "V"}`}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {isHovered && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>
          </Link>
        </div>

        <div className="p-4">
          <div className="flex space-x-3">
            <Link href={`/channel/${video.owner?._id}`}>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={video.owner?.avatar || "/placeholder.svg"} alt={video.owner?.username} />
                <AvatarFallback>{video.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watch/${video._id}`}>
                <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer mb-1">
                  {video.title}
                </h3>
              </Link>

              <Link href={`/channel/${video.owner?._id}`}>
                <p className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">{video.owner?.username}</p>
              </Link>

              <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                <Eye className="h-3 w-3" />
                <span>{formatViews(video.views)}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(video.createdAt)}</span>
              </div>

              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{video.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
