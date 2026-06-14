"use client";
 
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { VideoGrid } from "@/components/video/VideoGrid";
import { CategoryTabs } from "@/components/home/CategoryTabs";
import { TrendingSection } from "@/components/home/TrendingSection";
import apiClient from "@/lib/api";
import { 
    Video, 
    Trophy, 
    Clock, 
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type HomepageStats = {
  totalVideos: number;
  activeCreators: number;
  totalWatchedHours: number;
};

const emptyStats: HomepageStats = {
  totalVideos: 0,
  activeCreators: 0,
  totalWatchedHours: 0,
};

const formatCompactNumber = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: safeValue >= 1000 ? 1 : 0,
  }).format(safeValue);
};

const formatWatchedHours = (hours: number) => {
  const roundedHours = Math.round(Number.isFinite(hours) ? hours : 0);
  return `${formatCompactNumber(roundedHours)} hrs`;
};
 
 export default function HomePage() {
   const router = useRouter();
   const { isAuthenticated, isLoading, user } = useAuthStore();
   const [activeCategory, setActiveCategory] = useState("all");
   const [stats, setStats] = useState<HomepageStats>(emptyStats);
   const [statsLoading, setStatsLoading] = useState(true);
 
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/auth/login");
      }
    }, [isAuthenticated, isLoading, router]);

   const fetchHomepageStats = useCallback(async () => {
     try {
       const response = await apiClient.get("/videos/stats/home");
       const data = response.data?.data || emptyStats;
       setStats({
         totalVideos: Number(data.totalVideos) || 0,
         activeCreators: Number(data.activeCreators) || 0,
         totalWatchedHours: Number(data.totalWatchedHours) || 0,
       });
     } catch (error) {
       console.error("Error fetching homepage stats:", error);
     } finally {
       setStatsLoading(false);
     }
   }, []);

   useEffect(() => {
     if (!isAuthenticated) return;

     fetchHomepageStats();
     const interval = window.setInterval(fetchHomepageStats, 30000);

     const handleVisibilityChange = () => {
       if (document.visibilityState === "visible") {
         fetchHomepageStats();
       }
     };

     document.addEventListener("visibilitychange", handleVisibilityChange);

     return () => {
       window.clearInterval(interval);
       document.removeEventListener("visibilitychange", handleVisibilityChange);
     };
   }, [fetchHomepageStats, isAuthenticated]);
 
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
         
         {/* Premium Welcome Header */}
         <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1c2028] to-[#0b0e14] border border-white/5 p-10 shadow-2xl">
             <div className="absolute top-0 right-0 w-96 h-96 bg-[#32FF7E]/10 blur-[120px] -mr-48 -mt-48" />
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                 <div className="space-y-3">
                     <h1 className="text-4xl font-bold font-space-grotesk tracking-tight">
                         Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">{user?.username || "Learner"}</span>
                     </h1>
                     <p className="text-white/40 text-lg">Discover and learn from quality video lessons created by the community.</p>
                 </div>
             </div>
         </section>
 
         {/* Quick Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
                 { label: "Videos Available", value: formatCompactNumber(stats.totalVideos), icon: Video, color: "text-[#32FF7E]", bg: "bg-[#32FF7E]/5" },
                 { label: "Active Creators", value: formatCompactNumber(stats.activeCreators), icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/5" },
                 { label: "Total Watched", value: formatWatchedHours(stats.totalWatchedHours), icon: Clock, color: "text-[#00d2ff]", bg: "bg-[#00d2ff]/5" },
             ].map((stat, i) => (
                 <div key={i} className={cn("p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 transition hover:bg-white/5", stat.bg)}>
                     <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", stat.color.replace('text', 'bg').replace('-400', '-400/10'))}>
                         <stat.icon className={cn("w-6 h-6", stat.color)} />
                     </div>
                     <div>
                         <p className="text-[10px] uppercase font-bold tracking-widest text-white/30">{stat.label}</p>
                         <p className={cn("text-xl font-bold font-space-grotesk", statsLoading && "text-white/40")}>
                           {statsLoading ? "..." : stat.value}
                         </p>
                     </div>
                 </div>
             ))}
         </div>
         
         {/* Content Section */}
         <div className="space-y-12">
             {/* Filter Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <CategoryTabs 
                   activeCategory={activeCategory}
                   onCategoryChange={setActiveCategory}
                 />
             </div>

             {/* Featured / Trending Segment */}
             {(activeCategory === "all" || activeCategory === "trending") && (
               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold font-space-grotesk tracking-tight">Trending </h2>
                 </div>
                 <TrendingSection className="pb-4" />
               </div>
             )}

             {/* Main Catalog Grid */}
             <div className="space-y-6">
               <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-[#32FF7E] rounded-full shadow-[0_0_10px_#32FF7E]" />
                   <h2 className="text-2xl font-bold font-space-grotesk tracking-tight">
                     {activeCategory === "all" ? "All Videos" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
                   </h2>
               </div>
               <VideoGrid 
                 sortBy={activeCategory === "trending" ? "views" : "recent"} 
                 category={activeCategory}
               />
             </div>
         </div>
 
         {/* Footer / Call to Action */}
         <section className="bg-white/5 rounded-[2rem] border border-white/10 p-12 text-center relative overflow-hidden mt-12">
             <div className="absolute inset-0 bg-gradient-to-r from-[#00d2ff]/5 to-[#32FF7E]/5 pointer-events-none" />
             <div className="relative z-10 space-y-6">
                 <h2 className="text-3xl font-bold font-space-grotesk">Want to share your knowledge?</h2>
                 <p className="text-white/40 max-w-xl mx-auto italic text-lg">"Teaching others is the best way to learn. Upload your first video today."</p>
                 <button onClick={() => router.push('/upload')} className="px-10 py-4 bg-[#32FF7E] text-black font-bold rounded-2xl hover:scale-105 transition flex items-center gap-3 mx-auto shadow-[0_0_30px_rgba(50,255,126,0.2)]">
                     Upload a Video
                     <ChevronRight className="w-5 h-5" />
                 </button>
             </div>
         </section>
       </div>
     </MainLayout>
   );
 }
