"use client";

import React from "react";
import Link from "next/link";
import { 
    CheckCircle2, 
    Lock, 
    ChevronLeft, 
    ChevronRight,
    Play, 
    Clock, 
    Users, 
    Trophy,
    Calendar,
    Share2,
    Bookmark,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoadmapTimeline({ params }: { params: { id: string } }) {
    const milestones = [
        { 
            id: "1", 
            title: "Intro to Three.js", 
            status: "completed", 
            duration: "2h",
            items: [
                { type: "video", title: "Setting up a scene", duration: "15:00" },
                { type: "task", title: "Create your first sphere", duration: "10:00" },
            ]
        },
        { 
            id: "2", 
            title: "Building 3D Environments", 
            status: "current", 
            duration: "5h",
            videoId: "67f3a1b2c4d5e6f7a8b9c0d1", // Example ID
            items: [
                { type: "video", title: "Lighting & Shadows", duration: "25:00" },
                { type: "task", title: "Build a 3D Room", duration: "45:00" },
                { type: "resource", title: "Mesh Asset Pack", duration: "Link" },
            ]
        },
        { 
            id: "3", 
            title: "Physics Engines (Ammo.js)", 
            status: "locked", 
            duration: "8h",
            items: []
        },
        { 
            id: "4", 
            title: "Multiplayer with Socket.io", 
            status: "locked", 
            duration: "10h",
            items: []
        },
        { 
            id: "5", 
            title: "Performance Optimization", 
            status: "locked", 
            duration: "4h",
            items: []
        },
    ];

    return (
        <div className="min-h-screen bg-[#0b0e14] text-[#ecedf6] font-sans overflow-x-hidden">
            {/* Header / Sub-nav */}
            <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between sticky top-0 bg-[#0b0e14]/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <Link href="/roadmaps" className="p-2 hover:bg-white/5 rounded-full transition text-white/40 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#32FF7E]">Active Roadmap</span>
                        <h1 className="text-lg font-bold font-space-grotesk tracking-tight leading-none">Full Stack Game Developer</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-white/40 hover:text-white"><Share2 className="w-4 h-4" /></button>
                    <button className="p-2 text-white/40 hover:text-white"><Bookmark className="w-4 h-4" /></button>
                    <button className="px-6 py-2 bg-[#32FF7E] text-black font-bold text-sm rounded-lg hover:scale-105 transition shadow-[0_0_20px_rgba(50,255,126,0.3)] flex items-center gap-2">
                        <Play className="w-4 h-4" fill="black" />
                        CONTINUE WORKSPACE
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-16">
                {/* Left: Detailed Roadmap Stats */}
                <aside className="w-full md:w-80 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold font-space-grotesk">Level 2 Progress</h2>
                            <p className="text-white/40 text-sm italic">"The Neon Architect"</p>
                        </div>
                        <div className="flex justify-center">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                    <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="376.8" strokeDashoffset="131.8" className="text-[#32FF7E] shadow-xl" />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-2xl font-bold font-space-grotesk">65%</span>
                                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest leading-none">Complete</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 rounded-2xl p-4 text-center border border-white/5">
                                <Clock className="w-4 h-4 text-[#00d2ff] mx-auto mb-2" />
                                <p className="text-lg font-bold font-space-grotesk leading-none">40h</p>
                                <p className="text-[8px] uppercase font-bold font-space-grotesk text-white/30 tracking-widest mt-1">Total</p>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-4 text-center border border-white/5">
                                <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-2" />
                                <p className="text-lg font-bold font-space-grotesk leading-none">1.2k</p>
                                <p className="text-[8px] uppercase font-bold font-space-grotesk text-white/30 tracking-widest mt-1">Students</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-tr from-[#32FF7E]/10 to-transparent border border-[#32FF7E]/20 rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-[#32FF7E]" />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Global Stats</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 transition hover:translate-x-2">
                                <p className="text-xs font-medium text-white/60">Avg. Completion Time</p>
                                <p className="text-xs font-bold font-space-grotesk text-[#32FF7E]">14 Days</p>
                            </div>
                            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 transition hover:translate-x-2">
                                <p className="text-xs font-medium text-white/60">Success Rate</p>
                                <p className="text-xs font-bold font-space-grotesk text-[#32FF7E]">92%</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right: The Timeline */}
                <div className="flex-1 space-y-12 relative">
                    {/* Vertical Line Connector */}
                    <div className="absolute left-[24px] top-4 bottom-4 w-px bg-gradient-to-b from-[#32FF7E] via-[#32FF7E] to-transparent z-0 opacity-20"></div>

                    {milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="relative pl-16 group">
                            {/* Circle Node */}
                            <div className={cn(
                                "absolute left-2 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition duration-500",
                                milestone.status === "completed" && "bg-[#32FF7E] text-black shadow-[0_0_15px_rgba(50,255,126,0.5)]",
                                milestone.status === "current" && "bg-[#1c2028] border-2 border-[#00d2ff] text-[#00d2ff] shadow-[0_0_20px_rgba(0,210,255,0.4)] scale-125 animate-pulse",
                                milestone.status === "locked" && "bg-[#0b0e14] border border-white/20 text-white/20"
                            )}>
                                {milestone.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : 
                                 milestone.status === "locked" ? <Lock className="w-4 h-4" /> : idx + 1}
                            </div>

                            <div className={cn(
                                "rounded-[2rem] border transition-all duration-500 overflow-hidden",
                                milestone.status === "completed" && "bg-white/5 border-white/10 opacity-70",
                                milestone.status === "current" && "bg-gradient-to-br from-white/10 to-[#00d2ff]/5 border-[#00d2ff]/30 shadow-2xl scale-[1.02]",
                                milestone.status === "locked" && "bg-white/5 border-white/5 opacity-40 grayscale"
                            )}>
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold font-space-grotesk tracking-tight leading-tight group-hover:text-[#32FF7E] transition">{milestone.title}</h3>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-white/40 text-xs font-bold uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {milestone.duration}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-white/40 text-xs font-bold uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Milestone {idx + 1}
                                                </div>
                                            </div>
                                        </div>
                                        {milestone.status === "current" && (
                                            <Link 
                                                href={`/roadmaps/${params.id}/learn/${milestone.videoId}`}
                                                className="px-6 py-3 bg-[#00d2ff] text-black font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                                ENTER WORKSPACE
                                            </Link>
                                        )}
                                    </div>

                                    {/* Preview items for active milestone */}
                                    {milestone.status === "current" && (
                                        <div className="space-y-3 pt-6 border-t border-white/10">
                                            {milestone.items.map((item, i) => (
                                                <div key={i} className="bg-black/40 rounded-2xl p-4 flex items-center justify-between border border-white/5 group/item hover:bg-black/60 hover:border-[#32FF7E]/30 transition group-hover:bg-[#161a21]">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold",
                                                            item.type === "video" ? "bg-red-500/10 text-red-400" : 
                                                            item.type === "task" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                                                        )}>
                                                            {item.type[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold group-hover/item:text-white transition">{item.title}</p>
                                                            <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{item.type} • {item.duration}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-white/10 group-hover/item:text-[#32FF7E] group-hover/item:translate-x-1 transition" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {milestone.status === "locked" && (
                                        <div className="flex items-center gap-3 text-white/20 mt-4 italic text-sm">
                                            <Lock className="w-4 h-4" />
                                            Complete previous milestones to unlock...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
