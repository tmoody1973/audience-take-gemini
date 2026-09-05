import { extractSourcePublisher } from "@/features/scout-card/citation-labels";
import type { SourceLedgerEntry } from "@/features/scout-card/types";

export interface MarketViabilityReport {
  overallScore: number; // 0-100
  audienceHeatScore: number; // 0-100
  marketReadinessScore: number; // 0-100
  tier: "Category Breakout" | "Niche Cult IP" | "Franchise Scale" | "Early Development";
  dimensions: {
    crossPlatformDiffusion: {
      score: number;
      distinctDomainsCount: number;
      hasTradePress: boolean;
      explanation: string;
    };
    budgetToFormatRealism: {
      score: number;
      estCostPerMinute: string;
      capitalizationRatio: string;
      studioAttachment: string;
      explanation: string;
    };
    buyerSlateAlignment: {
      score: number;
      topBuyers: string[];
      genreFitRationale: string;
    };
    commercialCeilingTam: {
      score: number;
      estTam: string;
      averageSpendPerBacker: string;
      explanation: string;
    };
  };
  buyerDecisionMatrix: {
    recommendedAction: "Acquire & Slate for Coproduction" | "Track Pilot Delivery" | "Pass / Too Early";
    primaryBuyerTargets: string[];
    buyerRiskFactors: string[];
    commercialCeilingVerdict: string;
  };
}

