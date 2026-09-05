/**
 * Production Scenarios Domain Contracts & Types
 * 
 * Implements deterministic, unit-aware, decimal-safe production planning
 * for film & television professionals exploring development options.
 */

export type InputProvenance = "reported" | "sourced_benchmark" | "user_assumption";

export type CostCaseType = "low" | "base" | "high";

export type LineItemType = "fixed" | "quantity_rate" | "package";

export type LineItemCategory =
  | "above_the_line"
  | "setup_development"
  | "production_workload"
  | "post_finishing"
  | "delivery"
  | "other";

export type RateUnit =
  | "fixed"
  | "per_minute"
  | "per_day"
  | "per_week"
  | "per_hour"
  | "per_shot"
  | "per_item";

export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export type CoverageState = "complete" | "partial" | "insufficient";

export type ProductionTechnique =
  | "2d_animation"
  | "live_action"
  | "documentary"
  | "3d_animation"
  | "stop_motion"
  | "hybrid_unsupported";

export type TargetFormat = "proof_of_concept" | "pilot" | "series" | "feature" | "short";

export interface SourceReference {
  sourceId?: string;
  url?: string;
  title?: string;
  passage?: string;
  publisher?: string;
  effectiveDate?: string;
  retrievedAt?: string;
  geography?: string;
  currency?: Currency;
}

export interface LineItem {
  id: string;
  label: string;
  category: LineItemCategory;
  type: LineItemType;
  unit: RateUnit;
  quantity: { low: number; base: number; high: number };
  unitRate: { low: number; base: number; high: number };
  fixedCost: { low: number; base: number; high: number };
  provenance: InputProvenance;
  sourceRef?: SourceReference;
  packageInclusions?: string[]; // Categories or item IDs covered to detect double-counting
  isExcluded?: boolean;
  exclusionReason?: string;
  notes?: string;
}

export interface Allowance {
  id: string;
  label: string;
  ratePercent: number; // e.g. 10 = 10%
  eligibleBaseCategories: LineItemCategory[] | "all_direct";
  provenance: InputProvenance;
  sourceRef?: SourceReference;
  rationale: string;
}

export interface ScenarioInput {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  provenance: InputProvenance;
  sourceId?: string;
  userOverridden?: boolean;
  originalValue?: number | string;
}

export interface ScenarioOption {
  id: string;
  label: string; // e.g. "Proof of Concept", "Pilot Episode", "10-Episode Series"
  targetFormat: TargetFormat;
  technique: ProductionTechnique;
  location: string; // e.g. "US Non-Union", "Canada Co-Production"
  currency: Currency;
  priceDate: string; // e.g. "2026-08"
  runtimeMinutes: number;
  episodeCount: number; // 1 for single/pilot/POC
  sharedSetupReuseDiscountPercent: number; // 0-100, applied to repeat episodes setup
  inputs: Record<string, ScenarioInput>;
  lineItems: LineItem[];
  allowances: Allowance[];
}

export interface ItemizedResult {
  lineItemId: string;
  label: string;
  category: LineItemCategory;
  quantity: number;
  unitRate: number;
  subtotal: number;
  isPackage: boolean;
  isExcluded: boolean;
  provenance: InputProvenance;
  sourceRef?: SourceReference;
}

export interface AllowanceResult {
  allowanceId: string;
  label: string;
  ratePercent: number;
  baseAmount: number;
  amount: number;
  rationale: string;
}

export interface CostDriver {
  category: LineItemCategory;
  label: string;
  amount: number;
  percentageOfDirect: number;
}

export interface CaseResult {
  caseType: CostCaseType;
  directCost: number;
  categorySubtotals: Record<LineItemCategory, number>;
  itemizedResults: ItemizedResult[];
  allowanceResults: AllowanceResult[];
  totalCost: number;
  isPartial: boolean;
}

export interface PackageConflict {
  packageItemId: string;
  packageLabel: string;
  overlappingItemId: string;
  overlappingLabel: string;
  warning: string;
}

export interface CalculationManifest {
  manifestId: string;
  scenarioId: string;
  optionId: string;
  cardVersionId: string;
  engineVersion: string;
  inputHash: string;
  calculatedAt: string;
  currency: Currency;
  coverageState: CoverageState;
  coveredScopeDescription: string;
  missingCategories: LineItemCategory[];
  missingRequiredInputs: string[];
  costCases: {
    low: CaseResult;
    base: CaseResult;
    high: CaseResult;
  };
  packageConflicts: PackageConflict[];
  topDrivers: CostDriver[];
  nextDiligenceStep: string;
  warnings: string[];
}

export interface SensitivityCheck {
  inputKey: string;
  label: string;
  baseValue: number;
  testedValue: number;
  baseTotal: number;
  testedTotal: number;
  deltaAmount: number;
  deltaPercentage: number;
}

export interface ProductionScenario {
  id: string;
  projectId: string;
  cardVersionId: string;
  ownerId: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  revision: number;
  options: ScenarioOption[]; // up to 3 options
  activeOptionId: string;
  latestManifest?: CalculationManifest;
  staleEvidenceNotice?: {
    isStale: boolean;
    scenarioCardVersionId: string;
    currentCardVersionId: string;
    reason: string;
  };
}

export interface CostDriverDescriptor {
  name: string;
  description: string;
  typicalWorkloadUnit: string;
  questionsToResolve: string[];
}

export interface TechniqueAdapterMetadata {
  technique: ProductionTechnique;
  label: string;
  isMonetarySupported: boolean;
  deferredReason?: string;
  requiredInputs: {
    key: string;
    label: string;
    unit: string;
    type: "number" | "select" | "text";
    options?: string[];
    description: string;
  }[];
  costDrivers: CostDriverDescriptor[];
}
