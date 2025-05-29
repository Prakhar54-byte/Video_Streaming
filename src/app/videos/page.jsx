"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import VideoGrid from '@/components/ui/VideoGrid'

export default function VideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/videos', {
          credentials: 'include'
        })
        const data = await response.json()
        setVideos(data.videos)
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Videos</h1>
      <VideoGrid videos={videos} />
    </div>
  )
}