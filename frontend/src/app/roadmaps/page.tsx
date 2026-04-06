"use client";

import React from "react";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Video, 
    Users, 
    Settings, 
    Flame, 
    Trophy, 
    Zap, 
    MessageCircle,
    ChevronRight,
    Search,
    Bell
} from "lucide-react";

export default function RoadmapsDashboard() {
    const roadmaps = [
        { id: "1", title: "Mastering React & Three.js", progress: 65, icon: <Zap className="text-yellow-400" /> },
        { id: "2", title: "Game Dev with Unreal Engine 5", progress: 20, icon: <Zap className="text-blue-400" /> },
        { id: "3", title: "Advanced Node.js Microservices", progress: 0, icon: <Zap className="text-green-400" /> },
    ];

    return (
        <div className="min-h-screen bg-[#0b0e14] text-[#ecedf6] font-sans flex overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0b0e14]/50 backdrop-blur-xl">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-[#32FF7E]">
                        <Zap className="w-8 h-8 fill-current" />
                        <span className="text-xl font-bold font-space-grotesk tracking-tighter text-white">STUDENT HUB</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#32FF7E]/10 text-[#32FF7E] rounded-xl font-bold text-sm transition">
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:bg-white/5 hover:text-white rounded-xl font-medium text-sm transition">
                        <Video className="w-5 h-5" />
                        All Courses
                    </button>
                    <Link href="/playlists" className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:bg-white/5 hover:text-white rounded-xl font-medium text-sm transition font-medium">
                        <Users className="w-5 h-5" />
                        Study Groups
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:bg-white/5 hover:text-white rounded-xl font-medium text-sm transition">
                        <Trophy className="w-5 h-5" />
                        Leaderboards
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:bg-white/5 hover:text-white rounded-xl font-medium text-sm transition">
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </nav>

                <div className="p-6 border-t border-white/10">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">PRO ACCOUNT</span>
                        <p className="text-[11px] font-medium leading-relaxed text-white/60 mb-3">Get unlimited access to interactive labs.</p>
                        <button className="w-full py-2 bg-[#00d2ff] text-black text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:scale-105 transition">UPGRADE NOW</button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                {/* Top Search & Profile Bar */}
                <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between sticky top-0 bg-[#0b0e14]/80 backdrop-blur-xl z-10">
                    <div className="flex-1 max-w-xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#00d2ff] transition" />
                        <input 
                            type="text" 
                            placeholder="Find a course or lesson..." 
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#00d2ff] focus:bg-white/10 transition"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-white/40 hover:text-white transition">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b0e14]"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white uppercase tracking-tight">Player One</p>
                                <p className="text-[10px] font-bold text-[#32FF7E]">Lv.12 Student</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#32FF7E] to-[#00d2ff] p-0.5 shadow-lg">
                                <div className="w-full h-full rounded-[10px] bg-black"></div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-12 max-w-6xl w-full">
                    {/* Welcome Section */}
                    <section className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div className="space-y-4 max-w-2xl">
                            <h2 className="text-5xl font-extrabold font-space-grotesk tracking-tight leading-tight">
                                Welcome back, <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#32FF7E] to-[#00d2ff]">Player One.</span>
                            </h2>
                            <p className="text-white/40 text-lg leading-relaxed">
                                You have 7 days in a row! Keep up the momentum. 
                                Your next milestone in <span className="text-white font-medium">Three.js</span> is ready.
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-8 shadow-2xl">
                            <div className="text-center">
                                <div className="text-[#32FF7E] bg-[#32FF7E]/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 mx-auto border border-[#32FF7E]/20">
                                    <Flame className="w-6 h-6" fill="currentColor" />
                                </div>
                                <p className="text-2xl font-bold font-space-grotesk">7</p>
                                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">STREAK</p>
                            </div>
                            <div className="w-px h-12 bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-[#00d2ff] bg-[#00d2ff]/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 mx-auto border border-[#00d2ff]/20">
                                    <Zap className="w-6 h-6" fill="currentColor" />
                                </div>
                                <p className="text-2xl font-bold font-space-grotesk">12,500</p>
                                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">TOTAL XP</p>
                            </div>
                        </div>
                    </section>

                    {/* Continue Learning Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold font-space-grotesk tracking-tight">CONTINUE LEARNING</h3>
                            <button className="text-xs font-bold text-[#32FF7E] hover:underline transition">VIEW ALL ROADMAPS</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roadmaps.map((roadmap) => (
                                <Link 
                                    key={roadmap.id}
                                    href={`/roadmaps/${roadmap.id}`}
                                    className="group bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 hover:border-[#32FF7E]/50 transition-all shadow-xl flex flex-col"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-500">
                                            {roadmap.icon}
                                        </div>
                                        <h4 className="font-bold text-lg leading-tight">{roadmap.title}</h4>
                                    </div>
                                    <div className="mt-auto pt-6 space-y-3">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-white/40 uppercase tracking-widest">Progress</span>
                                            <span className="text-[#32FF7E]">{roadmap.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#32FF7E] to-[#00d2ff] shadow-[0_0_10px_#32FF7E]" 
                                                style={{ width: `${roadmap.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Next: Shaders 101</span>
                                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 group-hover:text-[#32FF7E] transition" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Quick Access Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-[#00d2ff]/20 to-transparent border border-[#00d2ff]/30 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer">
                            <div className="relative z-10 space-y-4">
                                <div className="text-[#00d2ff] bg-black/40 w-12 h-12 rounded-2xl flex items-center justify-center border border-[#00d2ff]/20">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-space-grotesk tracking-tight">Community Lounge</h3>
                                    <p className="text-white/50 text-sm mt-1">Conncet with other players, share code, and group up for challenges.</p>
                                </div>
                                <button className="flex items-center gap-2 text-xs font-bold text-[#00d2ff] uppercase tracking-widest group-hover:gap-4 transition-all">JOIN DISCORD <ChevronRight className="w-4 h-4" /></button>
                            </div>
                            <div className="absolute top-1/2 right-[-20px] -translate-y-1/2 opacity-10 group-hover:opacity-20 transition duration-700">
                                <MessageCircle className="w-48 h-48" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#32FF7E]/20 to-transparent border border-[#32FF7E]/30 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer">
                            <div className="relative z-10 space-y-4">
                                <div className="text-[#32FF7E] bg-black/40 w-12 h-12 rounded-2xl flex items-center justify-center border border-[#32FF7E]/20">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-space-grotesk tracking-tight">Elite Tournaments</h3>
                                    <p className="text-white/50 text-sm mt-1">Compete in 1v1 speed-coding battles and win exclusive badges.</p>
                                </div>
                                <button className="flex items-center gap-2 text-xs font-bold text-[#32FF7E] uppercase tracking-widest group-hover:gap-4 transition-all">SEE SCHEDULE <ChevronRight className="w-4 h-4" /></button>
                            </div>
                            <div className="absolute top-1/2 right-[-20px] -translate-y-1/2 opacity-10 group-hover:opacity-20 transition duration-700">
                                <Trophy className="w-48 h-48" />
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
