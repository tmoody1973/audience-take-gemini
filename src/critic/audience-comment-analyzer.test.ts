import { describe, it, expect } from "vitest";
import { analyzeAudienceComments } from "./audience-comment-analyzer";

describe("Audience Comment Analyzer", () => {
  it("returns comprehensive fandom DNA structure", async () => {
    const mockComments = [
      {
        id: "c1",
        authorName: "Fan1",
        text: "Duke and Missi have insane chemistry! Need this pilot ASAP on Prime Video.",
        likeCount: 500,
        publishedAt: "2025-07-04T00:00:00Z",
        replyCount: 20,
      },
      {
        id: "c2",
        authorName: "Fan2",
        text: "Backed the artbook tier on Kickstarter! Please release vinyl OST.",
        likeCount: 300,
        publishedAt: "2025-07-04T01:00:00Z",
        replyCount: 10,
      },
    ];

    const analysis = await analyzeAudienceComments(mockComments, "The Vampair Series", "Dark Fantasy Musical Animation");
    expect(analysis).toBeDefined();
    expect(analysis.characterAndLoreObsessions.length).toBeGreaterThan(0);
    expect(analysis.merchandiseDemandSignals.length).toBeGreaterThan(0);
    expect(analysis.demographicAndFandomComps.length).toBeGreaterThan(0);
    expect(analysis.sentimentScore).toBeGreaterThanOrEqual(0);
    expect(["organic_broad_base", "concentrated_cult", "brigaded_fandom"]).toContain(analysis.organicVsBrigadedFlag);
  });
});
