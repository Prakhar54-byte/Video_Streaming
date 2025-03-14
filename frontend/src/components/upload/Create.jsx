"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button.jsx"
import { Input } from "@/components/ui/Input.jsx"
import { Upload, ArrowLeft } from "lucide-react"

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!videoFile) {
      setError('Please select a video file')
      return
    }
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('video', videoFile)
    
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile)
    }
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload video')
      }
      
      const data = await response.json()
      router.push(`/video/${data.id}`)
    } catch (err) {
      setError(err.message || 'Failed to upload video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Create New Video</h1>
        </div>
      </header>

      <div className="container py-8 px-4 max-w-3xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Video Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] px-3 py-2 border rounded-md"
              placeholder="Enter video description"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Video</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">MP4, WebM, or Ogg</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Thumbnail (Optional)</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">JPG, PNG, or GIF</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full"
              />
            </div>
          </div>
          
          {loading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Uploading: {progress}%
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </form>
      </div>
    </div>
  )
}
