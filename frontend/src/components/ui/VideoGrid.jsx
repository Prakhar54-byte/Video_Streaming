"use client"

import { useState, useEffect } from 'react'
import { List, AutoSizer, WindowScroller } from 'react-virtualized'
import VideoCard from './VideoCard'
import { useToast } from '@/hooks/useToast'

export default function VideoGrid({ featured = false, limit = 50 }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  const fetchVideos = async (pageNum) => {
    try {
      const url = featured 
        ? `/api/videos/featured?page=${pageNum}&limit=${limit}` 
        : `/api/videos?page=${pageNum}&limit=${limit}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (pageNum === 1) {
        setVideos(data.videos)
      } else {
        setVideos(prev => [...prev, ...data.videos])
      }
      
      setHasMore(data.videos.length === limit)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos(1)
  }, [featured, limit])

  const loadMore = () => {
    if (!hasMore || loading) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchVideos(nextPage)
  }

  const rowRenderer = ({ index, key, style }) => {
    const video = videos[index]
    if (!video) return null

    return (
      <div key={key} style={style}>
        <VideoCard video={video} />
      </div>
    )
  }

  if (loading && videos.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <WindowScroller>
      {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
        <AutoSizer disableHeight>
          {({ width }) => {
            const itemsPerRow = Math.floor(width / 300)
            const rowCount = Math.ceil(videos.length / itemsPerRow)

            return (
              <div ref={registerChild}>
                <List
                  autoHeight
                  height={height}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  rowCount={rowCount}
                  rowHeight={350}
                  rowRenderer={rowRenderer}
                  scrollTop={scrollTop}
                  width={width}
                  onRowsRendered={({ overscanStopIndex }) => {
                    if (overscanStopIndex === rowCount - 1) {
                      loadMore()
                    }
                  }}
                />
              </div>
            )
          }}
        </AutoSizer>
      )}
    </WindowScroller>
  )
}