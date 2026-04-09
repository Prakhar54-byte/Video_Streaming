"use client";
 
 import React, { useEffect, useState } from "react";
 import { CodingWorkspace } from "@/components/video/CodingWorkspace";
 import { useParams, useRouter } from "next/navigation";
 import apiClient from "@/lib/api";
 import { toBackendAssetUrl } from "@/lib/utils";
 import { Loader2, AlertCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 export default function LearnPage() {
     const params = useParams();
     const router = useRouter();
     const [video, setVideo] = useState<any>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
 
     const fetchVideoDetails = async () => {
         try {
             setLoading(true);
             const response = await apiClient.get(`/videos/${params.videoId}`);
             setVideo(response.data.data);
         } catch (err: any) {
             console.error("Error fetching video:", err);
             setError(err.response?.data?.message || "Failed to load video details");
         } finally {
             setLoading(false);
         }
     };
 
     useEffect(() => {
         if (params.videoId) {
             fetchVideoDetails();
         }
     }, [params.videoId]);
 
     const handleComplete = () => {
         // Logic to update progress in backend
         alert("Milestone Completed! +500 XP");
         router.push(`/roadmaps/${params.id}`);
     };
 
     if (loading) {
         return (
             <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-12 h-12 text-[#32FF7E] animate-spin" />
                 <p className="text-[#32FF7E] font-space-grotesk animate-pulse">Initializing Neural Interface...</p>
             </div>
         );
     }
 
     if (error || !video) {
         return (
             <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-6 p-6 text-center">
                 <AlertCircle className="w-16 h-16 text-red-500 opacity-50" />
                 <div className="space-y-2">
                     <h1 className="text-2xl font-bold font-space-grotesk text-white">System Error</h1>
                     <p className="text-white/40 max-w-md">{error || "The learning node could not be retrieved from the matrix."}</p>
                 </div>
                 <Button 
                    onClick={() => router.push(`/roadmaps/${params.id}`)}
                    variant="outline"
                    className="border-white/10 hover:bg-white/5"
                 >
                     Return to Roadmap
                 </Button>
             </div>
         );
     }
 
     return (
         <CodingWorkspace 
             videoSrc={toBackendAssetUrl(video.hlsMasterPlaylist || video.videoFile)}
             videoTitle={video.title}
             roadmapTitle="Cyber-Education Path"
             currentMilestoneIndex={2} // This would ideally come from the roadmap progress
             totalMilestones={5}
             onComplete={handleComplete}
             waveformUrl={toBackendAssetUrl(video.waveformUrl)}
             introStartTime={video.introStartTime}
             introEndTime={video.introEndTime}
         />
     );
 }
