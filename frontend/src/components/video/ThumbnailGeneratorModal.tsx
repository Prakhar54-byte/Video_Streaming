"use client";

import { useState, useRef, useEffect } from 'react';
import { useThumbnailGenerator } from '@/hooks/useThumbnailGenerator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThumbnailGeneratorModalProps {
  videoFile: File;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThumbnailGenerated: (thumbnailFile: File) => void;
}

export function ThumbnailGeneratorModal({
  videoFile,
  open,
  onOpenChange,
  onThumbnailGenerated,
}: ThumbnailGeneratorModalProps) {
  const { toast } = useToast();
  const { isLoaded, isLoading, load, generateThumbnail } = useThumbnailGenerator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [timestamp, setTimestamp] = useState(1);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open && !isLoaded && !isLoading) {
      load();
    }
  }, [open, isLoaded, isLoading, load]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast({ title: 'Generating thumbnail...', description: 'This may take a moment.' });
    
    const thumbnailBlob = await generateThumbnail(videoFile, timestamp);
    
    if (thumbnailBlob) {
      const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
      onThumbnailGenerated(thumbnailFile);
      toast({ title: 'Thumbnail generated successfully!' });
      onOpenChange(false);
    } else {
      toast({ title: 'Failed to generate thumbnail', variant: 'destructive' });
    }
    
    setIsGenerating(false);
  };

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Thumbnail</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ maxHeight: '50vh' }}>
            <video
              ref={videoRef}
              src={URL.createObjectURL(videoFile)}
              controls
              className="max-w-full max-h-[50vh] object-contain"
              onLoadedMetadata={handleVideoMetadata}
            />
          </div>
          {videoDuration > 0 && (
            <div className="space-y-2">
              <Label htmlFor="timestamp-slider">Select Timestamp: {timestamp.toFixed(1)}s</Label>
              <Slider
                id="timestamp-slider"
                min={0}
                max={videoDuration}
                step={0.1}
                value={[timestamp]}
                onValueChange={(value) => setTimestamp(value[0])}
              />
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleGenerate} disabled={!isLoaded || isGenerating || isLoading}>
            {(isLoading || isGenerating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading Processor...' : isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
