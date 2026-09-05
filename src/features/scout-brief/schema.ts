import { z } from "zod";

export const ScoutBriefSpeakerRoleSchema = z.enum(["Scout", "Analyst"]);

export const ScoutBriefVariantSchema = z.enum(["discover", "pro"]);

export const ScoutBriefSectionSchema = z.enum([
  "hook",
  "project",
  "evidence",
  "uncertainty",
  "pathways",
  "next_move",
]);

export const ScoutBriefSpeakerSchema = z.object({
  speaker: ScoutBriefSpeakerRoleSchema,
  voice: z.string().min(1),
});

export const ScoutBriefSegmentSchema = z.object({
  order: z.number().int().positive(),
  section: ScoutBriefSectionSchema,
  speaker: ScoutBriefSpeakerRoleSchema,
  text: z.string().min(5).max(2000),
  claimIds: z.array(z.string()),
  sourceIds: z.array(z.string()),
});

export const ScoutBriefTranscriptSchema = z.object({
  variant: ScoutBriefVariantSchema.optional(),
  segments: z.array(ScoutBriefSegmentSchema).min(4).max(30),
  limitations: z.array(z.string()),
  disclosure: z.string().min(5),
});

export const ScoutBriefStatusSchema = z.enum([
  "queued",
  "generating_script",
  "script_ready",
  "generating_audio",
  "ready",
  "failed",
]);

export const ScoutBriefVisibilitySchema = z.enum(["public", "private", "unlisted"]);

export const ScoutBriefSchema = z.object({
  artifactId: z.string().regex(/^scout-brief-[a-zA-Z0-9_-]+$/),
  projectId: z.string().min(1),
  cardVersionId: z.string().min(1),
  runId: z.string().min(1),
  researchVersion: z.number().int().min(1),
  generationVersion: z.number().int().min(1),
  variant: ScoutBriefVariantSchema.optional(),
  status: ScoutBriefStatusSchema,
  visibility: ScoutBriefVisibilitySchema,
  language: z.literal("en-US"),
  title: z.string().min(3).max(200),
  durationMs: z.number().int().min(30000).max(600000),
  wordCount: z.number().int().min(50).max(1500),
  scriptModelId: z.string().min(1),
  ttsModelId: z.string().min(1),
  speakers: z.tuple([ScoutBriefSpeakerSchema, ScoutBriefSpeakerSchema]),
  transcript: ScoutBriefTranscriptSchema,
  sourceIds: z.array(z.string()),
  claimIds: z.array(z.string()),
  pathwayIds: z.array(z.string()),
  storagePath: z.string().min(1),
  audioUrl: z.string().min(1),
  mimeType: z.enum(["audio/wav", "audio/mpeg", "audio/mp4", "audio/aac"]),
  sizeBytes: z.number().int().min(100),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  generatedAt: z.string(),
});
