import { describe, it, expect, vi } from "vitest";
import { generateMultiSpeakerAudio } from "./gemini-tts-client";
import type { ScoutBriefTranscript } from "@/features/scout-brief/types";
import * as genaiClientModule from "@/lib/google/genai-client";

describe("Google GenAI Speech Generation Client", () => {
  const sampleTranscript: ScoutBriefTranscript = {
    variant: "discover",
    segments: [
      { order: 1, section: "hook", speaker: "Scout", text: "Project Alpha is a vibrant indie animation.", claimIds: [], sourceIds: [] },
      { order: 2, section: "project", speaker: "Analyst", text: "Crafted with hand-drawn techniques.", claimIds: [], sourceIds: [] },
    ],
    limitations: [],
    disclosure: "AI-generated Scout Brief.",
  };

  it("returns deterministic audio result in test environment", async () => {
    const result = await generateMultiSpeakerAudio(sampleTranscript);
    expect(result).toBeDefined();
    expect(result.sampleRate).toBe(24000);
    expect(result.durationSeconds).toBeGreaterThanOrEqual(30);
    expect(result.base64Pcm.length).toBeGreaterThan(100);
  });

  it("calls Google GenAI with AUDIO modality and Kore/Puck voiceConfig when client is provided", async () => {
    const generateContentMock = vi.fn().mockImplementation(async () => {
      const dummyPcm = Buffer.alloc(24000, 10); // 500ms at 24kHz 16-bit mono
      return {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/pcm",
                    data: dummyPcm.toString("base64"),
                  },
                },
              ],
            },
          },
        ],
      };
    });

    const mockAi = {
      models: {
        generateContent: generateContentMock,
      },
    };

    vi.spyOn(genaiClientModule, "getGoogleGenAIClient").mockReturnValue(mockAi as any);

    const origEnv = process.env.NODE_ENV;
    const origVitest = process.env.VITEST;
    try {
      (process.env as any).NODE_ENV = "development";
      delete process.env.VITEST;

      const result = await generateMultiSpeakerAudio(sampleTranscript);
      expect(result).toBeDefined();
      expect(generateContentMock).toHaveBeenCalledTimes(2);

      const call1 = generateContentMock.mock.calls[0][0];
      expect(call1.config.responseModalities).toContain("AUDIO");
      expect(call1.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Kore");

      const call2 = generateContentMock.mock.calls[1][0];
      expect(call2.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Puck");
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origVitest) process.env.VITEST = origVitest;
      vi.restoreAllMocks();
    }
  });

  it("fails truthfully in production when GenAI client is missing (never serves synthetic tone)", async () => {
    vi.spyOn(genaiClientModule, "getGoogleGenAIClient").mockReturnValue(null);

    const origEnv = process.env.NODE_ENV;
    const origVitest = process.env.VITEST;
    try {
      (process.env as any).NODE_ENV = "production";
      delete process.env.VITEST;

      await expect(generateMultiSpeakerAudio(sampleTranscript)).rejects.toThrow(
        /Gemini TTS speech generation unavailable/
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origVitest) process.env.VITEST = origVitest;
      vi.restoreAllMocks();
    }
  });
});
