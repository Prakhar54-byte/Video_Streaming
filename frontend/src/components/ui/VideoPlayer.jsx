"use client"

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export default function VideoPlayer({ src, poster, autoplay = false }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current
    const options = {
      controls: true,
      responsive: true,
      fluid: true,
      poster: poster,
      autoplay: autoplay,
      playbackRates: [0.5, 1, 1.5, 2],
      html5: {
        vhs: {
          overrideNative: true
        }
      }
    }

    // Initialize video.js player
    const player = videojs(video, options)
    playerRef.current = player

    // Setup HLS if the source is an m3u8 stream
    if (src?.endsWith('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferSize: 30 * 1000 * 1000, // 30MB max buffer size
        maxBufferLength: 60, // 60 seconds max buffer
        enableWorker: true, // Enable web workers
        lowLatencyMode: true
      })
      
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          player.play()
        }
      })

      // Handle quality switching
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const quality = hls.levels[data.level]
        console.log(`Quality switched to ${quality.height}p`)
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
      }
    }
  }, [src, poster, autoplay])

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
      >
        <source src={src} type="application/x-mpegURL" />
        <p className="vjs-no-js">
          To view this video please enable JavaScript, and consider upgrading to a
          web browser that supports HTML5 video
        </p>
      </video>
    </div>
  )
}