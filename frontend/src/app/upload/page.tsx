'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, Image as ImageIcon, X, CheckCircle, Sparkles } from 'lucide-react';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { ThumbnailGeneratorModal } from '@/components/video/ThumbnailGeneratorModal';

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    videoFile: File | null;
    thumbnail: File | null;
  }>({
    title: '',
    description: '',
    videoFile: null,
    thumbnail: null,
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
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('videoFile', formData.videoFile);
      formDataToSend.append('thumbnail', formData.thumbnail);

      console.log('Uploading to:', apiClient.defaults.baseURL + '/videos');
      console.log('Form data:', {
        title: formData.title,
        description: formData.description,
        videoFileName: formData.videoFile.name,
        thumbnailName: formData.thumbnail.name,
      });

      const response = await apiClient.post('/videos', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      console.log('Upload successful:', response.data);

      toast({
        title: 'Upload Complete! 🎉',
        description: 'Your video is now live and visible on your channel.',
      });

      // Clear form
      setFormData({
        title: '',
        description: '',
        videoFile: null,
        thumbnail: null,
      });
      setPreviews({ video: '', thumbnail: '' });

      // Redirect to my-channel with refresh
      setTimeout(() => {
        router.push('/my-channel');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setUploadProgress(0);
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
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-card border rounded-xl p-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">Uploading...</span>
                <span className="text-base text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress === 100 && (
                <div className="flex items-center gap-2 mt-4 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-base font-semibold">Upload complete!</span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isUploading}
              className="flex-1 py-6 text-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !formData.videoFile || !formData.thumbnail}
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
