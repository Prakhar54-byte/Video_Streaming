"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Mascot } from "@/components/Mascot";
import { CodePet } from "@/components/CodePet";
import { TerminalPet } from "@/components/TerminalPet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  BookOpen, 
  Terminal, 
  Code2, 
  Award,
  ChevronRight,
  Sparkles,
  TrendingUp,
  BarChart3,
  Video as VideoIcon
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";

const StudioDashboard = dynamic(
  () =>
    import("@/components/studio/StudioDashboard").then((m) => ({
      default: m.StudioDashboard,
    })),
  { ssr: false }
);
const StudioVideos = dynamic(
  () =>
    import("@/components/studio/StudioVideos").then((m) => ({
      default: m.StudioVideos,
    })),
  { ssr: false }
);
const StudioAnalytics = dynamic(
  () =>
    import("@/components/studio/StudioAnalytics").then((m) => ({
      default: m.StudioAnalytics,
    })),
  { ssr: false }
);

function LabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { user, isAuthenticated, isLoading, selectedPet } = useAuthStore();
  
  const [xp, setXp] = useState(1250);
  const [level, setLevel] = useState(5);
  const [activeMascotState, setActiveMascotState] = useState<'idle' | 'learning' | 'celebrating' | 'error'>('idle');
  const [channel, setChannel] = useState<any>(null);
  const [channelLoading, setChannelLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("workspace");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await apiClient.get("/channels/user/me");
        if (response.data.success) {
          const data = response.data.data;
          setChannel(Array.isArray(data) ? data[0] : data);
        }
      } catch (err) {
        console.error("Error fetching channel:", err);
      } finally {
        setChannelLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchChannel();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="heading-font text-4xl md:text-5xl font-bold text-white flex items-center gap-3">
            Welcome to the <span className="text-primary bg-clip-text bg-gradient-to-r from-primary to-[#00d2ff]">Lab</span>
            <Sparkles className="text-primary w-8 h-8 animate-pulse" />
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Where code comes to life and companions guide your developer journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <Award className="text-yellow-500 w-5 h-5" />
          <span className="font-bold">Mastery Level: {level}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-8 bg-card border p-1 rounded-xl">
          <TabsTrigger value="workspace" className="flex items-center justify-center gap-2 py-3">
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">Lab Workspace</span>
            <span className="sm:hidden">Lab</span>
          </TabsTrigger>
          <TabsTrigger value="control-center" className="flex items-center justify-center gap-2 py-3">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Control Center</span>
            <span className="sm:hidden">Studio</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center justify-center gap-2 py-3">
            <VideoIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Content Manager</span>
            <span className="sm:hidden">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center justify-center gap-2 py-3">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics Studio</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-6 outline-none focus:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Mascot Hub (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity"></div>
                
                <h2 className="heading-font text-xl font-bold mb-8 text-white/80 tracking-tighter uppercase">Lab Assistant</h2>
                
                <Mascot state={activeMascotState} level={level} type={selectedPet} />
                
                <div className="w-full mt-10 space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span>Experience Points</span>
                    <span>{xp} / 2000 XP</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 p-0.5 shadow-inner">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000 relative overflow-hidden" 
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
                    className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <Code2 className="w-6 h-6 mb-1 text-gray-400 group-hover:text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Code Pet</span>
                  </button>
                  <button 
                    onClick={() => setActiveMascotState('idle')}
                    className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <Terminal className="w-6 h-6 mb-1 text-gray-400 group-hover:text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Terminal</span>
                  </button>
                </div>
              </div>

              {/* Daily Challenge */}
              <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-primary w-5 h-5" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Daily Spark</h3>
                </div>
                <p className="text-white text-sm font-medium">Explain the difference between .m3u8 and .ts in HLS.</p>
                <button className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  SUBMIT ANSWER <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right Column: Content & Tools (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Continue Learning Hero */}
              <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-8 group hover:border-primary/30 transition-all">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                      Current Module
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-primary transition-colors">Adaptive Bitrate Streaming with HLS</h3>
                    <p className="text-gray-400 max-w-md">Learn how to transcode videos into segments and serve them using M3U8 playlists for optimal performance.</p>
                    <div className="flex items-center gap-4 mt-6">
                      <button className="px-8 py-3 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
                        <Play className="w-5 h-5 fill-current" />
                        RESUME SESSION
                      </button>
                      <span className="text-sm text-gray-500 font-bold">65% COMPLETED</span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <BookOpen className="w-32 h-32 text-white/5 group-hover:text-primary/10 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recent Snippets */}
                <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-primary" />
                      Saved Snippets
                    </h4>
                    <Link href="/snippets" className="text-xs text-gray-500 hover:text-primary">View All</Link>
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
                      <Award className="w-5 h-5 text-primary" />
                      Achievements
                    </h4>
                    <Link href="/achievements" className="text-xs text-gray-500 hover:text-primary">View All</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-primary/10 hover:border-primary/30 transition-all cursor-help" title={`Achievement ${i}`}>
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
        </TabsContent>

        <TabsContent value="control-center" className="space-y-6 outline-none focus:ring-0">
          {channelLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : channel ? (
            <StudioDashboard channel={channel} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 border-2 border-dashed rounded-[2rem] bg-card/55 max-w-4xl mx-auto p-8">
              <VideoIcon className="w-16 h-16 text-muted-foreground animate-pulse" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Unlock Creator Control Center</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  To view stats, configure uploads, and manage modules, you need to create your instructor channel first.
                </p>
              </div>
              <Button onClick={() => router.push("/profile")} size="lg">
                Create Creator Channel
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6 outline-none focus:ring-0">
          {channelLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : channel ? (
            <StudioVideos channel={channel} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 border-2 border-dashed rounded-[2rem] bg-card/55 max-w-4xl mx-auto p-8">
              <VideoIcon className="w-16 h-16 text-muted-foreground" />
              <h3 className="text-2xl font-bold text-white">No Channel Found</h3>
              <p className="text-muted-foreground">Setup your channel to start managing video guides.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 outline-none focus:ring-0">
          {channelLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : channel ? (
            <StudioAnalytics channel={channel} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 border-2 border-dashed rounded-[2rem] bg-card/55 max-w-4xl mx-auto p-8">
              <BarChart3 className="w-16 h-16 text-muted-foreground" />
              <h3 className="text-2xl font-bold text-white">No Channel Found</h3>
              <p className="text-muted-foreground">Setup your channel to view user analytics.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Interactive Pets */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          <CodePet />
        </div>
        <div className="pointer-events-auto">
          <TerminalPet />
        </div>
      </div>
    </div>
  );
}

export default function MyLab() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }>
        <LabContent />
      </Suspense>
    </MainLayout>
  );
}
