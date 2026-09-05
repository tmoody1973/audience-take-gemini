import type {
  Allowance,
  Currency,
  LineItem,
  ScenarioOption,
  TargetFormat,
} from "@/features/production-scenarios/types";

/**
 * 2D Animation Production Adapter
 * 
 * Quantity model: Fixed Setup/Design + Workload Animation (per-minute or per-shot) + Separately Excluded Finishing + Explicit Contingency
 */
export function create2DAnimationScenarioOption(params: {
  id: string;
  label: string;
  targetFormat: TargetFormat;
  runtimeMinutes: number;
  episodeCount: number;
  currency: Currency;
  complexityTier?: "standard" | "high" | "limited";
}): ScenarioOption {
  const {
    id,
    label,
    targetFormat,
    runtimeMinutes,
    episodeCount,
    currency,
    complexityTier = "standard",
  } = params;

  // Complexity rate multipliers for test/default scenario construction
  const rateFactor = complexityTier === "high" ? 1.4 : complexityTier === "limited" ? 0.7 : 1.0;

  const lineItems: LineItem[] = [
    {
      id: "line-2d-setup-design",
      label: "Character & Storyworld Design Setup",
      category: "setup_development",
      type: "fixed",
      unit: "fixed",
      quantity: { low: 1, base: 1, high: 1 },
      unitRate: { low: 0, base: 0, high: 0 },
      fixedCost: {
        low: Math.round(8000 * rateFactor),
        base: Math.round(12000 * rateFactor),
        high: Math.round(18000 * rateFactor),
      },
      provenance: "user_assumption",
      notes: "Turnarounds, color keys, background style guides, and expression sheets.",
    },
    {
      id: "line-2d-storyboard-animatic",
      label: "Storyboarding & Timed Animatic",
      category: "setup_development",
      type: "quantity_rate",
      unit: "per_minute",
      quantity: { low: runtimeMinutes, base: runtimeMinutes, high: runtimeMinutes },
      unitRate: {
        low: Math.round(400 * rateFactor),
        base: Math.round(650 * rateFactor),
        high: Math.round(900 * rateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Boarding, scratch track editorial conform, and animatic pacing lock.",
    },
    {
      id: "line-2d-animation-workload",
      label: "Keyframe & Inbetween Animation Workload",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_minute",
      quantity: {
        low: runtimeMinutes * episodeCount,
        base: runtimeMinutes * episodeCount,
        high: runtimeMinutes * episodeCount,
      },
      unitRate: {
        low: Math.round(2200 * rateFactor),
        base: Math.round(3400 * rateFactor),
        high: Math.round(5000 * rateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Primary animation production, line clean-up, and digital ink/paint.",
    },
    {
      id: "line-2d-background-paint",
      label: "Background Layout & Final Painting",
      category: "production_workload",
      type: "quantity_rate",
      unit: "per_minute",
      quantity: {
        low: runtimeMinutes * episodeCount,
        base: runtimeMinutes * episodeCount,
        high: runtimeMinutes * episodeCount,
      },
      unitRate: {
        low: Math.round(500 * rateFactor),
        base: Math.round(800 * rateFactor),
        high: Math.round(1200 * rateFactor),
      },
      fixedCost: { low: 0, base: 0, high: 0 },
      provenance: "user_assumption",
      notes: "Detailed 2D environment painting and compositing layers.",
    },
    {
      id: "line-2d-post-finishing",
      label: "Sound Design, Voice Mix & Master Finishing",
      category: "post_finishing",
      type: "fixed",
      unit: "fixed",
      quantity: { low: 1, base: 1, high: 1 },
      unitRate: { low: 0, base: 0, high: 0 },
      fixedCost: {
        low: Math.round(3000 * episodeCount),
        base: Math.round(4500 * episodeCount),
        high: Math.round(7000 * episodeCount),
      },
      provenance: "user_assumption",
      notes: "Dialogue cleanup, Foley sound design, stereo/5.1 mix, and digital master delivery.",
    },
  ];

  const allowances: Allowance[] = [
    {
      id: "allowance-2d-contingency",
      label: "Production Contingency Allowance",
      ratePercent: 10,
      eligibleBaseCategories: "all_direct",
      provenance: "user_assumption",
      rationale: "Standard 10% contingency reserve against retakes and editorial revisions.",
    },
  ];

  return {
    id,
    label,
    targetFormat,
    technique: "2d_animation",
    location: "Remote / US Indie",
    currency,
    priceDate: "2026-08",
    runtimeMinutes,
    episodeCount,
    sharedSetupReuseDiscountPercent: episodeCount > 1 ? 40 : 0, // 40% setup reuse discount across multi-episode runs
    inputs: {
      runtimeMinutes: {
        key: "runtimeMinutes",
        label: "Finished Runtime",
        value: runtimeMinutes,
        unit: "minutes",
        provenance: "user_assumption",
      },
      episodeCount: {
        key: "episodeCount",
        label: "Episodes",
        value: episodeCount,
        unit: "episodes",
        provenance: "user_assumption",
      },
      complexityTier: {
        key: "complexityTier",
        label: "Animation Complexity",
        value: complexityTier,
        provenance: "user_assumption",
      },
    },
    lineItems,
    allowances,
  };
}
