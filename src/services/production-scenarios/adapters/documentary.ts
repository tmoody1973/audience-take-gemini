import type {
  Allowance,
  Currency,
  LineItem,
  ScenarioOption,
  TargetFormat,
} from "@/features/production-scenarios/types";

/**
 * Documentary Production Adapter
 * 
 * Quantity model: Field Production Days + Edit Duration (Weeks) + Archival Licensing Units
 * Note: Short runtime does not imply a short edit; ratio of raw footage to edit time is key.
 */
export function createDocumentaryScenarioOption(params: {
  id: string;
  label: string;
  targetFormat: TargetFormat;
  runtimeMinutes: number;
  fieldShootDays: number;
  editWeeks: number;
  archivalMinutes: number;
  currency: Currency;
  location?: string;
}): ScenarioOption {
  const {
    id,
    label,
    targetFormat,
    runtimeMinutes,
    fieldShootDays,
    editWeeks,
    archivalMinutes,
    currency,
    location = "Field / Documentary",
  } = params;

  const lineItems: LineItem[] = [
    {
      id: "line-doc-research-access",
      label: "Subject Access Diligence & Research Protocol",
      category: "setup_development",
      type: "fixed",
      unit: "fixed",
      quantity: { low: 1, base: 1, high: 1 },
      unitRate: { low: 0, base: 0, high: 0 },
      fixedCost: { low: 4000, base: 7000, high: 11000 },
      provenance: "user_assumption",
      notes: "Pre-interviews, archival rights research, participant consent releases, and travel logistics.",
    },
    {
      id: "line-doc-field-crew",
      label: "Documentary Field Crew (Director/Camera & Sound)",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_day",
      quantity: { low: fieldShootDays, base: fieldShootDays, high: fieldShootDays },
      unitRate: { low: 1800, base: 2600, high: 3600 },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Lean two-person documentary field crew daily labor package.",
    },
    {
      id: "line-doc-archival-licensing",
      label: "Archival Footage & Photo Clearances",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_minute",
      quantity: { low: archivalMinutes, base: archivalMinutes, high: archivalMinutes },
      unitRate: { low: 800, base: 1500, high: 2800 },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Commercial film/broadcast/digital licensing master clearing fees per minute of archival used.",
    },
    {
      id: "line-doc-editorial-weeks",
      label: "Documentary Story Editorial & Assembly",
      category: "post_finishing",
      type: "quantity_rate",
      unit: "per_week",
      quantity: { low: editWeeks, base: editWeeks, high: editWeeks },
      unitRate: { low: 2200, base: 3200, high: 4500 },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Lead documentary editor weekly rate. Reflects high shoot-to-screen ratio assembly.",
    },
    {
      id: "line-doc-finishing-sound",
      label: "Color Conform, Dialogue Mix & E&O Legal Review",
      category: "post_finishing",
      type: "fixed",
      unit: "fixed",
      quantity: { low: 1, base: 1, high: 1 },
      unitRate: { low: 0, base: 0, high: 0 },
      fixedCost: { low: 5000, base: 8500, high: 14000 },
      provenance: "user_assumption",
      notes: "Legal fair use vetting, Errors & Omissions insurance opinion, sound re-recording mix, and color grading.",
    },
  ];

  const allowances: Allowance[] = [
    {
      id: "allowance-doc-contingency",
      label: "Documentary Contingency Allowance",
      ratePercent: 10,
      eligibleBaseCategories: "all_direct",
      provenance: "user_assumption",
      rationale: "10% reserve for unforeseen participant scheduling shifts and archival clearance surcharges.",
    },
  ];

  return {
    id,
    label,
    targetFormat,
    technique: "documentary",
    location,
    currency,
    priceDate: "2026-08",
    runtimeMinutes,
    episodeCount: 1,
    sharedSetupReuseDiscountPercent: 0,
    inputs: {
      runtimeMinutes: {
        key: "runtimeMinutes",
        label: "Finished Runtime",
        value: runtimeMinutes,
        unit: "minutes",
        provenance: "user_assumption",
      },
      fieldShootDays: {
        key: "fieldShootDays",
        label: "Field Shoot Days",
        value: fieldShootDays,
        unit: "days",
        provenance: "user_assumption",
      },
      editWeeks: {
        key: "editWeeks",
        label: "Editorial Duration",
        value: editWeeks,
        unit: "weeks",
        provenance: "user_assumption",
      },
      archivalMinutes: {
        key: "archivalMinutes",
        label: "Archival Footage Scope",
        value: archivalMinutes,
        unit: "minutes",
        provenance: "user_assumption",
      },
    },
    lineItems,
    allowances,
  };
}
