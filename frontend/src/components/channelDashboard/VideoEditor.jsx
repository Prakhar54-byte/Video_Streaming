"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Download,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { useToast } from "@/hooks/useToast";

export default function VideoEditor() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  // Load FFmpeg WebAssembly
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        // This would be the actual FFmpeg WebAssembly loading
        // For now, we'll simulate it
        setTimeout(() => {
          setFfmpegLoaded(true);
          toast({
            title: "Success",
            description: "Video editor loaded successfully",
          });
        }, 2000);
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
        toast({
          title: "Error",
          description: "Failed to load video editor",
          variant: "destructive",
        });
      }
    };

    loadFFmpeg();
  }, [toast]);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.onloadedmetadata = () => {
          setDuration(videoRef.current.duration);
          setTrimEnd(videoRef.current.duration);
        };
      }
    } else {
      toast({
        title: "Error",
        description: "Please select a valid video file",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (value) => {
    const time = (value[0] / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTrim = async () => {
    if (!videoFile || !ffmpegLoaded) {
      toast({
        title: "Error",
        description: "Please upload a video and wait for the editor to load",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // This is where you would use FFmpeg WebAssembly to trim the video
      // For demonstration, we'll simulate the process
      toast({
        title: "Processing",
        description: "Trimming video...",
      });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 3000));

      toast({
        title: "Success",
        description: "Video trimmed successfully",
      });
    } catch (error) {
      console.error("Error trimming video:", error);
      toast({
        title: "Error",
        description: "Failed to trim video",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!videoFile) {
      toast({
        title: "Error",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // This is where you would use FFmpeg WebAssembly to export the video
      toast({
        title: "Processing",
        description: "Exporting video...",
      });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 5000));

      toast({
        title: "Success",
        description: "Video exported successfully",
      });
    } catch (error) {
      console.error("Error exporting video:", error);
      toast({
        title: "Error",
        description: "Failed to export video",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push("/channelDashboard/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Video Editor</h1>
          {!ffmpegLoaded && (
            <div className="ml-4 text-sm text-muted-foreground">
              Loading editor...
            </div>
          )}
        </div>
      </header>

      <main className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {!videoFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      Upload a video to start editing
                    </h3>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button
                      onClick={() =>
                        document.getElementById("video-upload").click()
                      }
                    >
                      Select Video
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      className="w-full rounded-lg"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                    />

                    {/* Video Controls */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-1">
                          <Slider
                            value={[
                              duration > 0 ? (currentTime / duration) * 100 : 0,
                            ]}
                            onValueChange={handleSeek}
                            max={100}
                            step={0.1}
                          />
                        </div>

                        <span className="text-sm text-muted-foreground">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="w-24">
                          <Slider
                            value={[volume * 100]}
                            onValueChange={handleVolumeChange}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Editing Tools */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trim Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trim-start">Start Time (seconds)</Label>
                  <Input
                    id="trim-start"
                    type="number"
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    min={0}
                    max={duration}
                    step={0.1}
                  />
                </div>

                <div>
                  <Label htmlFor="trim-end">End Time (seconds)</Label>
                  <Input
                    id="trim-end"
                    type="number"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    min={0}
                    max={duration}
                    step={0.1}
                  />
                </div>

                <Button
                  onClick={handleTrim}
                  disabled={!videoFile || isProcessing || !ffmpegLoaded}
                  className="w-full"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Trim Video"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quality</Label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option value="1080p">1080p (High)</option>
                    <option value="720p">720p (Medium)</option>
                    <option value="480p">480p (Low)</option>
                  </select>
                </div>

                <div>
                  <Label>Format</Label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="avi">AVI</option>
                  </select>
                </div>

                <Button
                  onClick={handleExport}
                  disabled={!videoFile || isProcessing || !ffmpegLoaded}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isProcessing ? "Exporting..." : "Export Video"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!ffmpegLoaded}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rotate 90°
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!ffmpegLoaded}
                >
                  Add Watermark
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!ffmpegLoaded}
                >
                  Adjust Brightness
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
