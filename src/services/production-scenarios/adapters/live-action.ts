import type {
  Allowance,
  Currency,
  LineItem,
  ScenarioOption,
  TargetFormat,
} from "@/features/production-scenarios/types";

/**
 * Live Action Production Adapter
 * 
 * Quantity model: Cast & Crew Day Rates + Equipment/Location Days + Post Finishing
 * Note: Shoot days must be explicitly provided; runtime alone cannot determine shoot days.
 */
export function createLiveActionScenarioOption(params: {
  id: string;
  label: string;
  targetFormat: TargetFormat;
  runtimeMinutes: number;
  shootDays: number;
  currency: Currency;
  location?: string;
  crewTier?: "indie_micro" | "tier_1_union" | "commercial_standard";
}): ScenarioOption {
  const {
    id,
    label,
    targetFormat,
    runtimeMinutes,
    shootDays,
    currency,
    location = "US Regional / Indie",
    crewTier = "indie_micro",
  } = params;

  const dayRateFactor =
    crewTier === "tier_1_union" ? 1.8 : crewTier === "commercial_standard" ? 2.5 : 1.0;

  const lineItems: LineItem[] = [
    {
      id: "line-la-prep-wrap",
      label: "Pre-Production, Location Scouting & Rehearsal",
      category: "setup_development",
      type: "fixed",
      unit: "fixed",
      quantity: { low: 1, base: 1, high: 1 },
      unitRate: { low: 0, base: 0, high: 0 },
      fixedCost: {
        low: Math.round(5000 * dayRateFactor),
        base: Math.round(8000 * dayRateFactor),
        high: Math.round(14000 * dayRateFactor),
      },
      provenance: "user_assumption",
      notes: "Director prep, casting sessions, tech scouts, and insurance binder.",
    },
    {
      id: "line-la-crew-labor",
      label: "Principal Photography Key Crew (Camera, Sound, G&E)",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_day",
      quantity: { low: shootDays, base: shootDays, high: shootDays },
      unitRate: {
        low: Math.round(2500 * dayRateFactor),
        base: Math.round(3800 * dayRateFactor),
        high: Math.round(5500 * dayRateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "DP, Gaffer, Key Grip, Sound Mixer, and 1st AC daily labor package.",
    },
    {
      id: "line-la-cast-labor",
      label: "Principal Cast Daily Honorarium / Day Player Rates",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_day",
      quantity: { low: shootDays, base: shootDays, high: shootDays },
      unitRate: {
        low: Math.round(1200 * dayRateFactor),
        base: Math.round(2000 * dayRateFactor),
        high: Math.round(3500 * dayRateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Lead and supporting performers day rates across scheduled shooting days.",
    },
    {
      id: "line-la-equipment-rental",
      label: "Camera, Grip & Lighting Package Rental",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_day",
      quantity: { low: shootDays, base: shootDays, high: shootDays },
      unitRate: {
        low: Math.round(900 * dayRateFactor),
        base: Math.round(1500 * dayRateFactor),
        high: Math.round(2400 * dayRateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Cinema camera body, prime lenses, sound recorder, and lighting van package.",
    },
    {
      id: "line-la-locations-catering",
      label: "Locations, Permits & Production Catering",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_day",
      quantity: { low: shootDays, base: shootDays, high: shootDays },
      unitRate: {
        low: Math.round(800 * dayRateFactor),
        base: Math.round(1300 * dayRateFactor),
        high: Math.round(2000 * dayRateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Location site fees, municipal filming permits, and cast/crew meal allowances.",
    },
    {
      id: "line-la-post-editorial",
      label: "Picture Editing, Color Grade & Sound Mix",
      category: "post_finishing",
      type: "fixed",
      unit: "fixed",
      quantity: { low: 1, base: 1, high: 1 },
      unitRate: { low: 0, base: 0, high: 0 },
      fixedCost: {
        low: Math.round(6000 * dayRateFactor),
        base: Math.round(10000 * dayRateFactor),
        high: Math.round(16000 * dayRateFactor),
      },
      provenance: "user_assumption",
      notes: "Rough cut, fine cut, DaVinci Resolve color grading, dialogue conform, and sound mastering.",
    },
  ];

  const allowances: Allowance[] = [
    {
      id: "allowance-la-contingency",
      label: "Production Contingency Allowance",
      ratePercent: 10,
      eligibleBaseCategories: "all_direct",
      provenance: "user_assumption",
      rationale: "10% contingency reserve for weather delays, overtime, and pickup shots.",
    },
  ];

  return {
    id,
    label,
    targetFormat,
    technique: "live_action",
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
      shootDays: {
        key: "shootDays",
        label: "Scheduled Shoot Days",
        value: shootDays,
        unit: "days",
        provenance: "user_assumption",
      },
      crewTier: {
        key: "crewTier",
        label: "Crew Tier",
        value: crewTier,
        provenance: "user_assumption",
      },
    },
    lineItems,
    allowances,
  };
}
