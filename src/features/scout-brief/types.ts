/**
 * Audio Scout Brief — Type Definitions
 * Strict contracts for the 2-speaker Gemini audio briefing sidecar artifact.
 */

export type ScoutBriefSpeakerRole = "Scout" | "Analyst";

export type ScoutBriefSection =
  | "hook"
  | "project"
  | "evidence"
  | "uncertainty"
  | "pathways"
  | "next_move";

export interface ScoutBriefSpeaker {
  speaker: ScoutBriefSpeakerRole;
  voice: string;
}

export interface ScoutBriefSegment {
  order: number;
  section: ScoutBriefSection;
  speaker: ScoutBriefSpeakerRole;
  text: string;
  claimIds: string[];
  sourceIds: string[];
}

export interface ScoutBriefTranscript {
  segments: ScoutBriefSegment[];
  limitations: string[];
  disclosure: string;
}

export type ScoutBriefStatus =
  | "queued"
  | "generating_script"
  | "script_ready"
  | "generating_audio"
  | "ready"
  | "failed";

export type ScoutBriefVisibility = "public" | "private" | "unlisted";

export interface ScoutBrief {
  artifactId: string;
  projectId: string;
  cardVersionId: string;
  runId: string;
  researchVersion: number;
  generationVersion: number;
  status: ScoutBriefStatus;
  visibility: ScoutBriefVisibility;
  language: "en-US";
  title: string;
  durationMs: number;
  wordCount: number;
  scriptModelId: string;
  ttsModelId: string;
  speakers: [ScoutBriefSpeaker, ScoutBriefSpeaker];
  transcript: ScoutBriefTranscript;
  sourceIds: string[];
  claimIds: string[];
  pathwayIds: string[];
  storagePath: string;
  audioUrl: string;
  mimeType: "audio/wav" | "audio/mpeg" | "audio/mp4" | "audio/aac";
  sizeBytes: number;
  sha256: string;
  generatedAt: string;
}

export interface ScoutBriefJob {
  artifactId: string;
  projectId: string;
  cardVersionId: string;
  runId: string;
  researchVersion: number;
  generationVersion: number;
  state: ScoutBriefStatus;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  attempt?: number;
  taskName?: string;
  scriptRequestStartedAt?: string;
  scriptCompletedAt?: string;
  ttsRequestStartedAt?: string;
  ttsCompletedAt?: string;
  failureCode?: string;
  retryEligible?: boolean;
  transcript?: ScoutBriefTranscript;
  updatedAt: string;
}
