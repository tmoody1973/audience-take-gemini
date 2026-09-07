import fs from "fs";
import path from "path";

export interface BenchmarkCase {
  id: string;
  title: string;
  category: string;
  medium: string;
  expectedCreators: string[];
  verifiedFacts: string[];
  materialUnknowns: string[];
  conflictsOrNegations: string[];
  exactSources: string[];
  verifiedSetting?: string;
  disprovedSetting?: string;
  verifiedSubject?: string;
  disprovedLore?: string;
  verifiedPilotFunding?: string;
  verifiedSeriesBudget?: string;
}

export interface BenchmarkDataset {
  version: string;
  asOfDate: string;
  totalCases: number;
  description: string;
  cases: BenchmarkCase[];
}

export interface FactualClaim {
  claimText: string;
  isSupported: boolean;
  citationUrls?: string[];
}

export interface HandledConflict {
  targetLoreOrRumor: string;
  action: "disproved" | "flagged_unverified" | "negated" | "ignored" | "falsely_accepted";
  explanation: string;
}

export interface CitedSource {
  url: string;
  isRelevant: boolean;
  isWrongProject: boolean;
}

export interface EvaluatedCandidate {
  caseId: string;
  resolvedTitle: string;
  resolvedCreators: string[];
  factualClaims: FactualClaim[];
  identifiedUnknowns: string[];
  handledConflicts: HandledConflict[];
  citedSources: CitedSource[];
  telemetry?: {
    requestCount: number;
    elapsedMs: number;
    retries: number;
    costUsd?: number;
  };
}

export interface CaseEvaluationResult {
  caseId: string;
  title: string;
  identityMatched: boolean;
  supportedClaimsCount: number;
  totalClaimsInspected: number;
  claimPrecision: number;
  retainedFactsCount: number;
  expectedFactsCount: number;
  factRetentionRate: number;
  conflictsProperlyHandled: boolean;
  falselyAcceptedConflictsCount: number;
  wrongProjectSourcesCount: number;
  errors: string[];
  passed: boolean;
}

export interface BenchmarkSuiteResult {
  version: string;
  asOfDate: string;
  totalCases: number;
  identityAccuracy: {
    correct: number;
    total: number;
    rate: number;
  };
  claimPrecision: {
    supportedClaims: number;
    totalClaimsInspected: number;
    rate: number;
  };
  factRetention: {
    retainedFacts: number;
    expectedFacts: number;
    rate: number;
  };
  conflictDetection: {
    correctlyHandled: number;
    totalWithConflicts: number;
    rate: number;
  };
  wrongProjectSourceRate: {
    wrongProjectSources: number;
    totalSourcesCited: number;
    rate: number;
  };
  telemetry: {
    totalRequests: number;
    avgElapsedMs: number;
    totalRetries: number;
    estimatedCostUsd: number;
  };
  criticalRegressionsPassed: boolean;
  caseResults: CaseEvaluationResult[];
}

/**
 * Load the frozen benchmark dataset from disk
 */
export function loadFrozenBenchmarkDataset(filePath?: string): BenchmarkDataset {
  const resolvedPath =
    filePath ||
    path.resolve(process.cwd(), "contracts/evaluation/frozen-benchmark-cases.json");
  const raw = fs.readFileSync(resolvedPath, "utf-8");
  return JSON.parse(raw) as BenchmarkDataset;
}

/**
 * Evaluate a single candidate against a benchmark case
 */
