import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function VideoCard({ video }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link href={`/video/${video._id}`}>
        <div className="relative h-48 w-full">
          <Image 
            src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'} 
            alt={video.title}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/video/${video._id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition">{video.title}</h3>
        </Link>
        
        <Link href={`/channel/${video.creator._id}`}>
          <p className="text-gray-600 dark:text-gray-400 text-sm hover:text-primary transition">
            {video.creator.username}
          </p>
        </Link>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{video.views} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
