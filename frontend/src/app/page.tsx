"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { VideoGrid } from "@/components/video/VideoGrid";
 import { MessageFeed } from "@/components/messages/MessageFeed";
 import { CategoryTabs } from "@/components/home/CategoryTabs";
 import { TrendingSection } from "@/components/home/TrendingSection";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { 
     Video, 
     MessageSquare, 
     Sparkles, 
     Trophy, 
     Zap, 
     Target, 
     Clock, 
     ChevronRight,
     BarChart3
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 export default function HomePage() {
   const router = useRouter();
   const { isAuthenticated, isLoading, user } = useAuthStore();
   const [activeCategory, setActiveCategory] = useState("all");
  const [userProgress, setUserProgress] = useState({ level: 1, progressPercent: 0, currentRoadmap: '' });
  const [loading, setLoading] = useState(true);
 
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/auth/login");
      }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
      async function fetchUserData() {
        try {
          const response = await apiClient.get('/users/current-user');
          setUserProgress({
            level: response.data.data?.level || 1,
            progressPercent: response.data.data?.progressPercent || 0,
            currentRoadmap: response.data.data?.currentRoadmap || 'Get started'
          });
        } catch (e) {
          setUserProgress({ level: 1, progressPercent: 0, currentRoadmap: 'Get started' });
        } finally {
          setLoading(false);
        }
      }
      if (isAuthenticated) fetchUserData();
    }, [isAuthenticated]);
 
   if (isLoading) {
     return (
       <MainLayout>
         <div className="container mx-auto px-4 py-8 animate-pulse space-y-8">
           <div className="h-32 bg-white/5 rounded-[2rem]" />
           <div className="grid grid-cols-4 gap-4">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
           </div>
           <div className="h-64 bg-white/5 rounded-[2rem]" />
         </div>
       </MainLayout>
     );
   }
 
   if (!isAuthenticated) return null;
 
   return (
     <MainLayout>
       <div className="container mx-auto px-6 py-8 space-y-12 max-w-7xl">
         
         {/* Premium Welcome Header / Stats Bar */}
         <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1c2028] to-[#0b0e14] border border-white/5 p-10 shadow-2xl">
             <div className="absolute top-0 right-0 w-96 h-96 bg-[#32FF7E]/10 blur-[120px] -mr-48 -mt-48" />
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                 <div className="space-y-2">
                     <div className="flex items-center gap-2 px-3 py-1 bg-[#32FF7E]/10 border border-[#32FF7E]/20 rounded-full w-fit">
                         <Sparkles className="w-3.5 h-3.5 text-[#32FF7E]" />
                         <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#32FF7E]">Student Level {userProgress.level}</span>
                     </div>
                     <h1 className="text-4xl font-bold font-space-grotesk tracking-tight">
                         Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">{user?.username || "Gamer"}</span>
                     </h1>
                     <p className="text-white/40 text-lg">You have completed {userProgress.progressPercent}% of your <span className="text-white">{userProgress.currentRoadmap}</span> roadmap.</p>
                 </div>
 
                 <div className="flex items-center gap-8">
                     <div className="text-right">
                         <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Total Progress</p>
                         <div className="flex items-center gap-4">
                             <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#32FF7E] shadow-[0_0_15px_#32FF7E]" style={{ width: `${userProgress.progressPercent}%` }} />
                             </div>
                             <span className="font-bold font-space-grotesk">{userProgress.progressPercent}%</span>
                         </div>
                     </div>
                     <button 
                        onClick={() => router.push('/roadmaps/67f3a1b2c4d5e6f7a8b9c0d1')} // Navigates to example roadmap
                        className="px-8 py-4 bg-[#32FF7E] text-black font-bold rounded-2xl hover:scale-105 transition shadow-[0_0_30px_rgba(50,255,126,0.2)] flex items-center gap-2"
                     >
                         <Zap className="w-4 h-4 fill-current" />
                         RESUME LEARNING
                     </button>
                 </div>
             </div>
         </section>
 
         {/* Activity Grid */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
                 { label: "Daily Streak", value: "14 Days", icon: Zap, color: "text-[#32FF7E]", bg: "bg-[#32FF7E]/5" },
                 { label: "XP Earned", value: "12.5k", icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/5" },
                 { label: "Lessons Done", value: "24/32", icon: Target, color: "text-[#00d2ff]", bg: "bg-[#00d2ff]/5" },
                 { label: "Time Studied", value: "48.5h", icon: Clock, color: "text-purple-400", bg: "bg-purple-400/5" },
             ].map((stat, i) => (
                 <div key={i} className={cn("p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 transition hover:bg-white/5", stat.bg)}>
                     <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", stat.color.replace('text', 'bg').replace('-400', '-400/10'))}>
                         <stat.icon className={cn("w-6 h-6", stat.color)} />
                     </div>
                     <div>
                         <p className="text-[10px] uppercase font-bold tracking-widest text-white/30">{stat.label}</p>
                         <p className="text-xl font-bold font-space-grotesk">{stat.value}</p>
                     </div>
                 </div>
             ))}
         </div>
         
         {/* Content Tabs */}
         <Tabs defaultValue="videos" className="w-full">
           <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
               <TabsList className="bg-transparent gap-8 h-auto p-0 border-none">
                 <TabsTrigger value="videos" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#32FF7E] py-0 h-auto text-xl font-bold font-space-grotesk relative px-0 rounded-none after:content-[''] after:absolute after:-bottom-[17px] after:left-0 after:right-0 after:h-0.5 after:bg-[#32FF7E] after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform">
                   <div className="flex items-center gap-3">
                     <Video className="w-6 h-6" />
                     Learning Tracks
                   </div>
                 </TabsTrigger>
                 <TabsTrigger value="messages" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#32FF7E] py-0 h-auto text-xl font-bold font-space-grotesk relative px-0 rounded-none after:content-[''] after:absolute after:-bottom-[17px] after:left-0 after:right-0 after:h-0.5 after:bg-[#32FF7E] after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform">
                   <div className="flex items-center gap-3">
                     <MessageSquare className="w-6 h-6" />
                     Study Groups
                   </div>
                 </TabsTrigger>
               </TabsList>
 
               <div className="hidden md:flex items-center gap-2 text-white/40 text-sm font-medium hover:text-white cursor-pointer transition">
                   <span>View My Performance</span>
                   <BarChart3 className="w-4 h-4" />
               </div>
           </div>
           
           <TabsContent value="videos" className="space-y-12 outline-none">
             {/* Filter Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <CategoryTabs 
                   activeCategory={activeCategory}
                   onCategoryChange={setActiveCategory}
                 />
                 <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 focus-within:border-[#32FF7E]/50 transition">
                     <Sparkles className="w-4 h-4 text-[#32FF7E]" />
                     <span className="text-sm font-medium">Smart Recommended</span>
                 </div>
             </div>
 
             {/* Featured / Trending Segment */}
             {(activeCategory === "all" || activeCategory === "trending") && (
               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold font-space-grotesk tracking-tight">Trending Challenges</h2>
                     <button className="text-xs uppercase font-bold tracking-[0.2em] text-[#32FF7E] hover:underline">View Roadmap</button>
                 </div>
                 <TrendingSection className="pb-4" />
               </div>
             )}
 
             {/* Main Catalog Grid */}
             <div className="space-y-6">
               <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-[#32FF7E] rounded-full shadow-[0_0_10px_#32FF7E]" />
                   <h2 className="text-2xl font-bold font-space-grotesk tracking-tight">
                     {activeCategory === "all" ? "Your Learning Catalog" : `Explore ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
                   </h2>
               </div>
               <VideoGrid 
                 sortBy={activeCategory === "trending" ? "views" : "recent"} 
                 category={activeCategory}
               />
             </div>
           </TabsContent>
           
           <TabsContent value="messages" className="outline-none">
             <div className="max-w-4xl mx-auto">
               <MessageFeed />
             </div>
           </TabsContent>
         </Tabs>
 
         {/* Footer / Call to Action */}
         <section className="bg-white/5 rounded-[2rem] border border-white/10 p-12 text-center relative overflow-hidden mt-12">
             <div className="absolute inset-0 bg-gradient-to-r from-[#00d2ff]/5 to-[#32FF7E]/5 pointer-events-none" />
             <div className="relative z-10 space-y-6">
                 <h2 className="text-3xl font-bold font-space-grotesk">Ready to level up your career?</h2>
                 <p className="text-white/40 max-w-xl mx-auto italic text-lg line-clamp-2">"The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."</p>
                 <button className="px-10 py-4 border border-white/20 rounded-2xl font-bold hover:bg-white/5 transition flex items-center gap-3 mx-auto">
                     Explore All Roadmaps
                     <ChevronRight className="w-5 h-5 text-[#32FF7E]" />
                 </button>
             </div>
         </section>
       </div>
     </MainLayout>
   );
 }
