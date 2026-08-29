import { describe, it, expect } from "vitest";
import { computeMarketViability } from "./market-viability-engine";

describe("Market Viability Engine", () => {
  it("computes 4 dimensions and returns institutional buyer decision matrix", () => {
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

    const report = computeMarketViability(mockSources, { pledged: 225460, goal: 135000, backers: 3512 }, { views: 1800000, likes: 140000, comments: 9000 });
    expect(report).toBeDefined();
    expect(report.overallScore).toBeGreaterThanOrEqual(70);
    expect(report.dimensions.crossPlatformDiffusion.hasTradePress).toBe(true);
    expect(report.dimensions.buyerSlateAlignment.topBuyers.length).toBeGreaterThan(0);
    expect(report.buyerDecisionMatrix.recommendedAction).toBeDefined();
  });
});
