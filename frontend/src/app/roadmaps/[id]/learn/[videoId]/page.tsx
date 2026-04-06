"use client";

import React from "react";
import { CodingWorkspace } from "@/components/video/CodingWorkspace";
import { useParams, useRouter } from "next/navigation";

export default function LearnPage() {
    const params = useParams();
    const router = useRouter();

    const handleComplete = () => {
        // Logic to update progress in backend would go here
        alert("Milestone Completed! +500 XP");
        router.push(`/roadmaps/${params.id}`);
    };

    return (
        <CodingWorkspace 
            videoSrc="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" // Placeholder high-quality HLS stream
            videoTitle="Lesson 2: Lighting & Shaders in Three.js"
            roadmapTitle="Full Stack Game Developer"
            currentMilestoneIndex={2}
            totalMilestones={5}
            onComplete={handleComplete}
        />
    );
}