export function evaluateCandidate(
  benchmarkCase: BenchmarkCase,
  candidate: EvaluatedCandidate
): CaseEvaluationResult {
  const errors: string[] = [];

  // 1. Identity Check
  const titleMatches =
    candidate.resolvedTitle.toLowerCase().trim() ===
    benchmarkCase.title.toLowerCase().trim();

  const creatorMatches = benchmarkCase.expectedCreators.some((expected) =>
    candidate.resolvedCreators.some(
      (resolved) =>
        resolved.toLowerCase().includes(expected.toLowerCase()) ||
        expected.toLowerCase().includes(resolved.toLowerCase())
    )
  );

  const identityMatched = titleMatches && creatorMatches;
  if (!titleMatches) {
    errors.push(
      `Title mismatch: expected "${benchmarkCase.title}", got "${candidate.resolvedTitle}"`
    );
  }
  if (!creatorMatches) {
    errors.push(
      `Creator mismatch: expected one of [${benchmarkCase.expectedCreators.join(", ")}], got [${candidate.resolvedCreators.join(", ")}]`
    );
  }

  // 2. Claim Precision (supported factual claims / inspected factual claims)
  const totalClaimsInspected = candidate.factualClaims.length;
  const supportedClaimsCount = candidate.factualClaims.filter(
    (c) => c.isSupported
  ).length;
  const claimPrecision =
    totalClaimsInspected > 0 ? supportedClaimsCount / totalClaimsInspected : 0;

  if (supportedClaimsCount < totalClaimsInspected) {
    const unsupported = candidate.factualClaims
      .filter((c) => !c.isSupported)
      .map((c) => c.claimText);
    errors.push(`Unsupported claims found: ${unsupported.join(" | ")}`);
  }

  // 3. Fact Retention: check how many verifiedFacts are represented in factualClaims
  let retainedFactsCount = 0;
  const expectedFactsCount = benchmarkCase.verifiedFacts.length;

  for (const verifiedFact of benchmarkCase.verifiedFacts) {
    const isRetained = candidate.factualClaims.some((claim) => {
      const factWords = verifiedFact
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const claimLower = claim.claimText.toLowerCase();
      const matchCount = factWords.filter((w) => claimLower.includes(w)).length;
      return matchCount >= Math.min(3, Math.ceil(factWords.length * 0.4));
    });
    if (isRetained) {
      retainedFactsCount++;
    }
  }

  const factRetentionRate =
    expectedFactsCount > 0 ? retainedFactsCount / expectedFactsCount : 1;

  // 4. Conflicts & Negations Handling
  const hasExpectedConflicts =
    benchmarkCase.conflictsOrNegations.length > 0 ||
    Boolean(benchmarkCase.disprovedSetting) ||
    Boolean(benchmarkCase.disprovedLore);

  let falselyAcceptedConflictsCount = 0;
  let conflictsProperlyHandled = true;

  if (hasExpectedConflicts) {
    for (const conflict of candidate.handledConflicts) {
      if (conflict.action === "falsely_accepted") {
        falselyAcceptedConflictsCount++;
      }
    }

    const hasDisprovenOrNegated = candidate.handledConflicts.some(
      (c) =>
        c.action === "disproved" ||
        c.action === "negated" ||
        c.action === "flagged_unverified"
    );

    if (falselyAcceptedConflictsCount > 0 || !hasDisprovenOrNegated) {
      conflictsProperlyHandled = false;
      errors.push(
        `Conflicts/negations not properly handled. Falsely accepted: ${falselyAcceptedConflictsCount}, Properly negated/disproved: ${hasDisprovenOrNegated}`
      );
    }
  }

  // 5. Wrong-Project Sources
  const wrongProjectSourcesCount = candidate.citedSources.filter(
    (s) => s.isWrongProject
  ).length;
  if (wrongProjectSourcesCount > 0) {
    errors.push(
      `Wrong-project sources cited: ${wrongProjectSourcesCount} sources`
    );
  }

  // Determine overall pass
  const passed =
    identityMatched &&
    claimPrecision >= 0.9 &&
    factRetentionRate >= 0.6 &&
    conflictsProperlyHandled &&
    wrongProjectSourcesCount === 0;

  return {
    caseId: benchmarkCase.id,
    title: benchmarkCase.title,
    identityMatched,
    supportedClaimsCount,
    totalClaimsInspected,
    claimPrecision,
    retainedFactsCount,
    expectedFactsCount,
    factRetentionRate,
    conflictsProperlyHandled,
    falselyAcceptedConflictsCount,
    wrongProjectSourcesCount,
    errors,
    passed,
  };
}

/**
 * Run evaluation over the complete benchmark suite
 */
