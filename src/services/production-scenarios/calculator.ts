import crypto from "crypto";
import type {
  Allowance,
  AllowanceResult,
  CalculationManifest,
  CaseResult,
  CostCaseType,
  CostDriver,
  CoverageState,
  ItemizedResult,
  LineItem,
  LineItemCategory,
  PackageConflict,
  ScenarioOption,
  SensitivityCheck,
} from "@/features/production-scenarios/types";

export const CALCULATION_ENGINE_VERSION = "1.0.0";

/**
 * Decimal-safe rounding to 2 decimal places (cents)
 */
export function roundToCents(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Display rounding helper: rounds to nearest hundred or thousand for uncertain planning totals
 */
export function roundForDisplay(amount: number): number {
  if (amount < 1000) return Math.round(amount);
  if (amount < 50000) return Math.round(amount / 100) * 100;
  return Math.round(amount / 500) * 500;
}

/**
 * Computes deterministic SHA-256 hash of calculation inputs
 */
export function computeInputHash(option: ScenarioOption): string {
  const canonical = {
    format: option.targetFormat,
    technique: option.technique,
    location: option.location,
    currency: option.currency,
    runtimeMinutes: option.runtimeMinutes,
    episodeCount: option.episodeCount,
    sharedSetupReuseDiscountPercent: option.sharedSetupReuseDiscountPercent,
    inputs: Object.entries(option.inputs || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ key: k, value: v.value })),
    lineItems: (option.lineItems || [])
      .map((item) => ({
        id: item.id,
        category: item.category,
        type: item.type,
        qty: item.quantity,
        rate: item.unitRate,
        fixed: item.fixedCost,
        isExcluded: Boolean(item.isExcluded),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    allowances: (option.allowances || [])
      .map((a) => ({
        id: a.id,
        rate: a.ratePercent,
        base: a.eligibleBaseCategories,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
}

/**
 * Detects package double counting when an inclusive package covers items also listed itemized
 */
export function detectPackageConflicts(lineItems: LineItem[]): PackageConflict[] {
  const conflicts: PackageConflict[] = [];
  const packageItems = lineItems.filter((i) => i.type === "package" && !i.isExcluded);

  for (const pkg of packageItems) {
    const coveredCategories = new Set(pkg.packageInclusions || []);
    for (const item of lineItems) {
      if (item.id === pkg.id || item.isExcluded) continue;

      // Conflict if the package explicitly names this item or covers this entire category
      const directOverlap = coveredCategories.has(item.id) || coveredCategories.has(item.category);
      if (directOverlap) {
        conflicts.push({
          packageItemId: pkg.id,
          packageLabel: pkg.label,
          overlappingItemId: item.id,
          overlappingLabel: item.label,
          warning: `Line item "${item.label}" (${item.category}) overlaps with inclusive package "${pkg.label}". Omit itemized cost to prevent double-counting.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Validates coverage across required cost categories
 */
export function assessCoverage(
  lineItems: LineItem[],
  technique: string
): {
  coverageState: CoverageState;
  coveredScopeDescription: string;
  missingCategories: LineItemCategory[];
  missingRequiredInputs: string[];
} {
  const activeItems = lineItems.filter((i) => !i.isExcluded);
  const presentCategories = new Set(activeItems.map((i) => i.category));

  const standardExpectedCategories: LineItemCategory[] = [
    "setup_development",
    "production_workload",
    "post_finishing",
  ];

  const missingCategories = standardExpectedCategories.filter(
    (c) => !presentCategories.has(c)
  );

  const missingRequiredInputs: string[] = [];

  // Check for unpriced active line items
  for (const item of activeItems) {
    if (item.type === "quantity_rate") {
      if (item.quantity.base <= 0) {
        missingRequiredInputs.push(`${item.label}: Quantity missing or zero without rationale`);
      }
      if (item.unitRate.base <= 0) {
        missingRequiredInputs.push(`${item.label}: Unit rate missing`);
      }
    } else if (item.type === "fixed" && item.fixedCost.base <= 0) {
      missingRequiredInputs.push(`${item.label}: Fixed cost missing`);
    }
  }

  let coverageState: CoverageState = "complete";
  let coveredScopeDescription = "Full direct production scope itemized";

  if (activeItems.length === 0 || missingRequiredInputs.length > 3) {
    coverageState = "insufficient";
    coveredScopeDescription = "Insufficient data to establish indicative production scenario";
  } else if (missingCategories.length > 0 || missingRequiredInputs.length > 0) {
    coverageState = "partial";
    const coveredNames = Array.from(presentCategories).join(", ");
    coveredScopeDescription = `Partial estimate covering: ${coveredNames}. (Missing: ${missingCategories.join(", ")})`;
  }

  return {
    coverageState,
    coveredScopeDescription,
    missingCategories,
    missingRequiredInputs,
  };
}

/**
 * Calculates a single cost case (low, base, or high)
 */
export function calculateCase(
  option: ScenarioOption,
  caseType: CostCaseType,
  conflicts: PackageConflict[]
): CaseResult {
  const conflictingItemIds = new Set(conflicts.map((c) => c.overlappingItemId));

  const categorySubtotals: Record<LineItemCategory, number> = {
    above_the_line: 0,
    setup_development: 0,
    production_workload: 0,
    post_finishing: 0,
    delivery: 0,
    other: 0,
  };

  const itemizedResults: ItemizedResult[] = [];
  let directCost = 0;

  const episodeCount = Math.max(1, option.episodeCount || 1);
  const reuseDiscount = Math.min(100, Math.max(0, option.sharedSetupReuseDiscountPercent || 0)) / 100;

  for (const item of option.lineItems || []) {
    if (item.isExcluded) {
      itemizedResults.push({
        lineItemId: item.id,
        label: item.label,
        category: item.category,
        quantity: 0,
        unitRate: 0,
        subtotal: 0,
        isPackage: item.type === "package",
        isExcluded: true,
        provenance: item.provenance,
        sourceRef: item.sourceRef,
      });
      continue;
    }

    // If item is in conflict with an inclusive package, suppress it from direct cost to prevent double-counting
    if (conflictingItemIds.has(item.id)) {
      itemizedResults.push({
        lineItemId: item.id,
        label: item.label,
        category: item.category,
        quantity: item.quantity[caseType] || 0,
        unitRate: item.unitRate[caseType] || 0,
        subtotal: 0, // Zeroed out due to package inclusion conflict
        isPackage: false,
        isExcluded: true,
        provenance: item.provenance,
        sourceRef: item.sourceRef,
      });
      continue;
    }

    let subtotal = 0;

    if (item.type === "fixed") {
      const fixedBase = item.fixedCost[caseType] || 0;
      if (item.category === "setup_development" && episodeCount > 1) {
        // Shared setup for episode 1 + discounted reuse for remaining episodes
        const episode1Cost = fixedBase;
        const remainingEpisodesCost = fixedBase * (1 - reuseDiscount) * (episodeCount - 1);
        subtotal = roundToCents(episode1Cost + remainingEpisodesCost);
      } else {
        subtotal = roundToCents(fixedBase);
      }
    } else if (item.type === "quantity_rate") {
      const qty = item.quantity[caseType] || 0;
      const rate = item.unitRate[caseType] || 0;
      subtotal = roundToCents(qty * rate);
    } else if (item.type === "package") {
      subtotal = roundToCents(item.fixedCost[caseType] || 0);
    }

    categorySubtotals[item.category] = roundToCents(
      categorySubtotals[item.category] + subtotal
    );
    directCost = roundToCents(directCost + subtotal);

    itemizedResults.push({
      lineItemId: item.id,
      label: item.label,
      category: item.category,
      quantity: item.quantity[caseType] || 0,
      unitRate: item.unitRate[caseType] || 0,
      subtotal,
      isPackage: item.type === "package",
      isExcluded: false,
      provenance: item.provenance,
      sourceRef: item.sourceRef,
    });
  }

  // Calculate percentage allowances with strictly eligible bases
  const allowanceResults: AllowanceResult[] = [];
  let totalAllowances = 0;

  for (const allowance of option.allowances || []) {
    let eligibleBase = 0;

    if (allowance.eligibleBaseCategories === "all_direct") {
      eligibleBase = directCost;
    } else if (Array.isArray(allowance.eligibleBaseCategories)) {
      for (const cat of allowance.eligibleBaseCategories) {
        eligibleBase = roundToCents(eligibleBase + (categorySubtotals[cat] || 0));
      }
    }

    const amount = roundToCents(eligibleBase * (allowance.ratePercent / 100));
    totalAllowances = roundToCents(totalAllowances + amount);

    allowanceResults.push({
      allowanceId: allowance.id,
      label: allowance.label,
      ratePercent: allowance.ratePercent,
      baseAmount: eligibleBase,
      amount,
      rationale: allowance.rationale,
    });
  }

  const totalCost = roundToCents(directCost + totalAllowances);

  return {
    caseType,
    directCost,
    categorySubtotals,
    itemizedResults,
    allowanceResults,
    totalCost,
    isPartial: directCost === 0,
  };
}

/**
 * Extracts top cost drivers ranked by contribution to direct cost
 */
export function extractTopDrivers(baseCase: CaseResult): CostDriver[] {
  const directTotal = Math.max(1, baseCase.directCost);
  const activeItems = baseCase.itemizedResults.filter((i) => !i.isExcluded && i.subtotal > 0);

  return activeItems
    .sort((a, b) => b.subtotal - a.subtotal)
    .slice(0, 3)
    .map((item) => ({
      category: item.category,
      label: item.label,
      amount: item.subtotal,
      percentageOfDirect: Math.round((item.subtotal / directTotal) * 1000) / 10,
    }));
}

/**
 * Main calculation engine: transforms a ScenarioOption into a verified CalculationManifest
 */
export function calculateScenario(
  option: ScenarioOption,
  scenarioId: string,
  cardVersionId: string
): CalculationManifest {
  const inputHash = computeInputHash(option);
  const conflicts = detectPackageConflicts(option.lineItems || []);
  const coverage = assessCoverage(option.lineItems || [], option.technique);

  const low = calculateCase(option, "low", conflicts);
  const base = calculateCase(option, "base", conflicts);
  const high = calculateCase(option, "high", conflicts);

  const topDrivers = extractTopDrivers(base);

  const warnings: string[] = [];
  if (conflicts.length > 0) {
    warnings.push(...conflicts.map((c) => c.warning));
  }
  if (coverage.coverageState === "partial") {
    warnings.push(`Partial Scope: ${coverage.coveredScopeDescription}`);
  }
  if (coverage.missingRequiredInputs.length > 0) {
    warnings.push(`Missing Inputs: ${coverage.missingRequiredInputs.join("; ")}`);
  }

  let nextDiligenceStep = "Gather confirmed production quotes for primary workload.";
  if (coverage.missingCategories.includes("production_workload")) {
    nextDiligenceStep = "Obtain animator or crew workload unit rates for key sequence execution.";
  } else if (topDrivers.length > 0) {
    nextDiligenceStep = `Diligence key cost driver: "${topDrivers[0].label}" (${topDrivers[0].percentageOfDirect}% of direct cost).`;
  }

  return {
    manifestId: `manifest-${option.id}-${inputHash.slice(0, 8)}`,
    scenarioId,
    optionId: option.id,
    cardVersionId,
    engineVersion: CALCULATION_ENGINE_VERSION,
    inputHash,
    calculatedAt: new Date().toISOString(),
    currency: option.currency,
    coverageState: coverage.coverageState,
    coveredScopeDescription: coverage.coveredScopeDescription,
    missingCategories: coverage.missingCategories,
    missingRequiredInputs: coverage.missingRequiredInputs,
    costCases: { low, base, high },
    packageConflicts: conflicts,
    topDrivers,
    nextDiligenceStep,
    warnings,
  };
}

/**
 * Runs sensitivity analysis by varying one numeric line item or allowance input
 */
export function runSensitivityAnalysis(
  option: ScenarioOption,
  scenarioId: string,
  cardVersionId: string,
  targetLineItemId: string,
  testQuantityFactor: number // e.g. 1.25 for +25%
): SensitivityCheck | null {
  const baseManifest = calculateScenario(option, scenarioId, cardVersionId);
  const baseTotal = baseManifest.costCases.base.totalCost;

  const targetItem = option.lineItems.find((i) => i.id === targetLineItemId);
  if (!targetItem) return null;

  // Clone option and modify single line item quantity
  const clonedOption: ScenarioOption = JSON.parse(JSON.stringify(option));
  const clonedItem = clonedOption.lineItems.find((i) => i.id === targetLineItemId)!;

  const baseQty = clonedItem.quantity.base;
  const testedQty = roundToCents(baseQty * testQuantityFactor);
  clonedItem.quantity.base = testedQty;

  const testedManifest = calculateScenario(clonedOption, scenarioId, cardVersionId);
  const testedTotal = testedManifest.costCases.base.totalCost;

  const deltaAmount = roundToCents(testedTotal - baseTotal);
  const deltaPercentage = baseTotal > 0 ? Math.round((deltaAmount / baseTotal) * 1000) / 10 : 0;

  return {
    inputKey: targetLineItemId,
    label: targetItem.label,
    baseValue: baseQty,
    testedValue: testedQty,
    baseTotal,
    testedTotal,
    deltaAmount,
    deltaPercentage,
  };
}
