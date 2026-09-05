import { describe, it, expect } from "vitest";
import {
  calculateScenario,
  calculateCase,
  detectPackageConflicts,
  assessCoverage,
  computeInputHash,
  runSensitivityAnalysis,
  roundToCents,
  CALCULATION_ENGINE_VERSION,
} from "@/services/production-scenarios/calculator";
import type {
  Allowance,
  LineItem,
  ScenarioOption,
} from "@/features/production-scenarios/types";
import { create2DAnimationScenarioOption } from "@/services/production-scenarios/adapters/animation-2d";
import { createLiveActionScenarioOption } from "@/services/production-scenarios/adapters/live-action";
import { createDocumentaryScenarioOption } from "@/services/production-scenarios/adapters/documentary";

describe("Production Scenarios Calculator Engine", () => {
  /**
   * SECTION 10 MANDATORY ARITHMETIC FIXTURE:
   * "fixed setup 10,000; workload 2 units at 5,000; separately excluded finishing 3,000;
   * contingency explicitly set to 10% of those three costs. Expected total 25,300.
   * Changing workload to 4 units gives 36,300, with setup unchanged."
   */
  it("calculates exact Section 10 mandatory arithmetic fixture", () => {
    const fixtureOption: ScenarioOption = {
      id: "opt-test-fixture",
      label: "Test Arithmetic Fixture",
      targetFormat: "proof_of_concept",
      technique: "2d_animation",
      location: "Test Location",
      currency: "USD",
      priceDate: "2026-08",
      runtimeMinutes: 2,
      episodeCount: 1,
      sharedSetupReuseDiscountPercent: 0,
      inputs: {},
      lineItems: [
        {
          id: "item-setup",
          label: "Fixed Setup",
          category: "setup_development",
          type: "fixed",
          unit: "fixed",
          quantity: { low: 1, base: 1, high: 1 },
          unitRate: { low: 0, base: 0, high: 0 },
          fixedCost: { low: 10000, base: 10000, high: 10000 },
          provenance: "user_assumption",
        },
        {
          id: "item-workload",
          label: "Workload Units",
          category: "production_workload",
          type: "quantity_rate",
          unit: "per_minute",
          quantity: { low: 2, base: 2, high: 2 },
          unitRate: { low: 5000, base: 5000, high: 5000 },
          fixedCost: { low: 0, base: 0, high: 0 },
          provenance: "user_assumption",
        },
        {
          id: "item-finishing",
          label: "Separately Excluded Finishing",
          category: "post_finishing",
          type: "fixed",
          unit: "fixed",
          quantity: { low: 1, base: 1, high: 1 },
          unitRate: { low: 0, base: 0, high: 0 },
          fixedCost: { low: 3000, base: 3000, high: 3000 },
          provenance: "user_assumption",
        },
      ],
      allowances: [
        {
          id: "allowance-contingency",
          label: "Contingency Allowance (10%)",
          ratePercent: 10,
          eligibleBaseCategories: "all_direct",
          provenance: "user_assumption",
          rationale: "10% on direct costs (setup 10k + workload 10k + finishing 3k = 23k)",
        },
      ],
    };

    // Case 1: Workload 2 units -> Expected 25,300
    const manifest2Units = calculateScenario(fixtureOption, "scen-1", "card-v1");
    const baseResult2 = manifest2Units.costCases.base;

    expect(baseResult2.categorySubtotals.setup_development).toBe(10000);
    expect(baseResult2.categorySubtotals.production_workload).toBe(10000);
    expect(baseResult2.categorySubtotals.post_finishing).toBe(3000);
    expect(baseResult2.directCost).toBe(23000);
    expect(baseResult2.allowanceResults[0].amount).toBe(2300);
    expect(baseResult2.totalCost).toBe(25300);

    // Case 2: Workload changed to 4 units -> Expected 36,300 (setup unchanged at 10k)
    const fixtureOption4Units: ScenarioOption = JSON.parse(JSON.stringify(fixtureOption));
    fixtureOption4Units.lineItems[1].quantity = { low: 4, base: 4, high: 4 };

    const manifest4Units = calculateScenario(fixtureOption4Units, "scen-1", "card-v1");
    const baseResult4 = manifest4Units.costCases.base;

    expect(baseResult4.categorySubtotals.setup_development).toBe(10000);
    expect(baseResult4.categorySubtotals.production_workload).toBe(20000);
    expect(baseResult4.categorySubtotals.post_finishing).toBe(3000);
    expect(baseResult4.directCost).toBe(33000);
    expect(baseResult4.allowanceResults[0].amount).toBe(3300);
    expect(baseResult4.totalCost).toBe(36300);
  });

  it("detects package conflict and prevents package double counting", () => {
    const lineItems: LineItem[] = [
      {
        id: "pkg-studio",
        label: "All-Inclusive Animation Studio Package",
        category: "production_workload",
        type: "package",
        unit: "fixed",
        quantity: { low: 1, base: 1, high: 1 },
        unitRate: { low: 0, base: 0, high: 0 },
        fixedCost: { low: 40000, base: 40000, high: 40000 },
        provenance: "sourced_benchmark",
        packageInclusions: ["production_workload", "post_finishing"],
      },
      {
        id: "item-workload-duplicate",
        label: "Itemized Keyframe Animation",
        category: "production_workload",
        type: "quantity_rate",
        unit: "per_minute",
        quantity: { low: 2, base: 2, high: 2 },
        unitRate: { low: 5000, base: 5000, high: 5000 },
        fixedCost: { low: 0, base: 0, high: 0 },
        provenance: "user_assumption",
      },
    ];

    const conflicts = detectPackageConflicts(lineItems);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].overlappingItemId).toBe("item-workload-duplicate");
    expect(conflicts[0].warning).toContain("overlaps with inclusive package");

    const option: ScenarioOption = {
      id: "opt-pkg-test",
      label: "Package Test",
      targetFormat: "pilot",
      technique: "2d_animation",
      location: "US",
      currency: "USD",
      priceDate: "2026-08",
      runtimeMinutes: 2,
      episodeCount: 1,
      sharedSetupReuseDiscountPercent: 0,
      inputs: {},
      lineItems,
      allowances: [],
    };

    const manifest = calculateScenario(option, "scen-pkg", "card-v1");
    // Duplicate workload item must be suppressed from direct cost
    expect(manifest.costCases.base.directCost).toBe(40000);
    expect(manifest.packageConflicts.length).toBe(1);
  });

  it("handles episodic setup reuse discount accurately", () => {
    const optionSeries: ScenarioOption = {
      id: "opt-series-test",
      label: "10-Episode Series with 40% Setup Reuse",
      targetFormat: "series",
      technique: "2d_animation",
      location: "US",
      currency: "USD",
      priceDate: "2026-08",
      runtimeMinutes: 10,
      episodeCount: 10,
      sharedSetupReuseDiscountPercent: 40, // 40% discount for repeat episodes
      inputs: {},
      lineItems: [
        {
          id: "item-setup",
          label: "Character Design Bible",
          category: "setup_development",
          type: "fixed",
          unit: "fixed",
          quantity: { low: 1, base: 1, high: 1 },
          unitRate: { low: 0, base: 0, high: 0 },
          fixedCost: { low: 10000, base: 10000, high: 10000 },
          provenance: "user_assumption",
        },
      ],
      allowances: [],
    };

    const manifest = calculateScenario(optionSeries, "scen-series", "card-v1");
    // Episode 1: 10,000. Episodes 2-10 (9 episodes): 10,000 * (1 - 0.40) * 9 = 54,000.
    // Total setup: 10,000 + 54,000 = 64,000.
    expect(manifest.costCases.base.directCost).toBe(64000);
  });

  it("handles missing inputs truthfully as partial/insufficient coverage", () => {
    const emptyOption: ScenarioOption = {
      id: "opt-empty",
      label: "Empty Scope",
      targetFormat: "proof_of_concept",
      technique: "2d_animation",
      location: "US",
      currency: "USD",
      priceDate: "2026-08",
      runtimeMinutes: 2,
      episodeCount: 1,
      sharedSetupReuseDiscountPercent: 0,
      inputs: {},
      lineItems: [],
      allowances: [],
    };

    const manifest = calculateScenario(emptyOption, "scen-empty", "card-v1");
    expect(manifest.coverageState).toBe("insufficient");
    expect(manifest.costCases.base.totalCost).toBe(0);
    expect(manifest.costCases.base.isPartial).toBe(true);
  });

  it("computes deterministic hash where identical inputs produce identical hash and manifest", () => {
    const optA = create2DAnimationScenarioOption({
      id: "opt-2d",
      label: "2D Proof of Concept",
      targetFormat: "proof_of_concept",
      runtimeMinutes: 2,
      episodeCount: 1,
      currency: "USD",
    });

    const optB = create2DAnimationScenarioOption({
      id: "opt-2d",
      label: "2D Proof of Concept",
      targetFormat: "proof_of_concept",
      runtimeMinutes: 2,
      episodeCount: 1,
      currency: "USD",
    });

    const hashA = computeInputHash(optA);
    const hashB = computeInputHash(optB);
    expect(hashA).toBe(hashB);

    const manifestA = calculateScenario(optA, "s1", "v1");
    const manifestB = calculateScenario(optB, "s1", "v1");
    expect(manifestA.inputHash).toBe(manifestB.inputHash);
    expect(manifestA.costCases.base.totalCost).toBe(manifestB.costCases.base.totalCost);
  });

  it("executes sensitivity analysis for single variable factor", () => {
    const opt = create2DAnimationScenarioOption({
      id: "opt-sens",
      label: "Sensitivity Test",
      targetFormat: "proof_of_concept",
      runtimeMinutes: 2,
      episodeCount: 1,
      currency: "USD",
    });

    // Test +20% workload
    const sensitivity = runSensitivityAnalysis(
      opt,
      "s1",
      "v1",
      "line-2d-animation-workload",
      1.2
    );

    expect(sensitivity).not.toBeNull();
    expect(sensitivity?.testedTotal).toBeGreaterThan(sensitivity!.baseTotal);
    expect(sensitivity?.deltaPercentage).toBeGreaterThan(0);
  });

  it("supports live action adapter requiring explicit shoot days", () => {
    const laOpt = createLiveActionScenarioOption({
      id: "opt-la",
      label: "Live Action Short",
      targetFormat: "short",
      runtimeMinutes: 10,
      shootDays: 3,
      currency: "USD",
    });

    const manifest = calculateScenario(laOpt, "s-la", "v1");
    expect(manifest.coverageState).toBe("complete");
    expect(manifest.costCases.base.totalCost).toBeGreaterThan(15000);
    expect(manifest.costCases.base.categorySubtotals.production_workload).toBeGreaterThan(0);
  });

  it("supports documentary adapter with explicit edit weeks and archival minutes", () => {
    const docOpt = createDocumentaryScenarioOption({
      id: "opt-doc",
      label: "Doc Featurette",
      targetFormat: "short",
      runtimeMinutes: 15,
      fieldShootDays: 5,
      editWeeks: 4,
      archivalMinutes: 3,
      currency: "USD",
    });

    const manifest = calculateScenario(docOpt, "s-doc", "v1");
    expect(manifest.coverageState).toBe("complete");
    expect(manifest.costCases.base.categorySubtotals.post_finishing).toBeGreaterThan(0);
  });
});
