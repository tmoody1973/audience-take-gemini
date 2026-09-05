import { describe, it, expect, vi, beforeEach } from "vitest";
import { BenchmarkService } from "@/services/production-scenarios/benchmark-service";
import {
  createDeterministicExplanation,
  validateExplanationNumbers,
} from "@/services/production-scenarios/gemini-explainer";
import { calculateScenario } from "@/services/production-scenarios/calculator";
import { create2DAnimationScenarioOption } from "@/services/production-scenarios/adapters/animation-2d";

describe("Benchmark Service & Gemini Explainer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searches and maps benchmark candidates without automatic verification", async () => {
    const service = new BenchmarkService("test-key");

    // Mock search method
    vi.spyOn((service as any).parallelClient, "search").mockResolvedValue({
      search_id: "search-123",
      results: [
        {
          url: "https://animationmagazine.net/indie-rates-2026",
          title: "2026 Indie 2D Animation Rates & Budget Guidelines",
          publish_date: "2026-06-15",
          excerpts: ["Indie 2D animation workload typically ranges from $2,500 to $4,500 per minute for keyframe production."],
        },
      ],
    });

    const snapshots = await service.searchBenchmarks({
      technique: "2d_animation",
      targetFormat: "pilot",
      missingCategory: "production_workload",
      geography: "US",
    });

    expect(snapshots).toHaveLength(1);
    const snap = snapshots[0];
    expect(snap.category).toBe("production_workload");
    expect(snap.status).toBe("candidate");
    expect(snap.publisher).toBe("animationmagazine.net");
    expect(snap.passage).toContain("ranges from $2,500 to $4,500 per minute");
    expect(snap.applicabilityAssessment).toContain("Requires professional review");
  });

  it("flags stale benchmark evidence when card version advances", () => {
    const service = new BenchmarkService();
    const mockSnap = {
      id: "bm-1",
      category: "production_workload" as const,
      technique: "2d_animation" as const,
      label: "Test",
      sourceUrl: "https://example.com",
      passage: "Example",
      publisher: "example.com",
      effectiveDate: "2026-08-01",
      retrievedAt: "2026-08-01",
      geography: "US",
      currency: "USD" as const,
      rateUnit: "fixed" as const,
      indicatedRate: { low: 0, base: 0, high: 0 },
      inclusions: [],
      exclusions: [],
      applicabilityAssessment: "None",
      status: "candidate" as const,
    };

    // Stale check
    const staleResult = service.checkStaleSnapshot(mockSnap, "card-v2", "card-v1");
    expect(staleResult.isStale).toBe(true);
    expect(staleResult.reason).toContain("evidence version advanced from card-v1 to card-v2");

    // Not stale check
    const freshResult = service.checkStaleSnapshot(mockSnap, "card-v1", "card-v1");
    expect(freshResult.isStale).toBe(false);
  });

  it("creates deterministic explanation strictly bound to manifest numbers", () => {
    const option = create2DAnimationScenarioOption({
      id: "opt-explain",
      label: "2D Proof of Concept",
      targetFormat: "proof_of_concept",
      runtimeMinutes: 2,
      episodeCount: 1,
      currency: "USD",
    });

    const manifest = calculateScenario(option, "scen-1", "card-v1");
    const explanation = createDeterministicExplanation(manifest, option);

    expect(explanation).toContain(`$${manifest.costCases.low.totalCost.toLocaleString()}`);
    expect(explanation).toContain(`$${manifest.costCases.base.totalCost.toLocaleString()}`);
    expect(explanation).toContain(`$${manifest.costCases.high.totalCost.toLocaleString()}`);
    expect(explanation).toContain("Recommended diligence action:");
  });

  it("validates that all monetary figures in explanation match the manifest", () => {
    const option = create2DAnimationScenarioOption({
      id: "opt-explain",
      label: "2D Proof of Concept",
      targetFormat: "proof_of_concept",
      runtimeMinutes: 2,
      episodeCount: 1,
      currency: "USD",
    });

    const manifest = calculateScenario(option, "scen-1", "card-v1");
    const validExplanation = createDeterministicExplanation(manifest, option);

    expect(validateExplanationNumbers(validExplanation, manifest)).toBe(true);

    // Rogue explanation with hallucinated $999,999
    const hallucinatedExplanation = `${validExplanation} Additionally, we assume an unverified $999,999 marketing fee.`;
    expect(validateExplanationNumbers(hallucinatedExplanation, manifest)).toBe(false);
  });
});
