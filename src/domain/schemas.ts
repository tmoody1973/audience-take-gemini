import { z } from "zod";

export const MediumTypeSchema = z.enum([
  "feature",
  "short",
  "documentary",
  "series",
  "pilot",
  "proof_of_concept",
  "creator_page",
]);

export const LifecycleStageSchema = z.enum([
  "concept",
  "script",
  "crowdfunding",
  "production",
  "post_production",
  "festival_circuit",
  "unreleased_complete",
]);

export const ClaimTypeSchema = z.enum([
  "observation",
  "reported",
  "inference",
  "conflict",
  "unresolved",
]);

export const SourceMediaSchema = z.object({
  type: z.enum(["youtube_embed", "image"]),
  url: z.string().url("Must be a valid URL"),
  verified: z.boolean().default(false),
  caption: z.string().max(200).optional(),
});

export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.string().url("Must be a valid source URL"),
  title: z.string().min(2).max(300),
  publisher: z.string().min(1).max(100),
  claimType: ClaimTypeSchema,
  excerpt: z.string().min(5).max(1000),
  verified: z.boolean().default(true),
  timestamp: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
  retrievedAt: z.string().optional(),
  supportingClaimIds: z.array(z.string()).optional(),
});

export const BoundedExperimentSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().min(10).max(500),
  successMetric: z.string().min(5).max(300),
});

export const PathwayHypothesisSchema = z.object({
  title: z.string().min(3).max(150),
  mediumFitRationale: z.string().min(10).max(600),
  targetAudience: z.string().min(5).max(400),
  risksAndUncertainties: z.array(z.string().min(5).max(300)).min(1).max(5),
  nextBoundedExperiment: BoundedExperimentSchema,
  prerequisites: z.array(z.string().min(3).max(300)).max(5).optional(),
  owner: z.string().max(100).optional(),
  blockers: z.array(z.string().min(3).max(300)).max(5).optional(),
});

export const DecisionBriefSchema = z.object({
  logline: z.string().min(10).max(400),
  coreHook: z.string().min(5).max(300),
  comparativeTitles: z.array(z.string().min(1).max(100)).min(1).max(5),
  primaryRisk: z.string().min(5).max(300),
  triageSummary: z.string().max(800).optional(),
  materialUncertainty: z.string().max(400).optional(),
  nextDiligenceStep: z.string().max(400).optional(),
});

export const IndustryLensSchema = z.object({
  marketContext: z.string().min(10).max(800),
  comparables: z.array(z.string().min(1).max(100)).min(1).max(6),
  realisticConstraints: z.string().min(10).max(600),
});

export const LLMScoutProposalSchema = z.object({
  projectTitle: z.string().min(1).max(200),
  medium: MediumTypeSchema,
  stage: LifecycleStageSchema,
  creators: z.array(z.string().max(100)).optional(),
  whatWeKnow: z.array(z.string().min(5).max(500)).min(2).max(10),
  whatWereChecking: z.array(z.string().min(5).max(500)).min(1).max(8),
  whyScouted: z.string().min(10).max(800),
  sourceMedia: z.array(SourceMediaSchema).default([]),
  evidenceLedger: z.array(EvidenceItemSchema).min(1),
  pathways: z.array(PathwayHypothesisSchema).min(1).max(3),
  decisionBrief: DecisionBriefSchema,
  industryLens: IndustryLensSchema,
});

export const NominationInputSchema = z.object({
  projectUrl: z.string().url("Must provide a valid project URL"),
  youtubeVideoUrl: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
  reason: z.string().min(10, "Please explain why this project should grow (min 10 characters)").max(1200),
  nominatorRole: z.enum(["fan", "creator"]).default("fan"),
  audienceNotes: z.string().max(800).optional(),
  formatNotes: z.string().max(800).optional(),
  supportingLinks: z
    .array(z.string().url("Each supporting link must be a valid URL"))
    .max(5, "Maximum 5 supporting links allowed")
    .default([]),
});

export const PulseEngagementInputSchema = z.object({
  projectId: z.string().min(1),
  action: z.enum(["toggle_watch", "toggle_pay", "set_city", "toggle_back", "vote_pathway"]),
  city: z.string().max(100).optional(),
  pathwayIndex: z.number().int().min(0).max(2).optional(),
});

export const TakeInputSchema = z.object({
  projectId: z.string().min(1),
  body: z.string().min(5, "Take must be at least 5 characters").max(1500, "Take cannot exceed 1500 characters"),
  pathwayAlignment: z.number().int().min(0).max(2).nullable().optional(),
});

export const ReplyInputSchema = z.object({
  takeId: z.string().min(1),
  projectId: z.string().min(1),
  body: z.string().min(2, "Reply must be at least 2 characters").max(800, "Reply cannot exceed 800 characters"),
});

export const SuggestEvidenceInputSchema = z.object({
  projectId: z.string().min(1),
  url: z.string().url("Must provide a valid evidence URL"),
  note: z.string().max(600).optional(),
  proposedAsMedia: z.boolean().default(false),
});

export const CreatorClaimInputSchema = z.object({
  projectId: z.string().min(1),
  creatorName: z.string().min(2).max(100),
  contactEmail: z.string().email("Must be a valid contact email"),
  proofUrl: z.string().url("Must be a valid proof link (e.g. portfolio, IMDb, social)"),
  statement: z.string().min(10).max(1000),
});

export const CreatorUpdateInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3).max(150),
  body: z.string().min(10).max(3000),
  mediaUrl: z.string().url().optional().or(z.literal("")),
});

export const ReportInputSchema = z.object({
  targetType: z.enum(["project", "take", "reply", "evidence", "creator_update"]),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(100),
  details: z.string().min(5).max(800),
});

export const LLMTrailerCriticSchema = z.object({
  summary: z.string().min(10).max(600),
  genreAndForm: z.string().min(3).max(200),
  whyItMayConnect: z.string().min(10).max(600),
  timestampedBeats: z.array(
    z.object({
      timestampSeconds: z.number().int().min(0),
      timestampFormatted: z.string().regex(/^\d{1,2}:\d{2}$/),
      label: z.string().min(2).max(100),
      description: z.string().min(5).max(300),
    })
  ).min(0).max(10),
  craftAnalysis: z.object({
    cinematography: z.string().min(3).max(600),
    soundAndScore: z.string().min(3).max(600),
    editingAndPacing: z.string().min(3).max(600),
    graphicsAndText: z.string().min(3).max(600),
  }),
  persuasionAndEmotion: z.object({
    emotionalArc: z.string().min(3).max(600),
    targetPersona: z.string().min(3).max(600),
    callToAction: z.string().min(3).max(400),
  }),
  criticMatrix: z.object({
    clarity: z.number().min(0).max(10),
    toneConsistency: z.number().min(0).max(10),
    visualOriginality: z.number().min(0).max(10),
    narrativeTension: z.number().min(0).max(10),
  }),
  limitations: z.string().min(10).max(600),
});
