"use client"
import { useState, useEffect } from 'react'
import VideoCard from './VideoCard'
import axios from 'axios'

export default function VideoGrid({ featured = false, limit = 12 }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const url = featured 
          ? `${process.env.NEXT_PUBLIC_API_URL}/videos/featured?limit=${limit}` 
          : `${process.env.NEXT_PUBLIC_API_URL}/videos?limit=${limit}`
        
        const response = await axios.get(url)
        setVideos(response.data)
        setLoading(false)
      } catch (err) {
        setError('Failed to load videos')
        setLoading(false)
      }
    }

    fetchVideos()
  }, [featured, limit])

  if (loading) return <div className="text-center py-8">Loading videos...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map(video => (
        <VideoCard key={video._id} video={video} />
      ))}
      
      {videos.length === 0 && (
        <div className="col-span-full text-center py-8">
          No videos found
        </div>
      )}
    </div>
  )
}
