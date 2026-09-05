import type {
  CostDriverDescriptor,
  ProductionTechnique,
  TechniqueAdapterMetadata,
} from "@/features/production-scenarios/types";

export const TECHNIQUE_METADATA_MAP: Record<ProductionTechnique, TechniqueAdapterMetadata> = {
  "2d_animation": {
    technique: "2d_animation",
    label: "2D Animation",
    isMonetarySupported: true,
    requiredInputs: [
      {
        key: "runtimeMinutes",
        label: "Finished Runtime",
        unit: "minutes",
        type: "number",
        description: "Total finished screen time in minutes.",
      },
      {
        key: "complexityTier",
        label: "Animation Complexity",
        unit: "tier",
        type: "select",
        options: ["limited", "standard", "high"],
        description: "Limited (TV/web dialogue), Standard (fluid character), High (action/effects dense).",
      },
      {
        key: "episodeCount",
        label: "Episodes",
        unit: "count",
        type: "number",
        description: "1 for pilot/short/POC; >1 for series.",
      },
    ],
    costDrivers: [
      {
        name: "Keyframe Workload",
        description: "Frame-by-frame character drawing, inbetweening, and cleanup volume.",
        typicalWorkloadUnit: "Cost per animated minute or shot",
        questionsToResolve: [
          "What is the targeted drawings-per-second rate (on 1s vs on 2s)?",
          "Are rigs or hand-drawn frames utilized for character motion?",
        ],
      },
      {
        name: "Visual Development & Turnarounds",
        description: "Upfront character sheets, background color keys, and design setup.",
        typicalWorkloadUnit: "Fixed pre-production package",
        questionsToResolve: [
          "How many unique character models and environment sets are required?",
          "Can asset reuse amortize setup across future episodes?",
        ],
      },
    ],
  },
  "live_action": {
    technique: "live_action",
    label: "Live Action",
    isMonetarySupported: true,
    requiredInputs: [
      {
        key: "runtimeMinutes",
        label: "Finished Runtime",
        unit: "minutes",
        type: "number",
        description: "Expected total finished duration in minutes.",
      },
      {
        key: "shootDays",
        label: "Scheduled Shoot Days",
        unit: "days",
        type: "number",
        description: "Number of principal photography days. Cannot be inferred from runtime alone.",
      },
      {
        key: "crewTier",
        label: "Crew Tier",
        unit: "tier",
        type: "select",
        options: ["indie_micro", "tier_1_union", "commercial_standard"],
        description: "Labor agreement and staffing scale.",
      },
    ],
    costDrivers: [
      {
        name: "Production Crew Day Rates",
        description: "Daily labor for camera, sound, lighting, grip, and production management.",
        typicalWorkloadUnit: "Day rate per crew position × shoot days",
        questionsToResolve: [
          "What is the planned page-count per day shooting ratio?",
          "Are union guild agreements (DGA/IATSE/SAG-AFTRA) applicable?",
        ],
      },
      {
        name: "Location Fees & Equipment Rentals",
        description: "Physical stage/site rentals, municipal filming permits, and cinema camera/lighting packages.",
        typicalWorkloadUnit: "Daily or weekly rental packages",
        questionsToResolve: [
          "Are practical locations secured or will sound stages be built?",
        ],
      },
    ],
  },
  "documentary": {
    technique: "documentary",
    label: "Documentary",
    isMonetarySupported: true,
    requiredInputs: [
      {
        key: "runtimeMinutes",
        label: "Finished Runtime",
        unit: "minutes",
        type: "number",
        description: "Total finished documentary length in minutes.",
      },
      {
        key: "fieldShootDays",
        label: "Field Shoot Days",
        unit: "days",
        type: "number",
        description: "On-location principal recording days.",
      },
      {
        key: "editWeeks",
        label: "Editorial Duration",
        unit: "weeks",
        type: "number",
        description: "Post-production assembly and fine cut duration in weeks.",
      },
      {
        key: "archivalMinutes",
        label: "Archival Footage Scope",
        unit: "minutes",
        type: "number",
        description: "Minutes of archival material requiring license clearance.",
      },
    ],
    costDrivers: [
      {
        name: "Story Editorial Ratio",
        description: "Documentaries require extensive logging and assembly of high shoot-to-screen ratios.",
        typicalWorkloadUnit: "Weekly lead editor rate × editorial weeks",
        questionsToResolve: [
          "What is the estimated shooting ratio (e.g. 30:1, 50:1)?",
          "Is an archival researcher required alongside the editor?",
        ],
      },
      {
        name: "Archival & Music Rights Clearances",
        description: "Master recording and sync licenses plus historical footage clearing fees.",
        typicalWorkloadUnit: "Per-minute clearance rate by territory and media window",
        questionsToResolve: [
          "What rights windows are required (worldwide all-media vs festival-only)?",
        ],
      },
    ],
  },
  "3d_animation": {
    technique: "3d_animation",
    label: "3D CGI Animation",
    isMonetarySupported: false,
    deferredReason:
      "3D CGI animation requires specialized asset modeling, character rigging, texture shading, lighting setups, and dedicated render farm infrastructure. Applying 2D animation or live-action rate cards to 3D produces deeply distorted, unreliable planning totals. Monetary pricing is deferred until project-specific studio bids are provided.",
    requiredInputs: [],
    costDrivers: [
      {
        name: "3D Character Rigging & Topology",
        description: "Deformation joints, facial blendshapes, and cloth/hair dynamic simulations.",
        typicalWorkloadUnit: "Weeks per unique character rig",
        questionsToResolve: [
          "How many hero characters require full skeletal and facial performance rigs?",
          "Are dynamic hair, cloth, or fur physics systems needed?",
        ],
      },
      {
        name: "Render Farm & Shading Infrastructure",
        description: "High-density GPU/CPU cloud rendering, global illumination, and volumetrics.",
        typicalWorkloadUnit: "Core-hours per frame × finished frame count",
        questionsToResolve: [
          "What render engine (e.g. Unreal Engine real-time vs Maya/RenderMan offline) is targeted?",
          "What is the resolution and frame delivery target?",
        ],
      },
      {
        name: "Lighting, Comp & FX Pipeline",
        description: "Shot lighting, particle FX (smoke, fire, water), and multi-pass compositing.",
        typicalWorkloadUnit: "Days per VFX shot",
        questionsToResolve: [
          "What proportion of shots require complex fluid, particle, or destruction dynamics?",
        ],
      },
    ],
  },
  "stop_motion": {
    technique: "stop_motion",
    label: "Stop-Motion Animation",
    isMonetarySupported: false,
    deferredReason:
      "Stop-motion animation involves physical puppet fabrication (armatures, silicone casting, replacement mouths), miniature physical set building, stage space rental, and slow manual animator capture (often 2–5 seconds of footage per animator-day). Borrowing digital animation benchmarks produces entirely invalid budgets. Monetary pricing is deferred until physical stage and puppet quotes are secured.",
    requiredInputs: [],
    costDrivers: [
      {
        name: "Puppet Armature & Fabrication",
        description: "Steel ball-and-socket armatures, foam latex/silicone casting, costume tailoring, and 3D-printed replacement faces.",
        typicalWorkloadUnit: "Physical fabrication cost per hero puppet",
        questionsToResolve: [
          "How many duplicate puppets per hero character are needed for parallel stage units?",
          "Are replacement face kits (e.g. 3D resin printed) or mechanical face rigs used?",
        ],
      },
    ],
  },
  "hybrid_unsupported": {
    technique: "hybrid_unsupported",
    label: "Hybrid / Experimental Technique",
    isMonetarySupported: false,
    deferredReason:
      "Hybrid and multi-technique projects combine disparate pipelines (e.g., live-action plates with stop-motion puppets or AI-assisted generative assets). A unified rate cannot be assumed without explicit, itemized scope separation. Monetary pricing is deferred until each technical component is specified separately.",
    requiredInputs: [],
    costDrivers: [
      {
        name: "Pipeline Integration & Compositing",
        description: "Matching camera motion, color fidelity, and interaction between physical and animated elements.",
        typicalWorkloadUnit: "Custom engineering and specialized post bid",
        questionsToResolve: [
          "Which specific techniques are being composited together?",
          "Can separate itemized bids be secured for each technique layer?",
        ],
      },
    ],
  },
};
