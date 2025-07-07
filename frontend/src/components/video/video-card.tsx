

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage,AvatarFallback } from "../ui/Avatar";
interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  views: number
  publishedAt: Date
  duration: string
  channelId: string
  channelName?: string
  channelAvatar?: string
}

export function VideoCard({
  id,
  title,
  thumbnail,
  views,
  publishedAt,
  duration,
  channelId,
  channelName,
  channelAvatar,
}: VideoCardProps) {
  // Format views (e.g., 1.2M, 4.5K)
  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className="group flex flex-col gap-2">
      <Link href={`/watch/${id}`} className="block">
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <Image
            src={thumbnail || "/placeholder.svg?height=200&width=360"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">{duration}</div>
        </div>
      </Link>

      <div className="flex gap-3 pt-2">
        <Link href={`/channel/${channelId}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={channelAvatar || "/placeholder.svg?height=36&width=36"} alt={channelName || "Channel"} />
            <AvatarFallback>{channelName?.charAt(0) || "C"}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/watch/${id}`}>
            <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
          </Link>

          <Link
            href={`/channel/${channelId}`}
            className="block mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {channelName || "Channel Name"}
          </Link>

          <div className="text-sm text-muted-foreground">
            <span>{formatViews(views)} views</span>
            <span className="mx-1">•</span>
            <span>{formatDistanceToNow(publishedAt, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}