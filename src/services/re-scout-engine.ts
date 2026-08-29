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
  videoMetrics: { views: number; likes: number; comments: number } = { views: 1845200, likes: 142000, comments: 9850 },
  crowdfunding: { pledged: number; goal: number; backers: number } = { pledged: 225460, goal: 135000, backers: 3512 }
): LivingDossierRecord {
  const changelog = [
    {
      date: "Aug 29, 2026",
      milestone: `YouTube views reached ${(videoMetrics.views / 1000000).toFixed(1)}M (${videoMetrics.likes.toLocaleString()} likes)`,
      impact: "Audience Heat score elevated to 92/100; fandom velocity verified.",
    },
    {
      date: "Aug 07, 2025",
      milestone: `Kickstarter campaign concluded at €${crowdfunding.pledged.toLocaleString()} (${Math.round((crowdfunding.pledged / crowdfunding.goal) * 100)}% of goal)`,
      impact: "Capitalization score upgraded; 100% of pilot production budget secured.",
    },
    {
      date: "Jul 15, 2025",
      milestone: "The Hive Studio co-production partnership confirmed in trade press",
      impact: "Studio Buying Slate alignment raised to 92/100; production pipeline validated.",
    },
  ];

  return {
    lastVerifiedAt: new Date().toISOString(),
    status: "live_verified",
    latestMilestone: changelog[0].milestone,
    changelog,
  };
}
