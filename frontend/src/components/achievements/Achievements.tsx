"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, Lock, Star, Award, Zap, Target, Flame, MessageCircle, Upload, Eye, Heart, Calendar } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "upload" | "view" | "engagement" | "streak" | "special";
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface AchievementsProps {
  userId?: string;
  compact?: boolean;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "progress" | "unlocked" | "unlockedAt">[] = [
  { id: "first_upload", name: "First Upload", description: "Upload your first video", icon: "📤", category: "upload", requirement: 1, rarity: "common" },
  { id: "ten_videos", name: "Video Master", description: "Upload 10 videos", icon: "🎬", category: "upload", requirement: 10, rarity: "uncommon" },
  { id: "fifty_videos", name: "Content Creator", description: "Upload 50 videos", icon: "🏆", category: "upload", requirement: 50, rarity: "rare" },
  { id: "hundred_videos", name: "Video Pro", description: "Upload 100 videos", icon: "👑", category: "upload", requirement: 100, rarity: "epic" },
  { id: "first_view", name: "First View", description: "Get your first video view", icon: "👁️", category: "view", requirement: 1, rarity: "common" },
  { id: "hundred_views", name: "Audience Builder", description: "Reach 100 total views", icon: "📊", category: "view", requirement: 100, rarity: "uncommon" },
  { id: "thousand_views", name: "Rising Star", description: "Reach 1,000 total views", icon: "⭐", category: "view", requirement: 1000, rarity: "rare" },
  { id: "ten_thousand_views", name: "Popular Creator", description: "Reach 10,000 total views", icon: "🔥", category: "view", requirement: 10000, rarity: "epic" },
  { id: "first_like", name: "First Like", description: "Receive your first like", icon: "❤️", category: "engagement", requirement: 1, rarity: "common" },
  { id: "first_comment", name: "Conversation Starter", description: "Leave your first comment", icon: "💬", category: "engagement", requirement: 1, rarity: "common" },
  { id: "ten_likes", name: "Appreciated", description: "Receive 10 likes", icon: "💖", category: "engagement", requirement: 10, rarity: "uncommon" },
  { id: "hundred_likes", name: "Fan Favorite", description: "Receive 100 likes", icon: "🥰", category: "engagement", requirement: 100, rarity: "rare" },
  { id: "streak_3", name: "3 Day Streak", description: "Login for 3 consecutive days", icon: "🔥", category: "streak", requirement: 3, rarity: "common" },
  { id: "streak_7", name: "Week Warrior", description: "Login for 7 consecutive days", icon: "💪", category: "streak", requirement: 7, rarity: "uncommon" },
  { id: "streak_30", name: "Monthly Master", description: "Login for 30 consecutive days", icon: "🏅", category: "streak", requirement: 30, rarity: "epic" },
  { id: "streak_100", name: "Dedicated Creator", description: "Login for 100 consecutive days", icon: "🏆", category: "streak", requirement: 100, rarity: "legendary" },
  { id: "early_adopter", name: "Early Adopter", description: "Join during launch period", icon: "🚀", category: "special", requirement: 1, rarity: "rare" },
  { id: "profile_complete", name: "Profile Complete", description: "Fill out your profile", icon: "✨", category: "special", requirement: 1, rarity: "common" },
];

const STORAGE_KEY = "spark_achievements";

export function Achievements({ userId, compact = false }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const userAchievements = userId ? parsed[userId] || [] : parsed.default || [];
        const merged = ACHIEVEMENT_DEFINITIONS.map((def) => {
          const userProgress = userAchievements.find((a: Achievement) => a.id === def.id);
          return {
            ...def,
            progress: userProgress?.progress || 0,
            unlocked: userProgress?.unlocked || false,
            unlockedAt: userProgress?.unlockedAt,
          };
        });
        setAchievements(merged);
      } catch {
        initializeAchievements();
      }
    } else {
      initializeAchievements();
    }
  }, [userId]);

  const initializeAchievements = () => {
    const defaultAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      progress: 0,
      unlocked: false,
    }));
    setAchievements(defaultAchievements);
    const storage: Record<string, Achievement[]> = {};
    storage[userId || "default"] = defaultAchievements;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  };

  const saveAchievements = (newAchievements: Achievement[]) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storage: Record<string, Achievement[]> = {};
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        storage[userId || "default"] = newAchievements;
      } catch {
        storage[userId || "default"] = newAchievements;
      }
    } else {
      storage[userId || "default"] = newAchievements;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  };

  const updateProgress = (achievementId: string, progress: number) => {
    setAchievements((prev) => {
      const updated = prev.map((a) => {
        if (a.id === achievementId) {
          const newProgress = Math.min(progress, a.requirement);
          const wasUnlocked = a.unlocked;
          const isNowUnlocked = newProgress >= a.requirement;
          return {
            ...a,
            progress: newProgress,
            unlocked: isNowUnlocked,
            unlockedAt: isNowUnlocked && !wasUnlocked ? new Date().toISOString() : a.unlockedAt,
          };
        }
        return a;
      });
      saveAchievements(updated);
      return updated;
    });
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const categories = [
    { id: "all", label: "All", icon: Trophy },
    { id: "upload", label: "Uploads", icon: Upload },
    { id: "view", label: "Views", icon: Eye },
    { id: "engagement", label: "Engagement", icon: Heart },
    { id: "streak", label: "Streaks", icon: Flame },
    { id: "special", label: "Special", icon: Star },
  ];

  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter((a) => a.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "uncommon": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rare": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "epic": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "legendary": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "upload": return <Upload className="w-4 h-4" />;
      case "view": return <Eye className="w-4 h-4" />;
      case "engagement": return <Heart className="w-4 h-4" />;
      case "streak": return <Flame className="w-4 h-4" />;
      case "special": return <Star className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-zinc-300">{unlockedCount}/{totalCount}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              <Trophy className="w-5 h-5" />
              Achievements
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {achievements.slice(0, 9).map((achievement) => (
              <div
                key={achievement.id}
                className={`relative p-2 rounded-lg border text-center cursor-pointer transition-all ${
                  achievement.unlocked
                    ? getRarityColor(achievement.rarity)
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-600"
                }`}
              >
                <div className="text-xl">{achievement.icon}</div>
                <div className="text-xs mt-1 truncate">{achievement.name}</div>
                {!achievement.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-zinc-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            onClick={() => setIsOpen(false)}
          >
            View All
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Achievements</h2>
              <p className="text-sm text-zinc-400">{unlockedCount} of {totalCount} unlocked</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{Math.round((unlockedCount / totalCount) * 100)}%</div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`gap-1 whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-xl border transition-all ${
                achievement.unlocked
                  ? getRarityColor(achievement.rarity)
                  : "bg-zinc-800/50 border-zinc-700/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${achievement.unlocked ? "text-white" : "text-zinc-500"}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm ${achievement.unlocked ? "text-zinc-300" : "text-zinc-600"}`}>
                    {achievement.description}
                  </p>
                  {!achievement.unlocked && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-zinc-600 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.requirement}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {achievement.unlocked && (
                  <Award className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Lock className="w-6 h-6 text-zinc-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function useAchievements() {
  const updateAchievement = (achievementId: string, progress: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    try {
      const parsed = JSON.parse(stored);
      const defaultAchievements = parsed.default || [];
      const updated = defaultAchievements.map((a: Achievement) => {
        if (a.id === achievementId) {
          const newProgress = Math.min(progress, a.requirement);
          const isNowUnlocked = newProgress >= a.requirement;
          return {
            ...a,
            progress: newProgress,
            unlocked: isNowUnlocked,
            unlockedAt: isNowUnlocked && !a.unlocked ? new Date().toISOString() : a.unlockedAt,
          };
        }
        return a;
      });
      parsed.default = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error("Failed to update achievement:", e);
    }
  };

  return { updateAchievement };
}