export function evaluateBenchmarkSuite(
  cases: BenchmarkCase[],
  candidates: EvaluatedCandidate[]
): BenchmarkSuiteResult {
  const candidateMap = new Map<string, EvaluatedCandidate>(
    candidates.map((c) => [c.caseId, c])
  );

  const caseResults: CaseEvaluationResult[] = [];
  let totalRequests = 0;
  let totalElapsedMs = 0;
  let totalRetries = 0;
  let estimatedCostUsd = 0;

  let correctIdentities = 0;
  let supportedClaims = 0;
  let totalClaimsInspected = 0;
  let retainedFacts = 0;
  let expectedFacts = 0;
  let correctlyHandledConflicts = 0;
  let casesWithConflicts = 0;
  let wrongProjectSources = 0;
  let totalSourcesCited = 0;

  for (const bCase of cases) {
    const candidate = candidateMap.get(bCase.id);
    if (!candidate) {
      caseResults.push({
        caseId: bCase.id,
        title: bCase.title,
        identityMatched: false,
        supportedClaimsCount: 0,
        totalClaimsInspected: 0,
        claimPrecision: 0,
        retainedFactsCount: 0,
        expectedFactsCount: bCase.verifiedFacts.length,
        factRetentionRate: 0,
        conflictsProperlyHandled: false,
        falselyAcceptedConflictsCount: 0,
        wrongProjectSourcesCount: 0,
        errors: [`Missing evaluated candidate for case: ${bCase.id}`],
        passed: false,
      });
      continue;
    }

    const result = evaluateCandidate(bCase, candidate);
    caseResults.push(result);

    if (result.identityMatched) correctIdentities++;
    supportedClaims += result.supportedClaimsCount;
    totalClaimsInspected += result.totalClaimsInspected;
    retainedFacts += result.retainedFactsCount;
    expectedFacts += result.expectedFactsCount;

    const hasConflict =
      bCase.conflictsOrNegations.length > 0 ||
      Boolean(bCase.disprovedSetting) ||
      Boolean(bCase.disprovedLore);

    if (hasConflict) {
      casesWithConflicts++;
      if (result.conflictsProperlyHandled) {
        correctlyHandledConflicts++;
      }
    }

    wrongProjectSources += result.wrongProjectSourcesCount;
    totalSourcesCited += candidate.citedSources.length;

    if (candidate.telemetry) {
      totalRequests += candidate.telemetry.requestCount;
      totalElapsedMs += candidate.telemetry.elapsedMs;
      totalRetries += candidate.telemetry.retries;
      if (candidate.telemetry.costUsd) {
        estimatedCostUsd += candidate.telemetry.costUsd;
      }
    }
  }

  // Critical regressions: junichiro, cycle, vampair, ambiguous-icarus, ambiguous-bear, conflicting-rights, nominator-exaggeration
  const criticalCaseIds = [
    "case-junichiro",
    "case-cycle",
    "case-vampair",
    "case-ambiguous-icarus",
    "case-ambiguous-bear",
    "case-conflicting-rights",
    "case-nominator-exaggeration",
  ];

  const criticalRegressionsPassed = criticalCaseIds.every((id) => {
    const r = caseResults.find((res) => res.caseId === id);
    return r ? r.passed : false;
  });

  const totalCases = cases.length;

  return {
    version: "1.0.0",
    asOfDate: "2026-09-01",
    totalCases,
    identityAccuracy: {
      correct: correctIdentities,
      total: totalCases,
      rate: totalCases > 0 ? correctIdentities / totalCases : 0,
    },
    claimPrecision: {
      supportedClaims,
      totalClaimsInspected,
      rate: totalClaimsInspected > 0 ? supportedClaims / totalClaimsInspected : 0,
    },
    factRetention: {
      retainedFacts,
      expectedFacts,
      rate: expectedFacts > 0 ? retainedFacts / expectedFacts : 0,
    },
    conflictDetection: {
      correctlyHandled: correctlyHandledConflicts,
      totalWithConflicts: casesWithConflicts,
      rate: casesWithConflicts > 0 ? correctlyHandledConflicts / casesWithConflicts : 0,
    },
    wrongProjectSourceRate: {
      wrongProjectSources,
      totalSourcesCited,
      rate: totalSourcesCited > 0 ? wrongProjectSources / totalSourcesCited : 0,
    },
    telemetry: {
      totalRequests,
      avgElapsedMs: totalCases > 0 ? Math.round(totalElapsedMs / totalCases) : 0,
      totalRetries,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
    },
    criticalRegressionsPassed,
    caseResults,
  };
}
