import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMTrailerCriticSchema } from "@/domain/schemas";
import { analyzeTrailerVideo } from "@/critic/trailer-critic-engine";
import * as genaiClient from "@/lib/google/genai-client";

describe("Trailer Critic Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns honest unavailable status when AI video analysis is not configured or fails", async () => {
    vi.spyOn(genaiClient, "getGoogleGenAIClient").mockReturnValue(null);

    const critic = await analyzeTrailerVideo(
      "proj-signal-in-the-pines",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );

    expect(critic).toBeDefined();
    expect(critic.projectId).toBe("proj-signal-in-the-pines");
    // Beats must be empty rather than inventing fake lookout tower scenes
    expect(critic.timestampedBeats).toHaveLength(0);
    expect(critic.craftAnalysis.cinematography).toBe("Unavailable");
    expect(critic.criticMatrix.clarity).toBe(0);
    expect(critic.limitations).toContain("Video craft analysis could not be completed");

    // Must satisfy the updated schema
    const parsed = LLMTrailerCriticSchema.safeParse(critic);
    expect(parsed.success).toBe(true);
  });

  it("validates and parses complete multimodal critic breakdown when Gemini analysis succeeds", async () => {
    const mockCriticOutput = {
      summary: "A sensory-driven horror teaser emphasizing tactile Foley sound and claustrophobic framing.",
      genreAndForm: "Short Film / Psychological Horror",
      whyItMayConnect: "Subverts jump scares in favor of sustained dread and analog sound textures.",
      timestampedBeats: [
        {
          timestampSeconds: 0,
          timestampFormatted: "0:00",
          label: "Radio Static Entry",
          description: "Distorted voice crackles through emergency radio equipment.",
        },
        {
          timestampSeconds: 8,
          timestampFormatted: "0:08",
          label: "Visual Reveal",
          description: "Camera reveals lone character trapped inside cabin as power fails.",
        },
      ],
      craftAnalysis: {
        cinematography: "Chiaroscuro halogen lighting with natural anamorphic lens flare.",
        soundAndScore: "Diegetic static frequencies paired with low sub-bass drone.",
        editingAndPacing: "Continuous slow pan building uninterrupted tension.",
        graphicsAndText: "Industrial warning typeface overlay.",
      },
      persuasionAndEmotion: {
        emotionalArc: "Curiosity -> Claustrophobia -> Sudden Shock.",
        targetPersona: "Genre festival programmers and independent horror cinephiles.",
        callToAction: "Directs audience to full festival premiere dates.",
      },
      criticMatrix: {
        clarity: 8.5,
        toneConsistency: 9.2,
        visualOriginality: 8.8,
        narrativeTension: 9.0,
      },
      limitations: "Analysis based on 30-second teaser sample.",
    };

    vi.spyOn(genaiClient, "getGoogleGenAIClient").mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify(mockCriticOutput),
        }),
      },
    } as any);

    const critic = await analyzeTrailerVideo(
      "proj-signal-in-the-pines",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );

    expect(critic).toBeDefined();
    expect(critic.projectId).toBe("proj-signal-in-the-pines");
    expect(critic.timestampedBeats.length).toBe(2);
    expect(critic.timestampedBeats[0].label).toBe("Radio Static Entry");
    expect(critic.criticMatrix.clarity).toBe(8.5);
    expect(critic.craftAnalysis.cinematography).toContain("Chiaroscuro");

    const parsed = LLMTrailerCriticSchema.safeParse(critic);
    expect(parsed.success).toBe(true);
  });
});
