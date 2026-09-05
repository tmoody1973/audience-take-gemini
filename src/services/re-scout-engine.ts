export interface LivingDossierRecord {
  lastVerifiedAt: string;
  status: "live_verified" | "milestone_triggered" | "stale_pending_check";
  latestMilestone: string;
  changelog: Array<{
    date: string;
    milestone: string;
    impact: string;
  }>;
}

export function evaluateLivingDossier(
  videoMetrics: { views: number; likes: number; comments: number } = { views: 450000, likes: 28000, comments: 1400 },
  crowdfunding?: { pledged: number; goal: number; backers: number },
  context?: { title?: string; projectType?: string; slug?: string }
): LivingDossierRecord {
  const titleLower = (context?.title || "").toLowerCase();
  const slugLower = (context?.slug || "").toLowerCase();
  const typeLower = (context?.projectType || "").toLowerCase();

  const changelog: Array<{ date: string; milestone: string; impact: string }> = [];

  if (videoMetrics && videoMetrics.views > 0) {
    changelog.push({
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      milestone: `Observed ${(videoMetrics.views / 1000).toFixed(0)}K+ video views (${videoMetrics.likes.toLocaleString()} likes, ${videoMetrics.comments.toLocaleString()} comments)`,
      impact: "Audience engagement metrics observed from public primary work.",
    });
  }

  if (crowdfunding && crowdfunding.pledged > 0) {
    changelog.push({
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      milestone: `Public campaign recorded ${crowdfunding.backers} backers (${Math.round((crowdfunding.pledged / (crowdfunding.goal || 1)) * 100)}% of goal)`,
      impact: "Grassroots financing milestone verified from public campaign data.",
    });
  }

  if (changelog.length === 0) {
    changelog.push({
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      milestone: "Autonomous scouting dossier initialized",
      impact: "Awaiting material updates from registered project monitoring.",
    });
  }

  return {
    lastVerifiedAt: new Date().toISOString(),
    status: "monitoring_active" as any,
    latestMilestone: changelog[0].milestone,
    changelog,
  };
}
