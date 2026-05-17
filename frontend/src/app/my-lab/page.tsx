"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Mascot } from "@/components/Mascot";
import { CodePet } from "@/components/CodePet";
import { TerminalPet } from "@/components/TerminalPet";
import { 
  Play, 
  BookOpen, 
  Terminal, 
  Code2, 
  Award,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function MyLab() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  const [xp, setXp] = useState(1250);
  const [level, setLevel] = useState(5);
  const [activeMascotState, setActiveMascotState] = useState<'idle' | 'learning' | 'celebrating' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="heading-font text-4xl md:text-5xl font-bold text-white flex items-center gap-3">
              Welcome to the <span className="text-[#32FF7E]">Lab</span>
              <Sparkles className="text-[#32FF7E] w-8 h-8" />
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Where code comes to life and pets help you learn.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <Award className="text-yellow-500 w-5 h-5" />
            <span className="font-bold">Mastery Level: {level}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Mascot Hub (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#32FF7E] opacity-5 blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity"></div>
              
              <h2 className="heading-font text-xl font-bold mb-8 text-white/80 tracking-tighter uppercase">Lab Assistant</h2>
              
              <Mascot state={activeMascotState} level={level} type="dog" />
              
              <div className="w-full mt-10 space-y-4">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <span>Experience Points</span>
                  <span>{xp} / 2000 XP</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 p-0.5 shadow-inner">
                  <div 
                    className="bg-[#32FF7E] h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(50,255,126,0.5)] relative overflow-hidden" 
                    style={{ width: `${(xp/2000)*100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500 italic">"Feed me some code to level up!"</p>
              </div>

              {/* Lab Tools Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                <button 
                  onClick={() => setActiveMascotState('learning')}
                  className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#32FF7E]/10 hover:border-[#32FF7E]/30 transition-all group"
                >
                  <Code2 className="w-6 h-6 mb-1 text-gray-400 group-hover:text-[#32FF7E]" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Code Pet</span>
                </button>
                <button 
                  onClick={() => setActiveMascotState('idle')}
                  className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#32FF7E]/10 hover:border-[#32FF7E]/30 transition-all group"
                >
                  <Terminal className="w-6 h-6 mb-1 text-gray-400 group-hover:text-[#32FF7E]" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Terminal</span>
                </button>
              </div>
            </div>

            {/* Daily Challenge */}
            <div className="bg-gradient-to-br from-[#32FF7E]/10 to-transparent border border-[#32FF7E]/20 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-[#32FF7E] w-5 h-5" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Daily Spark</h3>
              </div>
              <p className="text-white text-sm font-medium">Explain the difference between .m3u8 and .ts in HLS.</p>
              <button className="mt-4 text-xs font-bold text-[#32FF7E] hover:underline flex items-center gap-1">
                SUBMIT ANSWER <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Content & Tools (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Continue Learning Hero */}
            <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-8 group hover:border-[#32FF7E]/30 transition-all">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#32FF7E]/20 text-[#32FF7E] text-[10px] font-bold rounded-full uppercase tracking-widest">
                    Current Module
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-[#32FF7E] transition-colors">Adaptive Bitrate Streaming with HLS</h3>
                  <p className="text-gray-400 max-w-md">Learn how to transcode videos into segments and serve them using M3U8 playlists for optimal performance.</p>
                  <div className="flex items-center gap-4 mt-6">
                    <button className="px-8 py-3 bg-[#32FF7E] text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
                      <Play className="w-5 h-5 fill-current" />
                      RESUME SESSION
                    </button>
                    <span className="text-sm text-gray-500 font-bold">65% COMPLETED</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <BookOpen className="w-32 h-32 text-white/5 group-hover:text-[#32FF7E]/10 transition-colors" />
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recent Snippets */}
              <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[#32FF7E]" />
                    Saved Snippets
                  </h4>
                  <Link href="/snippets" className="text-xs text-gray-500 hover:text-[#32FF7E]">View All</Link>
                </div>
                <div className="space-y-3">
                  {[
                    "ffmpeg-hls-transcode.sh",
                    "auth-middleware-jwt.js",
                    "cloudinary-upload-util.ts"
                  ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/10 transition-all">
                      <span className="text-sm font-mono text-gray-300">{file}</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Achievements */}
              <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#32FF7E]" />
                    Achievements
                  </h4>
                  <Link href="/achievements" className="text-xs text-gray-500 hover:text-[#32FF7E]">View All</Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-[#32FF7E]/10 hover:border-[#32FF7E]/30 transition-all cursor-help" title={`Achievement ${i}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-lg grayscale group-hover:grayscale-0 transition-all">
                        {i === 1 ? '🚀' : i === 2 ? '🔒' : '📹'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest">Next Unlock: 1500 XP</p>
              </div>

            </div>

            {/* Interactive Area Footer */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Terminal className="text-blue-400 w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">SESSION TERMINAL</p>
                  <p className="text-[10px] text-gray-600 font-mono">Status: Connected to Node.js v20.x</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">OPEN SANDBOX</button>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">RESET LAB</button>
              </div>
            </div>

          </div>
        </div>

        {/* Floating Interactive Pets (Hidden on mobile if needed) */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
          <div className="pointer-events-auto">
            <CodePet />
          </div>
          <div className="pointer-events-auto">
            <TerminalPet />
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
