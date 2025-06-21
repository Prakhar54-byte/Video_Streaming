"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Upload, 
  Video, 
  Image as ImageIcon, 
  X, 
  Play,
  Eye,
  EyeOff,
  Save,
  FileVideo,
  Clock,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/TextArea";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";

interface VideoData {
  title: string;
  description: string;
  videoFile: File | null;
  thumbnail: File | null;
  isPublished: boolean;
  category: string;
  tags: string[];
}

export default function UploadVideoForm() {
  const router = useRouter();
  const { toast } = useToast();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoData, setVideoData] = useState<VideoData>({
    title: "",
    description: "",
    videoFile: null,
    thumbnail: null,
    isPublished: true,
    category: "",
    tags: []
  });
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const categories = [
    "Entertainment",
    "Education",
    "Gaming",
    "Music",
    "Sports",
    "Technology",
    "Travel",
    "Cooking",
    "Fashion",
    "News",
    "Comedy",
    "Documentary"
  ];

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVideoData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle video file upload
 const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  
  // Only process if there's a file and it's different from the current one
  if (file && (!videoData.videoFile || file.name !== videoData.videoFile.name || 
      file.size !== videoData.videoFile.size || file.lastModified !== videoData.videoFile.lastModified)) {
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Please select a valid video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (500MB limit)
    if (file.size > 500 * 1024 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Video size should be less than 500MB",
        variant: "destructive"
      });
      return;
    }

    // Update state with new file
    setVideoData(prev => ({
      ...prev,
      videoFile: file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, "")
    }));

    // Create video preview
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      URL.revokeObjectURL(video.src);
    };
    video.src = videoUrl;
    
    // Clear the input value to ensure onChange fires even if the same file is selected
    e.target.value = '';
  }
};

  // Handle thumbnail upload
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Thumbnail size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setVideoData(prev => ({
        ...prev,
        thumbnail: file
      }));
      

      // Create thumbnail preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tag addition
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!videoData.tags.includes(tagInput.trim()) && videoData.tags.length < 10) {
        setVideoData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
        setTagInput("");
      }
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setVideoData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoData.videoFile) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    if (!videoData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video title",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {

      const formData = new FormData();
      formData.append("title", videoData.title);
      formData.append("description", videoData.description);
      formData.append("videoFile", videoData.videoFile);
      if (videoData.thumbnail) {
        formData.append("thumbnail", videoData.thumbnail);
      }
      formData.append("isPublished", videoData.isPublished.toString());

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch("http://localhost:8000/api/v1/videos/", {
        method: "POST",
        
        credentials: "include",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Video uploaded successfully!",
        });
        router.push("/channelDashboard/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to upload video",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 hover:bg-primary/10 transition-colors duration-200" 
            onClick={() => router.push("/channelDashboard/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Upload Video</h1>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileVideo className="h-5 w-5" />
                    Video File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!videoData.videoFile ? (
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Upload your video</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop a video file or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: MP4, MOV, AVI, WMV (Max: 500MB)
                      </p>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Video className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{videoData.videoFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(videoData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                              {videoDuration > 0 && ` • ${formatDuration(videoDuration)}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVideoData(prev => ({ ...prev, videoFile: null }));
                            setVideoPreview(null);
                            setVideoDuration(0);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {videoPreview && (
                        <div className="relative">
                          <video 
                            src={videoPreview} 
                            controls 
                            className="w-full max-h-64 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={videoData.title}
                      onChange={handleInputChange}
                      placeholder="Enter video title"
                      required
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      {videoData.title.length}/100 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={videoData.description}
                      onChange={handleInputChange}
                      placeholder="Tell viewers about your video"
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {videoData.description.length}/5000 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={videoData.category} onValueChange={(value) => 
                      setVideoData(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tags (press Enter to add)"
                      disabled={videoData.tags.length >= 10}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {videoData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {videoData.tags.length}/10 tags
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Thumbnail */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Thumbnail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!thumbnailPreview ? (
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors aspect-video"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Upload thumbnail</p>
                    
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                    
                     <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setVideoData(prev => ({ ...prev, thumbnail: null }));
                          setThumbnailPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        1280x720 recommended
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visibility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {videoData.isPublished ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {videoData.isPublished ? "Public" : "Private"}
                      </span>
                    </div>
                    <Switch
                      checked={videoData.isPublished}
                      onCheckedChange={(checked) => 
                        setVideoData(prev => ({ ...prev, isPublished: checked }))
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {videoData.isPublished 
                      ? "Anyone can search for and view this video"
                      : "Only you can view this video"
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {isUploading && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-center">
                        {uploadProgress.toFixed(0)}% uploaded
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/channelDashboard/dashboard")}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading || !videoData.videoFile}
              className="min-w-32"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {videoData.isPublished ? "Publish" : "Save Draft"}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}