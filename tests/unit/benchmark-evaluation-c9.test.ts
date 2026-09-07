import { describe, expect, it } from "vitest";
import {
  loadFrozenBenchmarkDataset,
  evaluateCandidate,
  evaluateBenchmarkSuite,
  type EvaluatedCandidate,
  type BenchmarkCase,
} from "@/lib/evaluation/benchmark-evaluator";
import { FROZEN_BENCHMARK_CANDIDATES } from "@/lib/evaluation/benchmark-candidates";

describe("Package C9: Benchmark Evaluation Engine", () => {
  const dataset = loadFrozenBenchmarkDataset();

  it("loads 16 frozen benchmark cases with diverse categories", () => {
    expect(dataset.totalCases).toBe(16);
    expect(dataset.cases).toHaveLength(16);
    expect(dataset.asOfDate).toBe("2026-09-01");

    const categories = new Set(dataset.cases.map((c) => c.category));
    expect(categories.has("animation")).toBe(true);
    expect(categories.has("documentary")).toBe(true);
    expect(categories.has("ambiguous_title")).toBe(true);
    expect(categories.has("sparse_sources")).toBe(true);
    expect(categories.has("conflicting_reports")).toBe(true);
    expect(categories.has("crowdfunding")).toBe(true);
  });

  it("evaluates all 16 frozen benchmark candidates with passing critical gates", () => {
    const suiteResult = evaluateBenchmarkSuite(
      dataset.cases,
      FROZEN_BENCHMARK_CANDIDATES
    );

    expect(suiteResult.totalCases).toBe(16);
    expect(suiteResult.caseResults).toHaveLength(16);

    // 1. Identity Accuracy: 16/16 (100%)
    expect(suiteResult.identityAccuracy.correct).toBe(16);
    expect(suiteResult.identityAccuracy.total).toBe(16);
    expect(suiteResult.identityAccuracy.rate).toBe(1.0);

    // 2. Claim Precision: 100% of inspected claims are supported
    expect(suiteResult.claimPrecision.totalClaimsInspected).toBeGreaterThanOrEqual(35);
    expect(suiteResult.claimPrecision.supportedClaims).toBe(
      suiteResult.claimPrecision.totalClaimsInspected
    );
    expect(suiteResult.claimPrecision.rate).toBe(1.0);

    // 3. Fact Retention: >= 90% of verified facts retained
    expect(suiteResult.factRetention.expectedFacts).toBeGreaterThanOrEqual(35);
    expect(suiteResult.factRetention.rate).toBeGreaterThanOrEqual(0.9);

    // 4. Conflict & Negation Detection: all cases with conflicts correctly handled
    expect(suiteResult.conflictDetection.totalWithConflicts).toBeGreaterThanOrEqual(7);
    expect(suiteResult.conflictDetection.correctlyHandled).toBe(
      suiteResult.conflictDetection.totalWithConflicts
    );
    expect(suiteResult.conflictDetection.rate).toBe(1.0);

    // 5. Wrong-Project Sources: 0 wrong-project sources cited
    expect(suiteResult.wrongProjectSourceRate.wrongProjectSources).toBe(0);
    expect(suiteResult.wrongProjectSourceRate.rate).toBe(0);

    // 6. Critical Named Regressions Passed
    expect(suiteResult.criticalRegressionsPassed).toBe(true);

    // 7. Telemetry is tracked
    expect(suiteResult.telemetry.totalRequests).toBeGreaterThan(0);
    expect(suiteResult.telemetry.avgElapsedMs).toBeGreaterThan(0);
  });

  describe("Adversarial Defect & Hallucination Gatekeeper Checks", () => {
    it("fails when a candidate hallucinates near-future Brooklyn for Junichiro Jackson", () => {
      const junichiroCase = dataset.cases.find((c) => c.id === "case-junichiro")!;
      const hallucinatedCandidate: EvaluatedCandidate = {
        caseId: "case-junichiro",
        resolvedTitle: "Junichiro Jackson",
        resolvedCreators: ["Chaz Bottoms"],
        factualClaims: [
          {
            claimText: "Set in a near-future Brooklyn cyber-dystopia.",
            isSupported: false,
          },
        ],
        identifiedUnknowns: [],
        handledConflicts: [
          {
            targetLoreOrRumor: "Setting is near-future Brooklyn",
            action: "falsely_accepted",
            explanation: "Accepted Brooklyn setting.",
          },
        ],
        citedSources: [
          {
            url: "https://variety.com/junichiro",
            isRelevant: true,
            isWrongProject: false,
          },
        ],
      };

      const result = evaluateCandidate(junichiroCase, hallucinatedCandidate);
      expect(result.passed).toBe(false);
      expect(result.conflictsProperlyHandled).toBe(false);
      expect(result.falselyAcceptedConflictsCount).toBe(1);
      expect(result.claimPrecision).toBe(0);
    });

    it("fails when a candidate accepts fabricated bicycle collective lore for CYCLE", () => {
      const cycleCase = dataset.cases.find((c) => c.id === "case-cycle")!;
      const loreCandidate: EvaluatedCandidate = {
        caseId: "case-cycle",
        resolvedTitle: "CYCLE",
        resolvedCreators: ["Laura Dyan Kezman"],
        factualClaims: [
          {
            claimText: "Youth bicycle collective rebuilding discarded bikes.",
            isSupported: false,
          },
        ],
        identifiedUnknowns: [],
        handledConflicts: [
          {
            targetLoreOrRumor: "Youth bicycle collective rebuilding discarded bikes",
            action: "falsely_accepted",
            explanation: "Treated bicycle collective as true subject.",
          },
        ],
        citedSources: [
          {
            url: "https://wuwm.com/cycle",
            isRelevant: true,
            isWrongProject: false,
          },
        ],
      };

      const result = evaluateCandidate(cycleCase, loreCandidate);
      expect(result.passed).toBe(false);
      expect(result.conflictsProperlyHandled).toBe(false);
      expect(result.falselyAcceptedConflictsCount).toBe(1);
    });

    it("fails when a candidate conflates stop-motion The Bear with FX on Hulu", () => {
      const bearCase = dataset.cases.find((c) => c.id === "case-ambiguous-bear")!;
      const conflatedCandidate: EvaluatedCandidate = {
        caseId: "case-ambiguous-bear",
        resolvedTitle: "The Bear",
        resolvedCreators: ["Jeremy Allen White", "Christopher Storer"],
        factualClaims: [
          {
            claimText: "Emmy-winning culinary drama series on FX and Hulu.",
            isSupported: false,
          },
        ],
        identifiedUnknowns: [],
        handledConflicts: [
          {
            targetLoreOrRumor: "FX / Hulu television series starring Jeremy Allen White",
            action: "falsely_accepted",
            explanation: "Conflated short film with FX TV series.",
          },
        ],
        citedSources: [
          {
            url: "https://fxnetworks.com/the-bear",
            isRelevant: false,
            isWrongProject: true,
          },
        ],
      };

      const result = evaluateCandidate(bearCase, conflatedCandidate);
      expect(result.passed).toBe(false);
      expect(result.identityMatched).toBe(false);
      expect(result.wrongProjectSourcesCount).toBe(1);
      expect(result.conflictsProperlyHandled).toBe(false);
    });

    it("fails when a candidate accepts fan nominator claim of James Cameron attachment", () => {
      const horizonCase = dataset.cases.find((c) => c.id === "case-nominator-exaggeration")!;
      const exaggeratedCandidate: EvaluatedCandidate = {
        caseId: "case-nominator-exaggeration",
        resolvedTitle: "The Last Horizon",
        resolvedCreators: ["Tarek Mansour", "James Cameron"],
        factualClaims: [
          {
            claimText: "James Cameron is attached as executive producer.",
            isSupported: false,
          },
        ],
        identifiedUnknowns: [],
        handledConflicts: [
          {
            targetLoreOrRumor: "James Cameron is executive producer",
            action: "falsely_accepted",
            explanation: "Accepted fan claim without verification.",
          },
        ],
        citedSources: [
          {
            url: "https://tarekmansour.vfx/the-last-horizon",
            isRelevant: true,
            isWrongProject: false,
          },
        ],
      };

      const result = evaluateCandidate(horizonCase, exaggeratedCandidate);
      expect(result.passed).toBe(false);
      expect(result.conflictsProperlyHandled).toBe(false);
      expect(result.falselyAcceptedConflictsCount).toBe(1);
    });
  });
});
