import { describe, it, expect } from "vitest";
import { computeMarketViability } from "./market-viability-engine";

describe("Market Viability Engine", () => {
  it("computes 4 dimensions from verified sources, crowdfunding, and metrics without inventing buyers or false precision", () => {
    const mockSources = [
      {
        id: "s1",
        origin: "submitted" as const,
        title: "Vampair Series Pilot Trailer",
        url: "https://www.youtube.com/watch?v=VvqQHBjY46w",
        publishedAt: null,
        retrievedAt: new Date().toISOString(),
        availability: "available" as const,
        verificationStatus: "verified" as const,
        supportsClaimIds: ["c1"],
        externalCommentary: false,
      },
      {
        id: "s2",
        origin: "parallel" as const,
        title: "Animation Magazine: Daria Cohen & The Hive Studio",
        url: "https://www.animationmagazine.net/2025/07/daria-cohen-vampair",
        publishedAt: null,
        retrievedAt: new Date().toISOString(),
        availability: "available" as const,
        verificationStatus: "verified" as const,
        supportsClaimIds: ["c2"],
        externalCommentary: true,
      },
    ];

    const report = computeMarketViability(
      mockSources,
      { pledged: 225460, goal: 135000, backers: 3512 },
      { views: 1800000, likes: 140000, comments: 9000 },
      { projectType: "animation" }
    );
    expect(report).toBeDefined();
    expect(report.overallScore).toBeGreaterThanOrEqual(60);
    expect(report.dimensions.crossPlatformDiffusion.hasTradePress).toBe(true);
    expect(report.buyerDecisionMatrix.recommendedAction).toBe("Acquire & Slate for Coproduction");
  });

  it("abstains from optimistic scores when evidence and crowdfunding are completely absent (EI-1)", () => {
    const report = computeMarketViability(
      [],
      undefined,
      undefined,
      { title: "Unknown Indie Film", slug: "unknown-indie", projectType: "short" }
    );

    expect(report.dimensions.crossPlatformDiffusion.distinctDomainsCount).toBe(0);
    expect(report.dimensions.crossPlatformDiffusion.score).toBe(0);
    expect(report.dimensions.budgetToFormatRealism.score).toBe(0);
    expect(report.audienceHeatScore).toBe(0);
    expect(report.buyerDecisionMatrix.primaryBuyerTargets).toEqual([]);
    expect(report.buyerDecisionMatrix.recommendedAction).toBe("Pass / Too Early");
  });
});
