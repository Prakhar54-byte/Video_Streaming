"use client";

import { useState } from "react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Film,
  Scissors,
  FileDown,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoPreProcessorProps {
  file: File;
  onProcessed: (processedFile: Blob, thumbnail?: Blob) => void;
  onCancel: () => void;
}

export function VideoPreProcessor({
  file,
  onProcessed,
  onCancel,
}: VideoPreProcessorProps) {
  const { toast } = useToast();
  const {
    loaded,
    loading: ffmpegLoading,
    progress,
    load,
    compressVideo,
    generateThumbnail,
    trimVideo,
  } = useFFmpeg();

  const [processing, setProcessing] = useState(false);
  const [enableCompression, setEnableCompression] = useState(true);
  const [targetSizeMB, setTargetSizeMB] = useState(50);
  const [enableThumbnail, setEnableThumbnail] = useState(true);
  const [thumbnailTime, setThumbnailTime] = useState(1);

  const handleProcess = async () => {
    try {
      setProcessing(true);

      if (!loaded) {
        await load();
      }

      let processedFile: Blob = file;
      let thumbnailBlob: Blob | undefined;

      // Compress video if enabled
      if (enableCompression) {
        toast({
          title: "Compressing video...",
          description: "This may take a few moments",
        });

        processedFile = await compressVideo(file, targetSizeMB);

        toast({
          title: "Compression complete",
          description: `Original: ${(file.size / 1024 / 1024).toFixed(2)} MB → Compressed: ${(
            processedFile.size /
            1024 /
            1024
          ).toFixed(2)} MB`,
        });
      }

      // Generate thumbnail if enabled
      if (enableThumbnail) {
        toast({
          title: "Generating thumbnail...",
        });

        thumbnailBlob = await generateThumbnail(file, thumbnailTime);

        toast({
          title: "Thumbnail generated",
        });
      }

      onProcessed(processedFile, thumbnailBlob);
    } catch (error: any) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipProcessing = () => {
    onProcessed(file);
  };

  return (
    <div className="space-y-4">
      {/* FFmpeg Loading */}
      {ffmpegLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <div>
                <p className="font-medium">Loading video processor...</p>
                <p className="text-sm text-muted-foreground">
                  Downloading WebAssembly modules
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Video Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">File name:</span>
              <span className="font-medium">{file.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File size:</span>
              <span className="font-medium">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File type:</span>
              <span className="font-medium">{file.type}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compression Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5" />
                Compression
              </CardTitle>
              <CardDescription>
                Reduce file size before upload to save bandwidth
              </CardDescription>
            </div>
            <Switch
              checked={enableCompression}
              onCheckedChange={setEnableCompression}
            />
          </div>
        </CardHeader>
        {enableCompression && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Target size: {targetSizeMB} MB</Label>
                <Slider
                  value={[targetSizeMB]}
                  onValueChange={(v) => setTargetSizeMB(v[0])}
                  min={10}
                  max={200}
                  step={10}
                  className="mt-2"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Actual size may vary based on video complexity
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Thumbnail Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Thumbnail Generation
              </CardTitle>
              <CardDescription>
                Extract a frame to use as video thumbnail
              </CardDescription>
            </div>
            <Switch
              checked={enableThumbnail}
              onCheckedChange={setEnableThumbnail}
            />
          </div>
        </CardHeader>
        {enableThumbnail && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Extract at: {thumbnailTime} second(s)</Label>
                <Slider
                  value={[thumbnailTime]}
                  onValueChange={(v) => setThumbnailTime(v[0])}
                  min={1}
                  max={30}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <div>
                  <p className="font-medium">Processing video...</p>
                  <p className="text-sm text-muted-foreground">
                    {progress}% complete
                  </p>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleProcess}
          disabled={processing || ffmpegLoading}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Process & Upload
            </>
          )}
        </Button>

        <Button
          onClick={handleSkipProcessing}
          variant="outline"
          disabled={processing}
        >
          Skip Processing
        </Button>

        <Button onClick={onCancel} variant="ghost" disabled={processing}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
