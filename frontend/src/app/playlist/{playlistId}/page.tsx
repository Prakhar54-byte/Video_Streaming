"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PlaylistPlayer } from "@/components/playllist/PlaylistPlayer"
import { VideoPlayer } from "@/components/ui/VideoPlayer"
import { playlistService } from "@/services/playlist.service"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { EmptyState } from "@/components/common/EmptyState"

export default function PlaylistPage() {
  const params = useParams()
  const playlistId = params.playlistId as string
  const [playlist, setPlaylist] = useState(null)
  const [currentVideoId, setCurrentVideoId] = useState("")
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlaylist()
  }, [playlistId])

  const fetchPlaylist = async () => {
    try {
      setLoading(true)
      const response = await playlistService.getPlaylistById(playlistId)

      if (response.success && response.data && response.data.length > 0) {
        const playlistData = response.data[0]
        setPlaylist(playlistData)

        if (playlistData.videoDetails && playlistData.videoDetails.length > 0) {
          setCurrentVideoId(playlistData.videoDetails[0]._id)
          setCurrentVideoIndex(0)
        }
      }
    } catch (error) {
      console.error("Error fetching playlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = (videoId: string, index: number) => {
    setCurrentVideoId(videoId)
    setCurrentVideoIndex(index)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
                title="Playlist not found"
                description="The playlist you're looking for doesn't exist or has been removed." icon={""}        />
      </div>
    )
  }

  const currentVideo = playlist.videoDetails?.find((v) => v._id === currentVideoId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-3">
            {currentVideo ? (
              <div className="space-y-4">
                <VideoPlayer src={currentVideo.url} poster={currentVideo.thumbnail} title={currentVideo.title} onTimeUpdate={undefined} onEnded={undefined} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentVideo.title}</h1>
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <span>From playlist: {playlist.name}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Video {currentVideoIndex + 1} of {playlist.videoDetails?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No video selected" description="Select a video from the playlist to start watching." icon={""} />
            )}
          </div>

          {/* Playlist Sidebar */}
          <div className="lg:col-span-1">
            <PlaylistPlayer
              playlistId={playlistId}
              currentVideoId={currentVideoId}
              onVideoSelect={handleVideoSelect}
              className="sticky top-4"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
