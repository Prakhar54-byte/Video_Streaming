/**
 * Duplicate Detection Panel Component
 * UI for video duplicate detection using perceptual hashing
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  CheckCircle,
  AlertTriangle,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";
import useVideoHash from "@/hooks/useVideoHash";

interface DuplicateResult {
  videoId: string;
  similarity: number;
  matchType: "exact" | "near-duplicate" | "similar" | "different";
  thumbnailUrl?: string;
  title?: string;
}

interface DuplicateDetectionPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoId?: string;
  onDuplicateFound?: (duplicates: DuplicateResult[]) => void;
  className?: string;
}

export function DuplicateDetectionPanel({
  videoRef,
  videoId = "current-video",
  onDuplicateFound,
  className = "",
}: DuplicateDetectionPanelProps) {
  const {
    isLoaded,
    isProcessing,
    progress,
    currentFingerprint,
    generateFingerprint,
    checkDuplicateViaAPI,
  } = useVideoHash();

  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!videoRef.current || !isLoaded) return;

    setError(null);
    setHasChecked(false);
    setDuplicates([]);

    try {
      // Generate fingerprint
      const fingerprint = await generateFingerprint(
        videoRef.current,
        videoId,
        20 // Sample 20 frames
      );

      // Check against database
      const results = await checkDuplicateViaAPI(fingerprint);
      setDuplicates(results);
      setHasChecked(true);

      if (onDuplicateFound && results.length > 0) {
        onDuplicateFound(results);
      }
    } catch (err) {
      setError("Failed to scan for duplicates. Please try again.");
      console.error("Duplicate scan error:", err);
    }
  };

  const getMatchBadge = (matchType: string) => {
    switch (matchType) {
      case "exact":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Exact Match
          </Badge>
        );
      case "near-duplicate":
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-500 gap-1">
            <Copy className="w-3 h-3" />
            Near Duplicate
          </Badge>
        );
      case "similar":
        return (
          <Badge variant="outline" className="gap-1">
            <Search className="w-3 h-3" />
            Similar
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.95) return "text-red-500";
    if (similarity >= 0.85) return "text-orange-500";
    if (similarity >= 0.7) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Duplicate Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Button */}
        <Button
          onClick={handleScan}
          disabled={!isLoaded || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning... {progress}%
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Scan for Duplicates
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Generating video fingerprint...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Fingerprint Info */}
        {currentFingerprint && !isProcessing && (
          <div className="p-2 bg-muted rounded-md text-xs">
            <p className="text-muted-foreground">
              Fingerprint generated with {currentFingerprint.hashes.length} samples
            </p>
          </div>
        )}

        {/* Results */}
        {hasChecked && (
          <div className="space-y-3">
            {duplicates.length === 0 ? (
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  No duplicates found! This video appears to be original.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Found {duplicates.length} potential duplicate(s)
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {duplicates.map((dup, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-muted rounded-md"
                    >
                      {/* Thumbnail */}
                      {dup.thumbnailUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={dup.thumbnailUrl}
                          alt=""
                          className="w-16 h-10 object-cover rounded"
                        />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {dup.title || `Video ${dup.videoId}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getMatchBadge(dup.matchType)}
                          <span
                            className={`text-xs font-mono ${getSimilarityColor(
                              dup.similarity
                            )}`}
                          >
                            {(dup.similarity * 100).toFixed(1)}% match
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Help Text */}
        {!hasChecked && !isProcessing && (
          <p className="text-xs text-muted-foreground text-center">
            Scan your video to check if it&apos;s a duplicate of existing content
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default DuplicateDetectionPanel;