export function computeMarketViability(
  sources: SourceLedgerEntry[] = [],
  crowdfunding?: { pledged: number; goal: number; backers: number },
  videoMetrics?: { views: number; likes: number; comments: number },
  context?: { projectType?: string; title?: string; slug?: string }
): MarketViabilityReport {
  // Determine genre / project context from explicit project metadata only — never title/slug keywords
  const projectType = (context?.projectType || "").toLowerCase();
  const isDocumentary = projectType.includes("doc");
  const isAnimation = projectType.includes("anim");
  const isComedy = projectType.includes("comedy");
  const isSeries = projectType.includes("series");

  // 1. Cross-Platform Diffusion Calculation
  const domains = new Set<string>();
  let hasTradePress = false;
  const tradeKeywords = [
    "variety", "deadline", "hollywood reporter", "screendaily", "pbs",
    "animation magazine", "c21media", "kidscreen", "indiewire", "filmmaker", "gcn.ie"
  ];

  sources.forEach((s) => {
    try {
      if (s.url) {
        const host = new URL(s.url).hostname.replace(/^www\./, "").toLowerCase();
        domains.add(host);
      }
    } catch {}
    const pub = extractSourcePublisher(s).toLowerCase();
    if (tradeKeywords.some((kw) => pub.includes(kw) || s.title?.toLowerCase().includes(kw))) {
      hasTradePress = true;
    }
  });

  const domainCount = domains.size;
  const diffusionScore = Math.min(95, domainCount * 15 + (hasTradePress ? 25 : 0));

  // 2. Budget & Unit Economics (Only when empirical crowdfunding data exists)
  const hasCrowdfunding = Boolean(crowdfunding && (crowdfunding.pledged > 0 || crowdfunding.goal > 0));
  const pledged = crowdfunding?.pledged ?? 0;
  const goal = crowdfunding?.goal ?? 0;
  const backers = crowdfunding?.backers ?? 0;
  const capRatio = goal > 0 ? Math.round((pledged / goal) * 100) : 0;

  const budgetScore = hasCrowdfunding
    ? capRatio >= 150
      ? 88
      : capRatio >= 100
      ? 82
      : capRatio > 0
      ? 60
      : 30
    : 0;

  // 3. Buyer Slate Alignment (Based strictly on trade evidence)
  const buyerScore = hasTradePress ? 85 : domainCount >= 3 ? 50 : 25;

  let topBuyers: string[] = [];
  let genreFitRationale = "Commercial and buyer interest require dedicated trade discovery and verified co-production inquiries.";
  let buyerRiskFactors: string[] = [
    "Commercial financing and distribution terms unconfirmed",
    "Independent rights chain requires legal diligence"
  ];
  let commercialCeilingVerdict = "Early-stage independent project; commercial ceiling contingent on verified festival premiere or co-production attachment.";
  let estCostPerMinute: string | undefined = undefined;
  let studioAttachment: string | undefined = undefined;
  let estTam: string | undefined = undefined;
  let recommendedAction: "Acquire & Slate for Coproduction" | "Track Pilot Delivery" | "Pass / Too Early" = "Track Pilot Delivery";

  if (hasTradePress && (isDocumentary || isAnimation || isComedy || isSeries)) {
    genreFitRationale = isDocumentary
      ? "Trade coverage indicates public broadcast and institutional interest for verified non-fiction subject matter."
      : isAnimation
      ? "Documented indie animation traction with dedicated cult audience followings."
      : isComedy
      ? "Documented digital comedy audience response across niche demographics."
      : "Documented independent series proof-of-concept traction.";

    buyerRiskFactors = [
      "Production timeline contingent on partner pipeline throughput",
      "Rights clearance and talent exclusivity require verification"
    ];

    commercialCeilingVerdict = "Documented trade interest indicates viable specialty acquisition or streaming license pathway.";
    recommendedAction = capRatio >= 100 ? "Acquire & Slate for Coproduction" : "Track Pilot Delivery";
  } else if (!hasTradePress && !hasCrowdfunding && domainCount <= 1) {
    recommendedAction = "Pass / Too Early";
    commercialCeilingVerdict = "Insufficient public evidence or trade momentum to establish commercial buyer viability.";
  }

  // 4. Commercial Ceiling & ARPU
  const arpu = backers > 0 ? (pledged / backers).toFixed(2) : "0.00";
  const commercialScore = hasCrowdfunding && parseFloat(arpu) > 40
    ? 80
    : hasCrowdfunding && parseFloat(arpu) > 0
    ? 60
    : (videoMetrics?.views ?? 0) > 100000
    ? 50
    : 20;

  // Blended Scores — No artificial floors
  const marketReadinessScore = Math.round(
    diffusionScore * 0.35 + budgetScore * 0.25 + buyerScore * 0.25 + commercialScore * 0.15
  );

  const viewsCount = videoMetrics?.views ?? 0;
  const audienceHeatScore = viewsCount > 0 || hasCrowdfunding
    ? Math.min(98, Math.round(
        (viewsCount > 0 ? Math.min(50, Math.log10(viewsCount) * 10) : 10) +
        (capRatio > 100 ? 30 : capRatio > 0 ? 15 : 0) +
        (parseFloat(arpu) > 40 ? 15 : 0)
      ))
    : 0;

  const overallScore = Math.round((marketReadinessScore * 0.55) + (audienceHeatScore * 0.45));

  return {
    overallScore,
    audienceHeatScore,
    marketReadinessScore,
    tier: overallScore >= 75 ? "Category Breakout" : overallScore >= 40 ? "Niche Cult IP" : "Early Development",
    dimensions: {
      crossPlatformDiffusion: {
        score: diffusionScore,
        distinctDomainsCount: domainCount,
        hasTradePress,
        explanation: hasTradePress
          ? "Independent coverage verified across institutional industry outlets."
          : domainCount > 0
          ? `Discovered across ${domainCount} independent web domain${domainCount === 1 ? "" : "s"}.`
          : "No external web domain coverage discovered yet.",
      },
      budgetToFormatRealism: {
        score: budgetScore,
        estCostPerMinute: estCostPerMinute || "Unverified from public sources",
        capitalizationRatio: hasCrowdfunding
          ? `${capRatio}% funded ($${pledged.toLocaleString()} of $${goal.toLocaleString()})`
          : "No public crowdfunding financial data verified",
        studioAttachment: studioAttachment || "None verified",
        explanation: hasCrowdfunding
          ? `Public campaign: $${pledged.toLocaleString()} raised from ${backers.toLocaleString()} backers.`
          : "Financing and budget specifics are unverified from public sources.",
      },
      buyerSlateAlignment: {
        score: buyerScore,
        topBuyers,
        genreFitRationale,
      },
      commercialCeilingTam: {
        score: commercialScore,
        estTam: estTam || "Unverified / Subject to Distribution Deal",
        averageSpendPerBacker: hasCrowdfunding ? `$${arpu} / backer` : "N/A",
        explanation: hasCrowdfunding
          ? `Demonstrated audience financial commitment: average pledge of $${arpu} across ${backers.toLocaleString()} backers.`
          : "No transaction or pledge commitments available to calculate discretionary spend.",
      },
    },
    buyerDecisionMatrix: {
      recommendedAction,
      primaryBuyerTargets: topBuyers,
      buyerRiskFactors,
      commercialCeilingVerdict,
    },
  };
}
