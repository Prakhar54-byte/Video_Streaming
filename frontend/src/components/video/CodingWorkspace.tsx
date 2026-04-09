"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { ModernVideoPlayer, ModernVideoPlayerRef } from "./ModernVideoPlayer";
import { WaveformViewer } from "./WaveformViewer";
import { 
    Play, 
    Code, 
    CheckCircle2, 
    ChevronRight, 
    Terminal, 
    Save, 
    Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodingWorkspaceProps {
    videoSrc: string;
    videoTitle: string;
    initialCode?: string;
    roadmapTitle?: string;
    currentMilestoneIndex?: number;
    totalMilestones?: number;
    onComplete?: () => void;
    waveformUrl?: string;
    introStartTime?: number;
    introEndTime?: number;
}

export function CodingWorkspace({
    videoSrc,
    videoTitle,
    initialCode = "// Start coding your project here...",
    roadmapTitle = "Python Game Development",
    currentMilestoneIndex = 3,
    totalMilestones = 5,
    onComplete,
    waveformUrl,
    introStartTime,
    introEndTime
}: CodingWorkspaceProps) {
    const [code, setCode] = useState(initialCode);
    const [isOutputVisible, setIsOutputVisible] = useState(false);
    const [output, setOutput] = useState("");
    
    // Video synchronization state
    const playerRef = useRef<ModernVideoPlayerRef>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const handleRunCode = () => {
        setIsOutputVisible(true);
        setOutput("Running code...\n> Hello, Gamer! Your 3D environment is initializing...\n> Done.");
    };

    const handleWaveformSeek = (time: number) => {
        playerRef.current?.seekTo(time);
        setCurrentTime(time);
    };

    const handleEditorWillMount = (monaco: any) => {
        monaco.editor.defineTheme('obsidian-neon', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#000000', // Deep black for the Obsidian Neon look
                'editor.lineHighlightBackground': '#161a21',
                'editorCursor.foreground': '#32FF7E',
            }
        });
    };

    const progressPercentage = (currentMilestoneIndex / totalMilestones) * 100;

    return (
        <div className="flex flex-col h-screen bg-[#0b0e14] text-[#ecedf6] font-sans overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-[#0b0e14]/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#32FF7E] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(50,255,126,0.3)]">
                        <Zap className="w-5 h-5 text-black" fill="black" />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight font-space-grotesk">{videoTitle}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Level 12</span>
                        <div className="w-32 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[#32FF7E] shadow-[0_0_10px_#32FF7E]" style={{ width: '75%' }}></div>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#32FF7E] rounded-full animate-pulse shadow-[0_0_8px_#32FF7E]"></div>
                        <span className="text-xs font-bold tracking-tight">12,500 XP</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Video Player Section */}
                <div className="w-[60%] flex flex-col border-right border-white/10 relative">
                    <div className="flex-1 p-4 flex flex-col">
                        <div className="flex-1 relative rounded-xl overflow-hidden border border-white/5 shadow-2xl bg-black">
                            <ModernVideoPlayer 
                                ref={playerRef}
                                src={videoSrc}
                                title={videoTitle}
                                onTimeUpdate={setCurrentTime}
                                onLoadedMetadata={({ duration }) => setDuration(duration)}
                                introStartTime={introStartTime}
                                introEndTime={introEndTime}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Audio Waveform Integration */}
                        <div className="mt-4 bg-[#10131a] rounded-xl border border-white/5 overflow-hidden">
                            <WaveformViewer 
                                waveformImageUrl={waveformUrl}
                                duration={duration}
                                currentTime={currentTime}
                                onSeek={handleWaveformSeek}
                                compact={true}
                                className="bg-transparent border-none shadow-none"
                                initialColor={{ primary: "#32FF7E", secondary: "#10B981" }}
                            />
                        </div>
                        
                        {/* Video Metadata / Sub-nav */}
                        <div className="mt-4 flex items-center justify-between px-2">
                            <div className="flex gap-4">
                                <button className="text-xs font-bold uppercase tracking-widest text-[#32FF7E] border-b-2 border-[#32FF7E] pb-1">Lesson Info</button>
                                <button className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition pb-1">Resources</button>
                                <button className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition pb-1">Community (124)</button>
                            </div>
                            <button 
                                onClick={onComplete}
                                className="flex items-center gap-2 px-4 py-2 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition shadow-[0_0_20px_rgba(50,255,126,0.2)]"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Complete Lesson</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom: Roadmap Milestone Tracker */}
                    <div className="h-[120px] bg-[#10131a] border-t border-white/10 p-4 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{roadmapTitle} Roadmap</h3>
                            <span className="text-[10px] font-bold bg-[#32FF7E]/10 text-[#32FF7E] px-2 py-0.5 rounded border border-[#32FF7E]/20">{progressPercentage}% Complete</span>
                        </div>
                        <div className="flex items-center gap-2 relative">
                            {/* Horizontal Line */}
                            <div className="absolute top-1/2 left-4 right-4 h-px bg-white/10 -translate-y-1/2 z-0"></div>
                            <div 
                                className="absolute top-1/2 left-4 h-px bg-[#32FF7E] -translate-y-1/2 z-10 transition-all duration-1000 shadow-[0_0_10px_#32FF7E]" 
                                style={{ width: `calc(${progressPercentage}% - 32px)` }}
                            ></div>

                            {/* Nodes */}
                            {[1, 2, 3, 4, 5].map((step) => {
                                const isCompleted = step < currentMilestoneIndex;
                                const isCurrent = step === currentMilestoneIndex;
                                return (
                                    <div key={step} className="flex-1 flex justify-center z-20">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                                            isCompleted ? "bg-[#32FF7E] text-black" : "bg-[#161a21] border border-white/20 text-white/40",
                                            isCurrent && "border-2 border-[#00d2ff] scale-125 shadow-[0_0_15px_rgba(0,210,255,0.5)] bg-[#1c2028] text-[#00d2ff]"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-bold">{step}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Code Editor Section */}
                <div className="w-[40%] bg-[#000000] flex flex-col">
                    <div className="h-10 bg-[#161a21] border-b border-white/10 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-[#00d2ff]" />
                            <span className="text-xs font-bold tracking-tight text-white/70">workspace.js</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-1 px-2 hover:bg-white/5 rounded transition text-white/40 hover:text-white/80">
                                <Save className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative group">
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            theme="obsidian-neon"
                            beforeMount={handleEditorWillMount}
                            options={{
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbers: "on",
                                roundedSelection: true,
                                padding: { top: 20 }
                            }}
                        />
                        <button 
                            onClick={handleRunCode}
                            className="absolute bottom-6 right-6 z-30 px-6 py-2 bg-[#00d2ff] text-black font-bold rounded-lg shadow-[0_0_30px_rgba(0,210,255,0.3)] hover:scale-105 active:scale-95 transition flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" fill="black" />
                            Run Code
                        </button>
                    </div>

                    {/* Output/Terminal Panel */}
                    {isOutputVisible && (
                        <div className="h-[30%] border-t border-white/10 bg-[#0a0b10] p-4 font-mono text-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-white/40">
                                    <Terminal className="w-4 h-4" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest leading-none">Terminal Output</span>
                                </div>
                                <button onClick={() => setIsOutputVisible(false)} className="text-white/20 hover:text-white/60">×</button>
                            </div>
                            <pre className="text-white/80 whitespace-pre-wrap leading-relaxed">
                                {output}
                            </pre>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default CodingWorkspace;
