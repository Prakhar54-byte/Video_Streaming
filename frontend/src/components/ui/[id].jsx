import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import useVideoPlayer from "@/hooks/useToast";
import { useAuth } from "@/context/AuthContext";

export default function VideoPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/videos/${id}`,
        );
        setVideo(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load video");
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const videoUrl = video
    ? `${process.env.NEXT_PUBLIC_API_URL}/videos/${id}/stream`
    : "";
  const {
    videoRef,
    isPlaying,
    progress,
    duration,
    currentTime,
    volume,
    error: playerError,
    togglePlay,
    handleProgress,
    handleVolume,
  } = useVideoPlayer(videoUrl);

  if (loading) return <div className="text-center py-8">Loading video...</div>;
  if (error || playerError) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || playerError}
      </div>
    );
  }
  if (!video) return <div className="text-center py-8">Video not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-auto"
          onClick={togglePlay}
          poster={video.thumbnailUrl}
        />

        {/* Custom video controls */}
        <div className="bg-gray-900 p-4">
          <div className="flex items-center mb-2">
            <button onClick={togglePlay} className="text-white mr-4">
              {isPlaying ? "Pause" : "Play"}
            </button>

            <div className="flex-1 mx-4">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => handleProgress(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => handleVolume(Math.max(0, volume - 0.1))}
              className="text-white px-2"
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolume(parseFloat(e.target.value))}
              className="w-1/2 mx-2"
            />
            <button
              onClick={() => handleVolume(Math.min(1, volume + 0.1))}
              className="text-white px-2"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Video information */}
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex items-center mt-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-500">{video.views} views</span>
            <span className="mx-2">•</span>
            <span className="text-sm text-gray-500">
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <p className="mt-4">{video.description}</p>
      </div>
    </div>
  );
}

// Format seconds to MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
