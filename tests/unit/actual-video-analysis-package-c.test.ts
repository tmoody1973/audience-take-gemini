import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  validateCriticPayload,
  analyzeAnyTrailerVideo,
} from "../../src/critic/trailer-critic-engine";

vi.mock("@/lib/google/genai-client", () => ({
  getGoogleGenAIClient: vi.fn(),
}));

import { getGoogleGenAIClient } from "@/lib/google/genai-client";

describe("Package C: Actual Gemini Video Analysis & Modality Discipline", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateCriticPayload Invariants", () => {
    it("rejects payloads that claim direct frame analysis when context is text-only", () => {
      const invalidContextPayload = {
        summary: "Based on direct frame analysis of the trailer.",
        limitations: "Analysis is limited to available context rather than direct video stream.",
        timestampedBeats: [],
        criticMatrix: {
          clarity: 8,
          toneConsistency: 7,
          visualOriginality: 8,
          narrativeTension: 7,
        },
      };
      expect(validateCriticPayload(invalidContextPayload)).toBe(false);
    });

    it("rejects payloads with timestamped beats when context is text-only", () => {
      const invalidBeatsPayload = {
        summary: "Contextual reading of storyworld themes.",
        limitations: "Analysis limited to available text context; no direct video.",
        timestampedBeats: [
          {
            timestampSeconds: 15,
            timestampFormatted: "0:15",
            label: "Opening Shot",
            description: "Establishing pan across skyline",
          },
        ],
        criticMatrix: {
          clarity: 8,
          toneConsistency: 7,
          visualOriginality: 8,
          narrativeTension: 7,
        },
      };
      expect(validateCriticPayload(invalidBeatsPayload)).toBe(false);
    });

    it("accepts valid multimodal video payload with chronological timestamped beats", () => {
      const validPayload = {
        summary: "Strong atmosphere and kinetic pacing observed in the trailer cut.",
        genreAndForm: "Animated Short",
        whyItMayConnect: "Dynamic character duel and orchestral scoring.",
        timestampedBeats: [
          {
            timestampSeconds: 0,
            timestampFormatted: "0:00",
            label: "Establishing Shot",
            description: "Ballroom chandelier descends in shadow",
          },
          {
            timestampSeconds: 12,
            timestampFormatted: "0:12",
            label: "Character Duel",
            description: "Fast-paced fencing match begins",
          },
        ],
        craftAnalysis: {
          cinematography: "High contrast chiaroscuro",
          soundAndScore: "Orchestral waltz building in tempo",
          editingAndPacing: "Accelerates toward climax",
          graphicsAndText: "Minimal stylized typography",
        },
        persuasionAndEmotion: {
          emotionalArc: "Intrigue to exhilaration",
          targetPersona: "Animation and indie cinema fans",
          callToAction: "Follow development",
        },
        criticMatrix: {
          clarity: 8,
          toneConsistency: 9,
          visualOriginality: 9,
          narrativeTension: 8,
        },
        limitations: "Direct multimodal video stream analysis based on 30fps clip sample.",
      };
      expect(validateCriticPayload(validPayload)).toBe(true);
    });
  });

  describe("Multimodal Media Attachment via @google/genai", () => {
    it("attaches fileData part to generateContent when video source is YouTube", async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          summary: "Multimodal analysis of trailer audiovisual cues.",
          genreAndForm: "Animation / Pilot",
          whyItMayConnect: "Strong character designs and distinct musical hook.",
          timestampedBeats: [
            {
              timestampSeconds: 5,
              timestampFormatted: "0:05",
              label: "Theme Introduction",
              description: "Lead character enters the ballroom",
            },
          ],
          craftAnalysis: {
            cinematography: "Dynamic angles",
            soundAndScore: "Thematic orchestration",
            editingAndPacing: "Snappy comedic timing",
            graphicsAndText: "Crisp title card",
          },
          persuasionAndEmotion: {
            emotionalArc: "Curiosity to engagement",
            targetPersona: "Indie animation fans",
            callToAction: "Follow series",
          },
          criticMatrix: {
            clarity: 8,
            toneConsistency: 8,
            visualOriginality: 9,
            narrativeTension: 7,
          },
          limitations: "Direct multimodal video sample analyzed.",
        }),
      });

      (getGoogleGenAIClient as any).mockReturnValue({
        models: {
          generateContent: mockGenerateContent,
        },
      });

      const result = await analyzeAnyTrailerVideo(
        "https://www.youtube.com/watch?v=VvqQHBjY46w",
        "The Vampair Series",
        "series"
      );

      expect(mockGenerateContent).toHaveBeenCalled();
      const firstCallArgs = mockGenerateContent.mock.calls[0][0];

      // Must have attached media part
      expect(Array.isArray(firstCallArgs.contents)).toBe(true);
      expect(firstCallArgs.contents[0]).toEqual({
        fileData: {
          fileUri: "https://www.youtube.com/watch?v=VvqQHBjY46w",
          mimeType: "video/mp4",
        },
      });

      expect(result.modality).toBe("multimodal_video");
      expect(result.timestampedBeats.length).toBe(1);
    });

    it("falls back to text context honestly when media attachment throws", async () => {
      let callCount = 0;
      const mockGenerateContent = vi.fn().mockImplementation(async (params) => {
        callCount++;
        // First call with mediaPart throws (e.g. video unavailable to Gemini)
        if (callCount === 1) {
          throw new Error("Unable to fetch video media stream");
        }
        // Second call with text context succeeds
        return {
          text: JSON.stringify({
            summary: "Contextual narrative reading of project premise.",
            genreAndForm: "Animation / Conceptual",
            whyItMayConnect: "Engaging worldbuilding",
            timestampedBeats: [],
            craftAnalysis: {
              cinematography: "Contextual estimate",
              soundAndScore: "Unavailable",
              editingAndPacing: "Unavailable",
              graphicsAndText: "Unavailable",
            },
            persuasionAndEmotion: {
              emotionalArc: "Intrigue",
              targetPersona: "Audience",
              callToAction: "Read more",
            },
            criticMatrix: {
              clarity: 7,
              toneConsistency: 7,
              visualOriginality: 7,
              narrativeTension: 6,
            },
            limitations: "Analysis grounded in verified project and trailer metadata; direct multimodal video stream was unattached or unavailable.",
          }),
        };
      });

      (getGoogleGenAIClient as any).mockReturnValue({
        models: {
          generateContent: mockGenerateContent,
        },
      });

      const result = await analyzeAnyTrailerVideo(
        "https://www.youtube.com/watch?v=privateOrRestricted",
        "Private Video Project",
        "short"
      );

      // Should have attempted multimodal first, then fallen back to text prompt
      expect(callCount).toBe(2);
      expect(result.modality).toBe("text_context_only");
      expect(result.timestampedBeats).toEqual([]);
      expect(result.limitations).toContain("direct multimodal video stream was unattached or unavailable");
    });
  });
});
