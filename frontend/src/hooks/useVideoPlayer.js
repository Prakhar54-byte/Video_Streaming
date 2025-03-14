import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function useVideoPlayer(videoUrl) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    
    if (!video || !videoUrl) return
    
    // Check if the video URL is an HLS stream
    if (videoUrl.includes('.m3u8')) {
      // Check if HLS is supported natively
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl
      } 
      // If not, use hls.js
      else if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(videoUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Video can be played
        })
        hls.on(Hls.Events.ERROR, (event, data) => {
          setError('Failed to load video stream')
        })
      } else {
        setError('HLS is not supported in this browser')
      }
    } else {
      // Regular video file
      video.src = videoUrl
    }
    
    // Event listeners
    const setVideoData = () => {
      setDuration(video.duration)
    }
    
    const updateProgress = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }
    
    const videoEnded = () => {
      setIsPlaying(false)
      setProgress(100)
    }
    
    const videoError = () => {
      setError('Failed to load video')
    }
    
    video.addEventListener('loadedmetadata', setVideoData)
    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('ended', videoEnded)
    video.addEventListener('error', videoError)
    
    return () => {
      video.removeEventListener('loadedmetadata', setVideoData)
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('ended', videoEnded)
      video.removeEventListener('error', videoError)
    }
  }, [videoUrl])

  const togglePlay = () => {
    const video = videoRef.current
    
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play()
      setIsPlaying(true)
    }
  }

  const handleProgress = (value) => {
    const video = videoRef.current
    const newTime = (value / 100) * duration
    
    video.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(value)
  }

  const handleVolume = (value) => {
    const video = videoRef.current
    
    video.volume = value
    setVolume(value)
  }

  return {
    videoRef,
    isPlaying,
    progress,
    duration,
    currentTime,
    volume,
    error,
    togglePlay,
    handleProgress,
    handleVolume
  }
}
