"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Video,
  Upload,
  ThumbsUp,
  MessageSquare,
  Lightbulb,
  Target,
  Flame,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Calendar,
  Clock,
  Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { toBackendAssetUrl, formatViewCount } from "@/lib/utils";

interface Channel {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  subscribers?: string[];
  owner: string | { _id: string };
  createdAt?: string;
}

interface VideoData {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  views: number;
  duration: number;
  likesCount?: number;
  commentsCount?: number;
  isPublished: boolean;
  createdAt: string;
}

interface GrowthTip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action?: { label: string; href: string };
}

interface ChannelHealthMetric {
  label: string;
  score: number;
  status: "great" | "good" | "needs-work" | "critical";
  tip: string;
}

interface StudioDashboardProps {
  channel: Channel;
}

export function StudioDashboard({ channel }: StudioDashboardProps) {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const userId =
        typeof channel.owner === "string"
          ? channel.owner
          : channel.owner?._id;
      const res = await apiClient.get("/videos/search", {
        params: { userId },
      });
      const data = res.data.data;
      const vids: VideoData[] = Array.isArray(data)
        ? data
        : data.videos || [];
      setVideos(vids);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [channel._id, channel.owner]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Computed analytics ───────────────────────────────────────────────
  const published = useMemo(
    () => videos.filter((v) => v.isPublished),
    [videos]
  );
  const drafts = useMemo(
    () => videos.filter((v) => !v.isPublished),
    [videos]
  );

  const totalViews = useMemo(
    () => published.reduce((s, v) => s + (v.views || 0), 0),
    [published]
  );
  const totalLikes = useMemo(
    () => published.reduce((s, v) => s + (v.likesCount || 0), 0),
    [published]
  );
  const totalComments = useMemo(
    () => published.reduce((s, v) => s + (v.commentsCount || 0), 0),
    [published]
  );
  const subsCount = channel.subscribers?.length || 0;

  const avgEngagement = useMemo(() => {
    if (totalViews === 0) return 0;
    return ((totalLikes + totalComments) / totalViews) * 100;
  }, [totalViews, totalLikes, totalComments]);

  const avgViewsPerVideo = useMemo(() => {
    if (published.length === 0) return 0;
    return Math.round(totalViews / published.length);
  }, [totalViews, published.length]);

  const daysSinceLastUpload = useMemo(() => {
    if (videos.length === 0) return -1;
    const sorted = [...videos].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const diff = Date.now() - new Date(sorted[0].createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [videos]);

  const uploadFrequency = useMemo(() => {
    if (videos.length < 2) return 0;
    const sorted = [...videos].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const first = new Date(sorted[0].createdAt).getTime();
    const last = new Date(sorted[sorted.length - 1].createdAt).getTime();
    const daySpan = (last - first) / (1000 * 60 * 60 * 24);
    return Math.round(daySpan / (videos.length - 1));
  }, [videos]);

  const bestVideo = useMemo(() => {
    if (published.length === 0) return null;
    return [...published].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
  }, [published]);

  const worstVideo = useMemo(() => {
    if (published.length < 2) return null;
    return [...published].sort((a, b) => (a.views || 0) - (b.views || 0))[0];
  }, [published]);

  const missingDesc = useMemo(
    () =>
      videos.filter(
        (v) => !v.description || v.description.trim().length < 20
      ),
    [videos]
  );

  const shortVideos = useMemo(
    () => published.filter((v) => v.duration < 60),
    [published]
  );

  // ── Channel Health Score ─────────────────────────────────────────────
  const healthMetrics: ChannelHealthMetric[] = useMemo(() => {
    const metrics: ChannelHealthMetric[] = [];

    // Upload consistency
    let uploadScore = 100;
    if (daysSinceLastUpload < 0) uploadScore = 0;
    else if (daysSinceLastUpload <= 3) uploadScore = 100;
    else if (daysSinceLastUpload <= 7) uploadScore = 80;
    else if (daysSinceLastUpload <= 14) uploadScore = 50;
    else if (daysSinceLastUpload <= 30) uploadScore = 25;
    else uploadScore = 10;
    metrics.push({
      label: "Upload Consistency",
      score: uploadScore,
      status:
        uploadScore >= 80
          ? "great"
          : uploadScore >= 50
          ? "good"
          : uploadScore >= 25
          ? "needs-work"
          : "critical",
      tip:
        daysSinceLastUpload > 7
          ? "Last upload was " + daysSinceLastUpload + " days ago. Regular uploads keep your audience engaged."
          : daysSinceLastUpload < 0
          ? "Upload your first video to get started!"
          : "Great job staying consistent!",
    });

    // Engagement quality
    const engScore = Math.min(100, avgEngagement * 10);
    metrics.push({
      label: "Audience Engagement",
      score: Math.round(engScore),
      status:
        engScore >= 70
          ? "great"
          : engScore >= 40
          ? "good"
          : engScore >= 15
          ? "needs-work"
          : "critical",
      tip:
        engScore < 40
          ? "Ask questions in your videos or pin a comment to boost interaction."
          : "Your audience is actively engaging!",
    });

    // Content completeness
    const completeVideos = videos.filter(
      (v) => v.description && v.description.trim().length >= 20 && v.thumbnail
    );
    const completenessScore =
      videos.length > 0
        ? Math.round((completeVideos.length / videos.length) * 100)
        : 0;
    metrics.push({
      label: "Content Quality",
      score: completenessScore,
      status:
        completenessScore >= 80
          ? "great"
          : completenessScore >= 50
          ? "good"
          : completenessScore >= 25
          ? "needs-work"
          : "critical",
      tip:
        completenessScore < 80
          ? missingDesc.length + " video" + (missingDesc.length === 1 ? "" : "s") + " missing proper descriptions. Good descriptions improve discoverability."
          : "All your content is well-described!",
    });

    // Publishing ratio
    const pubRatio =
      videos.length > 0
        ? Math.round((published.length / videos.length) * 100)
        : 0;
    metrics.push({
      label: "Publishing Rate",
      score: pubRatio,
      status:
        pubRatio >= 80
          ? "great"
          : pubRatio >= 50
          ? "good"
          : pubRatio >= 25
          ? "needs-work"
          : "critical",
      tip:
        drafts.length > 0
          ? "You have " + drafts.length + " unpublished draft" + (drafts.length === 1 ? "" : "s") + ". Review and publish them to reach more viewers."
          : "All videos are published!",
    });

    return metrics;
  }, [daysSinceLastUpload, avgEngagement, videos, published, drafts, missingDesc]);

  const overallHealth = useMemo(() => {
    if (healthMetrics.length === 0) return 0;
    return Math.round(
      healthMetrics.reduce((s, m) => s + m.score, 0) / healthMetrics.length
    );
  }, [healthMetrics]);

  // ── Dynamic Growth Tips ──────────────────────────────────────────────
  const growthTips: GrowthTip[] = useMemo(() => {
    const tips: GrowthTip[] = [];

    if (videos.length === 0) {
      tips.push({
        id: "first-upload",
        icon: <Upload className="w-5 h-5 text-blue-500" />,
        title: "Upload your first video",
        description:
          "Every great channel starts with one video. Upload something today — it doesn't have to be perfect!",
        priority: "high",
        action: { label: "Upload Now", href: "/upload" },
      });
      return tips;
    }

    if (daysSinceLastUpload > 7) {
      tips.push({
        id: "upload-consistency",
        icon: <Calendar className="w-5 h-5 text-orange-500" />,
        title: daysSinceLastUpload + " days since your last upload",
        description:
          "Channels that upload weekly grow 4x faster. Try setting a schedule — even one video per week makes a big difference.",
        priority: "high",
        action: { label: "Upload Video", href: "/upload" },
      });
    }

    if (drafts.length > 0) {
      tips.push({
        id: "publish-drafts",
        icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        title: drafts.length + " draft" + (drafts.length === 1 ? "" : "s") + " waiting to be published",
        description:
          'You have content ready to go! Publishing "' + drafts[0].title + '" could bring in new viewers today.',
        priority: "high",
      });
    }

    if (totalViews > 50 && avgEngagement < 2) {
      tips.push({
        id: "boost-engagement",
        icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
        title: "Boost your engagement rate",
        description:
          "Your engagement rate is below 2%. Try these: Ask a question in the first 30 seconds, use a strong hook, or add a pinned comment encouraging discussion.",
        priority: "medium",
      });
    }

    if (missingDesc.length > 0) {
      tips.push({
        id: "add-descriptions",
        icon: <Sparkles className="w-5 h-5 text-cyan-500" />,
        title: missingDesc.length + " video" + (missingDesc.length === 1 ? " needs" : "s need") + " better descriptions",
        description:
          "Detailed descriptions with keywords help viewers find your content through search. Aim for at least 2-3 sentences.",
        priority: "medium",
      });
    }

    if (bestVideo && published.length >= 3) {
      const bestEngagement =
        ((bestVideo.likesCount || 0) + (bestVideo.commentsCount || 0)) /
        Math.max(bestVideo.views, 1);
      tips.push({
        id: "replicate-success",
        icon: <Star className="w-5 h-5 text-yellow-500" />,
        title:
          '"' +
          bestVideo.title.substring(0, 40) +
          (bestVideo.title.length > 40 ? "..." : "") +
          '" is your top performer',
        description:
          "With " +
          formatViewCount(bestVideo.views) +
          " views and " +
          (bestEngagement * 100).toFixed(1) +
          "% engagement — make more content like this! Analyze what made it work: the topic, thumbnail, title, or length.",
        priority: "medium",
      });
    }

    if (subsCount > 0 && totalViews > 0) {
      const viewsPerSub = totalViews / subsCount;
      if (viewsPerSub < 2) {
        tips.push({
          id: "subscriber-activation",
          icon: <Users className="w-5 h-5 text-green-500" />,
          title: "Your subscribers aren't watching enough",
          description:
            "Your views-per-subscriber ratio is low. Try posting at consistent times so subscribers know when to check back, and mention new uploads in your video outros.",
          priority: "medium",
        });
      }
    }

    if (subsCount === 0 && published.length >= 1) {
      tips.push({
        id: "first-subscriber",
        icon: <Target className="w-5 h-5 text-red-500" />,
        title: "Get your first subscriber",
        description:
          "Share your channel link with friends, add a subscribe reminder in your videos, and engage with other creators' content to build visibility.",
        priority: "high",
      });
    }

    if (shortVideos.length > 0 && published.length > 1) {
      const longVids = published.filter((v) => v.duration >= 60);
      const shortAvgViews =
        shortVideos.reduce((s, v) => s + v.views, 0) /
        Math.max(shortVideos.length, 1);
      const longAvgViews =
        longVids.reduce((s, v) => s + v.views, 0) /
        Math.max(longVids.length, 1);
      if (longVids.length > 0 && longAvgViews > shortAvgViews * 1.5) {
        tips.push({
          id: "video-length",
          icon: <Clock className="w-5 h-5 text-indigo-500" />,
          title: "Longer videos perform better for you",
          description:
            "Your videos over 1 minute average " +
            formatViewCount(Math.round(longAvgViews)) +
            " views vs " +
            formatViewCount(Math.round(shortAvgViews)) +
            " for shorter ones. Consider making more in-depth content.",
          priority: "low",
        });
      }
    }

    if (published.length < 10) {
      const remaining = 10 - published.length;
      tips.push({
        id: "milestone-10",
        icon: <Target className="w-5 h-5 text-blue-500" />,
        title: remaining + " more video" + (remaining === 1 ? "" : "s") + " to hit 10 published",
        description:
          "Channels with 10+ videos are taken more seriously by viewers and recommended more often. Keep going!",
        priority: "low",
        action: { label: "Upload", href: "/upload" },
      });
    } else if (published.length < 50) {
      const remaining = 50 - published.length;
      tips.push({
        id: "milestone-50",
        icon: <Flame className="w-5 h-5 text-orange-500" />,
        title: remaining + " more video" + (remaining === 1 ? "" : "s") + " to hit 50 published",
        description:
          "50 videos is a major milestone — it shows commitment and gives new viewers a library to explore.",
        priority: "low",
      });
    }

    return tips.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [
    videos,
    published,
    drafts,
    bestVideo,
    totalViews,
    avgEngagement,
    daysSinceLastUpload,
    missingDesc,
    shortVideos,
    subsCount,
  ]);

  // ── Status helpers ───────────────────────────────────────────────────
  const statusColor = (s: ChannelHealthMetric["status"]) =>
    s === "great"
      ? "text-green-500"
      : s === "good"
      ? "text-blue-500"
      : s === "needs-work"
      ? "text-yellow-500"
      : "text-red-500";

  const progressColor = (s: ChannelHealthMetric["status"]) =>
    s === "great"
      ? "[&>div]:bg-green-500"
      : s === "good"
      ? "[&>div]:bg-blue-500"
      : s === "needs-work"
      ? "[&>div]:bg-yellow-500"
      : "[&>div]:bg-red-500";

  const priorityBadge = (p: GrowthTip["priority"]) =>
    p === "high"
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : p === "medium"
      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      : "bg-blue-500/10 text-blue-500 border-blue-500/20";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Growth Dashboard</h2>
          <p className="text-muted-foreground">
            Actionable insights to grow {channel.name}
          </p>
        </div>
        <Link href="/upload">
          <Button size="lg" className="gap-2">
            <Upload className="w-5 h-5" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* ── Channel Health Score ────────────────────────────────────── */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Channel Health Score
              </CardTitle>
              <CardDescription>
                How well your channel is set up for growth
              </CardDescription>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/20"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={((overallHealth / 100) * 213.6) + " 213.6"}
                  strokeLinecap="round"
                  className={
                    overallHealth >= 70
                      ? "text-green-500"
                      : overallHealth >= 40
                      ? "text-yellow-500"
                      : "text-red-500"
                  }
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                {overallHealth}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthMetrics.map((m) => (
              <div
                key={m.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/60"
              >
                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                  <span
                    className={"text-lg font-bold " + statusColor(m.status)}
                  >
                    {m.score}
                  </span>
                  <Progress
                    value={m.score}
                    className={"h-1.5 w-12 " + progressColor(m.status)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Key Metrics ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {avgViewsPerVideo} avg/video
              </Badge>
            </div>
            <div className="text-2xl font-bold">
              {formatViewCount(totalViews)}
            </div>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              {subsCount > 0 && totalViews > 0 && (
                <Badge variant="outline" className="text-xs">
                  {(totalViews / subsCount).toFixed(1)} views/sub
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold">{subsCount}</div>
            <p className="text-xs text-muted-foreground">Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className={"text-xs " + (
                  avgEngagement >= 5
                    ? "text-green-500"
                    : avgEngagement >= 2
                    ? "text-yellow-500"
                    : "text-red-500"
                )}
              >
                {avgEngagement.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold">
              {totalLikes + totalComments}
            </div>
            <p className="text-xs text-muted-foreground">
              Total Engagement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              {drafts.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs text-yellow-500"
                >
                  +{drafts.length} drafts
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold">{published.length}</div>
            <p className="text-xs text-muted-foreground">
              Published Videos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Growth Tips ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Growth Tips
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your channel data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {growthTips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <h4 className="font-semibold text-lg">Looking great!</h4>
              <p className="text-muted-foreground text-sm mt-1">
                No urgent improvements needed. Keep creating!
              </p>
            </div>
          ) : (
            growthTips.slice(0, 5).map((tip) => (
              <div
                key={tip.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5 shrink-0">{tip.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{tip.title}</h4>
                    <Badge
                      variant="outline"
                      className={"text-[10px] px-1.5 py-0 " + priorityBadge(tip.priority)}
                    >
                      {tip.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </div>
                {tip.action && (
                  <Link href={tip.action.href} className="shrink-0">
                    <Button size="sm" variant="outline" className="gap-1">
                      {tip.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Best vs Worst Performance ──────────────────────────────── */}
      {bestVideo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {bestVideo.thumbnail && (
                  <div className="relative w-28 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                    <img
                      src={toBackendAssetUrl(bestVideo.thumbnail)}
                      alt={bestVideo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {bestVideo.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViewCount(bestVideo.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {bestVideo.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {bestVideo.commentsCount || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-green-600 dark:text-green-400 mt-1.5">
                    Make more content like this!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {worstVideo && worstVideo._id !== bestVideo._id && (
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-yellow-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {worstVideo.thumbnail && (
                    <div className="relative w-28 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                      <img
                        src={toBackendAssetUrl(worstVideo.thumbnail)}
                        alt={worstVideo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {worstVideo.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViewCount(worstVideo.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {worstVideo.likesCount || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-1.5">
                      Try updating the title or thumbnail
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Upload Cadence ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Upload Cadence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p
                className={"text-2xl font-bold " + (
                  daysSinceLastUpload > 14
                    ? "text-red-500"
                    : daysSinceLastUpload > 7
                    ? "text-yellow-500"
                    : "text-green-500"
                )}
              >
                {daysSinceLastUpload < 0 ? "—" : daysSinceLastUpload}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Days Since Last Upload
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {uploadFrequency > 0 ? "~" + uploadFrequency : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Days Between Uploads
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{videos.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Videos (incl. drafts)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
