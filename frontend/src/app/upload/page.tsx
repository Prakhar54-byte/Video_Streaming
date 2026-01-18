'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, Image as ImageIcon, X, CheckCircle, Sparkles, Globe, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { ThumbnailGeneratorModal } from '@/components/video/ThumbnailGeneratorModal';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { useVideoProcessingStatus, useUploadProgress } from '@/hooks/useVideoProcessing';

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkingChannel, setCheckingChannel] = useState(true);

  // Use custom hooks for upload progress tracking
  const uploadProgressHook = useUploadProgress();
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handleProcessingComplete = useCallback((status: any) => {
    uploadProgressHook.setComplete();
    toast({
      title: "Video Ready! 🎉",
      description: "Your video has been processed and is now available.",
    });
    setTimeout(() => {
      router.push('/my-channel');
    }, 2000);
  }, [uploadProgressHook, toast, router]);

  const handleProcessingError = useCallback((error: string) => {
    uploadProgressHook.setError(error);
    toast({
      title: "Processing Failed",
      description: error,
      variant: "destructive",
    });
  }, [uploadProgressHook, toast]);
  
  // Poll for processing status after upload
  const { status: processingStatus } = useVideoProcessingStatus({
    videoId: uploadedVideoId,
    pollInterval: 3000,
    onComplete: handleProcessingComplete,
    onError: handleProcessingError,
  });

  useEffect(() => {
    const checkChannel = async () => {
      try {
        const response = await apiClient.get('/channels/user/current');
        if (!response.data.data) {
          toast({
            title: "Channel Required",
            description: "You need to create a channel before uploading videos.",
            variant: "destructive",
          });
          router.push('/'); 
        }
      } catch (error) {
        console.error("Error checking channel:", error);
        toast({
          title: "Error",
          description: "Could not verify channel status.",
          variant: "destructive",
        });
        router.push('/');
      } finally {
        setCheckingChannel(false);
      }
    };
    checkChannel();
  }, [router, toast]);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    videoFile: File | null;
    thumbnail: File | null;
    isDraft: boolean;
    category: string;
  }>({
    title: '',
    description: '',
    videoFile: null,
    thumbnail: null,
    isDraft: false,
    category: 'all',
  });
  
  const [previews, setPreviews] = useState<{
    video: string;
    thumbnail: string;
  }>({
    video: '',
    thumbnail: '',
  });

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, videoFile: file }));
      
      const videoUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, video: videoUrl }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, thumbnail: file }));
      setPreviews(prev => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
    }
  };

  const handleThumbnailGenerated = (thumbnailFile: File) => {
    setFormData(prev => ({ ...prev, thumbnail: thumbnailFile }));
    setPreviews(prev => ({ ...prev, thumbnail: URL.createObjectURL(thumbnailFile) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide title and description',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.videoFile || !formData.thumbnail) {
      toast({
        title: 'Missing files',
        description: 'Please select both video and thumbnail',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    uploadProgressHook.setUploading(0, formData.videoFile.name);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('videoFile', formData.videoFile);
      formDataToSend.append('thumbnail', formData.thumbnail);
      formDataToSend.append('isPublished', String(!formData.isDraft));

      const response = await apiClient.post('/videos', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          uploadProgressHook.setUploading(percentCompleted, formData.videoFile?.name);
        },
      });

      // Get the video ID from response and start polling for processing status
      const videoId = response.data.data?._id || response.data.data?.video?._id;
      if (videoId) {
        setUploadedVideoId(videoId);
        uploadProgressHook.setProcessing();
      }

      toast({
        title: 'Upload Successful! 🚀',
        description: 'Your video has been uploaded and is currently processing.',
      });

      // Don't clear form until processing is complete - the hook will handle redirect
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
      uploadProgressHook.setError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearVideo = () => {
    setFormData(prev => ({ ...prev, videoFile: null }));
    setPreviews(prev => ({ ...prev, video: '' }));
  };

  const clearThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail: null }));
    setPreviews(prev => ({ ...prev, thumbnail: '' }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoFile: null,
      thumbnail: null,
      isDraft: false,
      category: 'all',
    });
    setPreviews({ video: '', thumbnail: '' });
    setUploadedVideoId(null);
    uploadProgressHook.reset();
  };

  if (checkingChannel) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Upload Video</h1>
          <p className="text-lg text-muted-foreground">
            Share your content with the Spark community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Video Upload */}
          <div className="bg-card border rounded-xl p-8">
            <label className="block text-xl font-semibold mb-4">
              Video File <span className="text-destructive">*</span>
            </label>
            
            {!formData.videoFile ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/20">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Video className="w-16 h-16 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-lg font-semibold">Click to upload video</p>
                  <p className="text-base text-muted-foreground">MP4, WebM, or OGG (MAX. 10GB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoChange}
                  disabled={isUploading}
                />
              </label>
            ) : (
              <div className="relative">
                <video
                  src={previews.video}
                  controls
                  className="w-full rounded-lg max-h-96"
                />
                <button
                  type="button"
                  onClick={clearVideo}
                  disabled={isUploading}
                  className="absolute top-4 right-4 bg-destructive text-destructive-foreground p-2 rounded-full hover:opacity-90"
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="mt-3 text-base text-muted-foreground">{formData.videoFile.name}</p>
              </div>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="bg-card border rounded-xl p-8">
            <div className="flex justify-between items-center mb-4">
                <label className="block text-xl font-semibold">
                Thumbnail <span className="text-destructive">*</span>
                </label>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    disabled={!formData.videoFile || isUploading}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate from Video
                </Button>
            </div>
            
            {!formData.thumbnail ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/20">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-base font-semibold">Click to upload thumbnail</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isUploading}
                />
              </label>
            ) : (
              <div className="relative w-full rounded-lg h-64 overflow-hidden">
                <Image
                  src={previews.thumbnail}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={clearThumbnail}
                  disabled={isUploading}
                  className="absolute top-4 right-4 bg-destructive text-destructive-foreground p-2 rounded-full hover:opacity-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="bg-card border rounded-xl p-8 space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-3">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full py-4 px-4 text-base bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter video title"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full py-4 px-4 text-base bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] resize-none"
                placeholder="Tell viewers about your video"
                disabled={isUploading}
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-lg font-semibold mb-3">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full py-4 px-4 text-base bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isUploading}
              >
                <option value="all">General</option>
                <option value="music">Music</option>
                <option value="gaming">Gaming</option>
                <option value="education">Education</option>
                <option value="fitness">Fitness</option>
                <option value="cooking">Cooking</option>
                <option value="movies">Movies</option>
                <option value="news">News</option>
                <option value="programming">Coding</option>
                <option value="art">Art & Design</option>
                <option value="photography">Photography</option>
              </select>
            </div>

            {/* Publish/Draft Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                {formData.isDraft ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Globe className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <Label htmlFor="draft-toggle" className="text-base font-semibold cursor-pointer">
                    {formData.isDraft ? 'Save as Draft' : 'Publish Immediately'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isDraft 
                      ? 'Video will be saved as private draft. You can publish it later.'
                      : 'Video will be publicly visible after processing.'}
                  </p>
                </div>
              </div>
              <Switch
                id="draft-toggle"
                checked={formData.isDraft}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDraft: checked }))}
                disabled={isUploading || uploadProgressHook.stage !== 'idle'}
              />
            </div>
          </div>

          {/* Upload Progress - Using UploadProgress component */}
          {uploadProgressHook.stage !== 'idle' && (
            <UploadProgress
              progress={uploadProgressHook.progress}
              status={uploadProgressHook.stage}
              fileName={formData.videoFile?.name}
              errorMessage={uploadProgressHook.stage === 'error' ? uploadProgressHook.message : undefined}
            />
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (uploadProgressHook.stage !== 'idle') {
                  resetForm();
                } else {
                  router.back();
                }
              }}
              disabled={isUploading}
              className="flex-1 py-6 text-lg"
            >
              {uploadProgressHook.stage !== 'idle' ? 'Upload Another' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !formData.videoFile || !formData.thumbnail || uploadProgressHook.stage === 'processing'}
              className="flex-1 py-6 text-lg font-semibold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:opacity-90"
            >
              {isUploading ? 'Uploading...' : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </form>

        {formData.videoFile && (
            <ThumbnailGeneratorModal
                videoFile={formData.videoFile}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onThumbnailGenerated={handleThumbnailGenerated}
            />
        )}
      </div>
    </MainLayout>
  );
}
