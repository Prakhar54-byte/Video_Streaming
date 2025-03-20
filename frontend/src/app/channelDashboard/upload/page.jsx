"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X } from "lucide-react"





import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"

export default function UploadPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    category: "",
    visibility: "public",
  })

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setVideoData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setVideoData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle video file selection
  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
    }
  }

  // Handle thumbnail file selection
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear selected video
  const clearVideo = () => {
    setVideoFile(null)
  }

  // Clear selected thumbnail
  const clearThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!videoFile) {
      alert("Please select a video file to upload")
      return
    }

    if (!videoData.title.trim()) {
      alert("Please enter a video title")
      return
    }

    setIsUploading(true)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 500)

    try {
      // In a real app, you would use FormData to handle file uploads
      const formData = new FormData()
      formData.append("title", videoData.title)
      formData.append("description", videoData.description)
      formData.append("category", videoData.category)
      formData.append("visibility", videoData.visibility)
      formData.append("video", videoFile)
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile)
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Complete progress
      setUploadProgress(100)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/channel/dashboard")
      }, 1000)
    } catch (error) {
      console.error("Error uploading video:", error)
      alert("Error uploading video. Please try again.")
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/channel/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Upload Video</h1>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Video</CardTitle>
            <CardDescription>
              Share your content with the world. Videos can be public, unlisted, or private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!videoFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Drag and drop your video file</h3>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                  <Input id="video" type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                  <Button type="button" onClick={() => document.getElementById("video").click()}>
                    Select Video
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{videoFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearVideo}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="mt-4">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-in-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-right mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={videoData.title}
                    onChange={handleInputChange}
                    placeholder="My Awesome Video"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={videoData.description}
                    onChange={handleInputChange}
                    placeholder="Tell viewers about your video..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={videoData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="vlog">Vlog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={videoData.visibility}
                      onValueChange={(value) => handleSelectChange("visibility", value)}
                    >
                      <SelectTrigger id="visibility">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Custom Thumbnail</Label>
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                      <img
                        src={thumbnailPreview || "/placeholder.svg"}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={clearThumbnail}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Input id="thumbnail" type="file" accept="image/*" onChange={handleThumbnailChange} />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/channel/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !videoFile}>
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

