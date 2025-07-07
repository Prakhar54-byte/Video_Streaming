import { VideoCard  } from "./video-card";

interface VideoGridProps {
    videos: any[];
}

export function VideoGrid({videos =[]}: VideoGridProps) {
    if(videos.length === 0){
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No videos found</p>
            </div>
        )
    }
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video._id}
          id={video._id}
          title={video.title}
          thumbnail={video.thumbnail}
          views={video.views}
          publishedAt={new Date(video.createdAt)}
          duration={video.duration || "0:00"}
          channelId={video.owner?._id}
          channelName={video.owner?.fullName}
          channelAvatar={video.owner?.avatar}
        />
      ))}
    </div>
  )
}