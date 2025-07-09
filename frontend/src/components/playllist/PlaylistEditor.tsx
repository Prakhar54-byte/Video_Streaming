"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { TextArea } from "@/components/ui/TextArea"
import { Label } from "@/components/ui/Label"
import { Card } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tab"
import { Badge } from "@/components/ui/Badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/userAuth"
import { useToast } from "@/hooks/useToast"
import { playlistService } from "@/services/playlist.service"
import { GripVertical, Trash2, MoreVertical, Search, Plus, Save } from "lucide-react"

interface PlaylistEditorProps {
  playlist: {
    _id: string
    name: string
    description: string
    owner: string
    videos: string[]
    videoDetails?: Array<{
      _id: string
      title: string
      url: string
      thumbnail?: string
      duration?: number
    }>
  }
  onSave: (updatedPlaylist: any) => void
  onCancel: () => void
}

export function PlaylistEditor({ playlist, onSave, onCancel }: PlaylistEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [formData, setFormData] = useState({
    name: playlist.name,
    description: playlist.description,
  })
  const [playlistVideos, setPlaylistVideos] = useState(playlist.videoDetails || [])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const searchVideos = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      // API Call: GET /videos/search?q={query}&limit=10
      // This would need to be implemented in the backend
      // For now, we'll show empty results with a comment

      // const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}&limit=10`)
      // const result = await response.json()
      // setSearchResults(result.data)

      // Backend API needed: GET /api/v1/videos/search
      // Query Parameters: q (search query), limit (number of results)
      // Response: { success: boolean, data: Video[], message: string }

      setSearchResults([])
    } catch (error) {
      console.error("Error searching videos:", error)
    }
  }

  const addVideoToPlaylist = async (videoId: string) => {
    try {
      // API Call: PATCH /add/{videoId}/{playlistId}
      // Response: { success: boolean, statusCode: 200, data: playlist, message: "Video is added in playlist successfully" }

      const response = await playlistService.addVideoToPlaylist(videoId, playlist._id)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Video added to playlist",
        })

        // Refresh playlist data or update local state
        // You might want to refetch the playlist here
      } else {
        throw new Error(response.message || "Failed to add video")
      }
    } catch (error: any) {
      console.error("Error adding video:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add video to playlist",
        variant: "destructive",
      })
    }
  }

  const removeVideoFromPlaylist = async (videoId: string) => {
    try {
      // API Call: PATCH /remove/{videoId}/{playlistId}
      // Response: { success: boolean, statusCode: 200, data: playlist, message: "Video removed from playlist" }

      const response = await playlistService.removeVideoFromPlaylist(videoId, playlist._id)

      if (response.success) {
        setPlaylistVideos((prev) => prev.filter((v) => v._id !== videoId))

        toast({
          title: "Success",
          description: response.message || "Video removed from playlist",
        })
      } else {
        throw new Error(response.message || "Failed to remove video")
      }
    } catch (error: any) {
      console.error("Error removing video:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove video",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Playlist name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // API Call: PATCH /{playlistId}
      // Request body: { name: string, description: string }
      // Response: { success: boolean, statusCode: 200, data: playlist, message: "Playlist updated successfully" }

      const response = await playlistService.updatePlaylist(playlist._id, {
        name: formData.name,
        description: formData.description,
      })

      if (response.success) {
        const updatedPlaylist = {
          ...playlist,
          ...formData,
          videoDetails: playlistVideos,
          updatedAt: new Date().toISOString(),
        }

        onSave(updatedPlaylist)

        toast({
          title: "Success",
          description: response.message || "Playlist updated successfully",
        })
      } else {
        throw new Error(response.message || "Failed to update playlist")
      }
    } catch (error: any) {
      console.error("Error updating playlist:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update playlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="videos">Videos ({playlistVideos.length})</TabsTrigger>
          <TabsTrigger value="add-videos">Add Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter playlist name"
              maxLength={100}
              required
            />
            <div className="text-xs text-muted-foreground text-right">{formData.name.length}/100</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <TextArea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your playlist"
              maxLength={500}
              rows={4}
            />
            <div className="text-xs text-muted-foreground text-right">{formData.description.length}/500</div>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          {playlistVideos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No videos in this playlist</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlistVideos.map((video, index) => (
                <Card key={video._id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    </div>

                    <div className="flex-shrink-0">
                      <img
                        src={video.thumbnail || "/placeholder.svg?height=48&width=80"}
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {video.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {formatDuration(video.duration)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => removeVideoFromPlaylist(video._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add-videos" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-search">Search Videos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="video-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchVideos(e.target.value)
                }}
                placeholder="Search for videos to add..."
                className="pl-10"
              />
            </div>
          </div>

          {searchResults.length === 0 && searchQuery ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No videos found</p>
              <p className="text-xs text-muted-foreground mt-1">Backend API needed: GET /api/v1/videos/search</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Search for videos to add to your playlist</p>
              <p className="text-xs text-muted-foreground mt-1">Backend API needed: GET /api/v1/videos/search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((video: any) => (
                <Card key={video._id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <img
                        src={video.thumbnail || "/placeholder.svg?height=48&width=80"}
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {video.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {formatDuration(video.duration)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button size="sm" onClick={() => addVideoToPlaylist(video._id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
