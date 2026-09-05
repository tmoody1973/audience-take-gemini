import { z } from "zod";

export const InputProvenanceSchema = z.enum([
  "reported",
  "sourced_benchmark",
  "user_assumption",
]);

export const CostCaseTypeSchema = z.enum(["low", "base", "high"]);

export const LineItemTypeSchema = z.enum(["fixed", "quantity_rate", "package"]);

export const LineItemCategorySchema = z.enum([
  "above_the_line",
  "setup_development",
  "production_workload",
  "post_finishing",
  "delivery",
  "other",
]);

export const RateUnitSchema = z.enum([
  "fixed",
  "per_minute",
  "per_day",
  "per_week",
  "per_hour",
  "per_shot",
  "per_item",
]);

export const CurrencySchema = z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]);

export const CoverageStateSchema = z.enum(["complete", "partial", "insufficient"]);

export const ProductionTechniqueSchema = z.enum([
  "2d_animation",
  "live_action",
  "documentary",
  "3d_animation",
  "stop_motion",
  "hybrid_unsupported",
]);

export const TargetFormatSchema = z.enum([
  "proof_of_concept",
  "pilot",
  "series",
  "feature",
  "short",
]);

export const SourceReferenceSchema = z.object({
  sourceId: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  title: z.string().optional(),
  passage: z.string().optional(),
  publisher: z.string().optional(),
  effectiveDate: z.string().optional(),
  retrievedAt: z.string().optional(),
  geography: z.string().optional(),
  currency: CurrencySchema.optional(),
});

export const CaseValuesSchema = z.object({
  low: z.number().nonnegative(),
  base: z.number().nonnegative(),
  high: z.number().nonnegative(),
});

export const LineItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  category: LineItemCategorySchema,
  type: LineItemTypeSchema,
  unit: RateUnitSchema,
  quantity: CaseValuesSchema,
  unitRate: CaseValuesSchema,
  fixedCost: CaseValuesSchema,
  provenance: InputProvenanceSchema,
  sourceRef: SourceReferenceSchema.optional(),
  packageInclusions: z.array(z.string()).optional(),
  isExcluded: z.boolean().optional(),
  exclusionReason: z.string().optional(),
  notes: z.string().optional(),
});

export const AllowanceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  ratePercent: z.number().min(0).max(100),
  eligibleBaseCategories: z.union([
    z.array(LineItemCategorySchema),
    z.literal("all_direct"),
  ]),
  provenance: InputProvenanceSchema,
  sourceRef: SourceReferenceSchema.optional(),
  rationale: z.string().min(1),
});

export const ScenarioInputSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  provenance: InputProvenanceSchema,
  sourceId: z.string().optional(),
  userOverridden: z.boolean().optional(),
  originalValue: z.union([z.number(), z.string()]).optional(),
});

export const ScenarioOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  targetFormat: TargetFormatSchema,
  technique: ProductionTechniqueSchema,
  location: z.string().min(1).max(100),
  currency: CurrencySchema,
  priceDate: z.string().min(1),
  runtimeMinutes: z.number().positive(),
  episodeCount: z.number().int().positive(),
  sharedSetupReuseDiscountPercent: z.number().min(0).max(100).default(0),
  inputs: z.record(z.string(), ScenarioInputSchema),
  lineItems: z.array(LineItemSchema),
  allowances: z.array(AllowanceSchema),
});

export const ProductionScenarioSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  cardVersionId: z.string().min(1),
  ownerId: z.string().min(1),
  isPrivate: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number().int().nonnegative().default(1),
  options: z.array(ScenarioOptionSchema).min(1).max(3),
  activeOptionId: z.string().min(1),
  staleEvidenceNotice: z
    .object({
      isStale: z.boolean(),
      scenarioCardVersionId: z.string(),
      currentCardVersionId: z.string(),
      reason: z.string(),
    })
    .optional(),
});
