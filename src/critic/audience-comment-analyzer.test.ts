import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeAudienceComments } from "./audience-comment-analyzer";
import * as genaiClient from "@/lib/google/genai-client";

describe("Audience Comment Analyzer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns honest abstention when comments array is empty", async () => {
    const analysis = await analyzeAudienceComments([], "Empty Project", "Sci-Fi");
    expect(analysis).toBeDefined();
    expect(analysis.organicVsBrigadedFlag).toBe("insufficient_sample");
    expect(analysis.characterAndLoreObsessions).toEqual([]);
    expect(analysis.merchandiseDemandSignals).toEqual([]);
    expect(analysis.demographicAndFandomComps).toEqual([]);
    expect(analysis.sentimentScore).toBe(0);
    expect(analysis.audienceResonanceSummary).toContain("Insufficient public audience comments");
  });

  it("analyzes public comments with Gemini when comments are provided", async () => {
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

    const mockAiResponse = {
      characterAndLoreObsessions: ["Adversarial chemistry between Duke and Missi"],
      merchandiseDemandSignals: ["Kickstarter artbook backers demanding vinyl OST pressing"],
      toneAndWritingReception: {
        praise: ["Strong character dynamic", "Expressive animation pacing"],
        critiques: ["Pilot release timeline"],
      },
      demographicAndFandomComps: ["Indie Animation Fandom", "Adult Indie Series"],
      organicVsBrigadedFlag: "concentrated_cult",
      audienceResonanceSummary: "High passion cult engagement focused on character dynamic and soundtrack.",
      sentimentScore: 94,
    };

    vi.spyOn(genaiClient, "getGoogleGenAIClient").mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify(mockAiResponse),
        }),
      },
    } as any);

    const analysis = await analyzeAudienceComments(mockComments, "The Vampair Series", "Dark Fantasy Musical Animation");
    expect(analysis).toBeDefined();
    expect(analysis.characterAndLoreObsessions).toHaveLength(1);
    expect(analysis.characterAndLoreObsessions[0]).toContain("Duke and Missi");
    expect(analysis.merchandiseDemandSignals).toHaveLength(1);
    expect(analysis.demographicAndFandomComps).toHaveLength(2);
    expect(analysis.sentimentScore).toBe(94);
    expect(analysis.organicVsBrigadedFlag).toBe("concentrated_cult");
  });
});
