import { describe, it, expect } from "vitest";
import { LLMTrailerCriticSchema } from "@/domain/schemas";
import { analyzeTrailerVideo } from "@/critic/trailer-critic-engine";

describe("Trailer Critic Engine", () => {
  it("validates and parses complete multimodal critic breakdown", async () => {
    const critic = await analyzeTrailerVideo(
      "proj-signal-in-the-pines",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );

    expect(critic).toBeDefined();
    expect(critic.projectId).toBe("proj-signal-in-the-pines");
    expect(critic.timestampedBeats.length).toBeGreaterThanOrEqual(2);
    expect(critic.criticMatrix.clarity).toBeGreaterThan(0);
    expect(critic.criticMatrix.toneConsistency).toBeGreaterThan(0);
    expect(critic.craftAnalysis.cinematography).toBeDefined();
    expect(critic.craftAnalysis.soundAndScore).toBeDefined();
    expect(critic.limitations).toBeDefined();
    expect(critic.limitations.length).toBeGreaterThan(0);
  });
});
