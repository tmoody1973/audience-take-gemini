/**
 * Audience Take — Core Domain Interfaces & Enums
 * Clean-Room Architecture
 */

export type MediumType =
  | "feature"
  | "short"
  | "documentary"
  | "series"
  | "pilot"
  | "proof_of_concept"
  | "creator_page";

export type LifecycleStage =
  | "concept"
  | "script"
  | "crowdfunding"
  | "production"
  | "post_production"
  | "festival_circuit"
  | "unreleased_complete";

export type ClaimType =
  | "observation"
  | "reported"
  | "inference"
  | "conflict"
  | "unresolved";

export type CardStatus = "draft" | "published" | "partial" | "archived" | "failed";

export type CreatorClaimStatus = "unclaimed" | "pending" | "verified" | "rejected";

export type EvidenceLeadStatus =
  | "submitted"
  | "verified"
  | "conflicting"
  | "inaccessible"
  | "irrelevant";

export interface SourceMedia {
  type: "youtube_embed" | "image";
  url: string;
  verified: boolean;
  caption?: string;
}

export interface EvidenceItem {
  id: string;
  sourceUrl: string;
  title: string;
  publisher: string;
  claimType: ClaimType;
  excerpt: string;
  verified: boolean;
  timestamp?: string;
  publishedAt?: string | null;
  retrievedAt?: string;
  supportingClaimIds?: string[];
}

export interface BoundedExperiment {
  name: string;
  description: string;
  successMetric: string;
}

export interface PathwayHypothesis {
  title: string;
  mediumFitRationale: string;
  targetAudience: string;
  risksAndUncertainties: string[];
  nextBoundedExperiment: BoundedExperiment;
  prerequisites?: string[];
  owner?: string;
  blockers?: string[];
}

export interface DecisionBrief {
  logline: string;
  coreHook: string;
  comparativeTitles: string[];
  primaryRisk: string;
  triageSummary?: string;
  materialUncertainty?: string;
  nextDiligenceStep?: string;
}

export interface IndustryLens {
  marketContext: string;
  comparables: string[];
  realisticConstraints: string;
}

export interface VersionProvenance {
  generatedAt: string;
  model: string;
  changeReason: string;
  verifiedByUid?: string;
}

export interface ScoutCard {
  id: string;
  projectId: string;
  version: number;
  status: CardStatus;
  whatWeKnow: string[];
  whatWereChecking: string[];
  whyScouted: string;
  sourceMedia: SourceMedia[];
  evidenceLedger: EvidenceItem[];
  pathways: PathwayHypothesis[];
  decisionBrief: DecisionBrief;
  industryLens: IndustryLens;
  trailerCriticId: string | null;
  versionProvenance: VersionProvenance;
}

export interface TimestampedBeat {
  timestampSeconds: number;
  timestampFormatted: string;
  label: string;
  description: string;
}

export interface CraftAnalysis {
  cinematography: string;
  soundAndScore: string;
  editingAndPacing: string;
  graphicsAndText: string;
}

export interface PersuasionAndEmotion {
  emotionalArc: string;
  targetPersona: string;
  callToAction: string;
}

export interface CriticMatrix {
  clarity: number; // 1-10
  toneConsistency: number; // 1-10
  visualOriginality: number; // 1-10
  narrativeTension: number; // 1-10
}

export interface TrailerCritic {
  id: string;
  projectId: string;
  sourceVideoUrl: string;
  summary: string;
  genreAndForm: string;
  whyItMayConnect: string;
  timestampedBeats: TimestampedBeat[];
  craftAnalysis: CraftAnalysis;
  persuasionAndEmotion: PersuasionAndEmotion;
  criticMatrix: CriticMatrix;
  limitations: string;
  analyzedAt: string;
  model: string;
}

export interface PulseMetrics {
  watchCount: number;
  payCount: number;
  cityDemandCount: number;
  backCount: number;
  pathwayVotes: [number, number, number];
  cities: Record<string, number>;
}

export interface ProjectIdentity {
  title: string;
  normalizedUrl: string;
  originalUrl: string;
  medium: MediumType;
  currentStage: LifecycleStage;
  logline?: string;
  creators?: string[];
}

export interface NominationData {
  submittedByUid: string;
  nominatorRole: "fan" | "creator";
  reason: string;
  initialLinks: string[];
  audienceNotes?: string;
  formatNotes?: string;
  createdAt: string;
}

export interface CreatorClaimInfo {
  status: CreatorClaimStatus;
  claimedByUid?: string;
  verifiedAt?: string;
}

export interface Project {
  id: string;
  identity: ProjectIdentity;
  publishedCardId: string | null;
  nomination: NominationData;
  creatorClaim: CreatorClaimInfo;
  metrics: PulseMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface UserEngagementRecord {
  uid: string;
  projectId: string;
  watch: boolean;
  pay: boolean;
  city: string | null;
  back: boolean;
  votedPathwayIndex: number | null;
  updatedAt: string;
}

export interface Take {
  id: string;
  projectId: string;
  authorUid: string;
  authorDisplayName: string;
  body: string;
  pathwayAlignment: number | null; // 0, 1, 2 or null
  status: "active" | "edited" | "withdrawn" | "flagged";
  createdAt: string;
  updatedAt: string;
}

export interface Reply {
  id: string;
  takeId: string;
  projectId: string;
  authorUid: string;
  authorDisplayName: string;
  body: string;
  status: "active" | "withdrawn" | "flagged";
  createdAt: string;
}

export interface CreatorClaim {
  id: string;
  projectId: string;
  claimedByUid: string;
  creatorName: string;
  contactEmail: string;
  proofUrl: string;
  statement: string;
  status: CreatorClaimStatus;
  submittedAt: string;
  reviewedAt?: string;
}

export interface CreatorUpdate {
  id: string;
  projectId: string;
  creatorUid: string;
  creatorName: string;
  title: string;
  body: string;
  mediaUrl?: string;
  publishedAt: string;
}

export interface EvidenceLead {
  id: string;
  projectId: string;
  submittedByUid: string;
  url: string;
  note?: string;
  proposedAsMedia: boolean;
  status: EvidenceLeadStatus;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: "project" | "take" | "reply" | "evidence" | "creator_update";
  targetId: string;
  reportedByUid: string;
  reason: string;
  details: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

export interface Correction {
  id: string;
  projectId: string;
  cardVersionFrom: number;
  cardVersionTo: number;
  summary: string;
  correctedFields: string[];
  publishedAt: string;
}

export interface ExecutionLease {
  workerId: string;
  acquiredAt: string;
  expiresAt: string;
  attempt: number;
}

export interface ResearchRunState {
  id: string;
  projectId: string;
  nominatorUid: string;
  sourceUrl: string;
  currentStep: "fetching" | "classifying" | "extracting_evidence" | "synthesizing_pathways" | "validating" | "complete" | "failed";
  progressPercent: number;
  stepLogs: {
    timestamp: string;
    step: string;
    message: string;
    status: "pending" | "in_progress" | "done" | "warning" | "error";
  }[];
  cardId?: string;
  partialCard?: Partial<ScoutCard>;
  errorMessage?: string;
  completedAt?: string;
  lease?: ExecutionLease | null;
  attempt?: number;
}

export interface ProjectMonitor {
  id: string; // monitor_id from Parallel
  projectId: string;
  queryScope: string;
  providerState: "active" | "pending" | "disabled";
  createdAt: string;
  lastCheckedAt?: string;
  lastEventAt?: string;
  targetUrl?: string;
}

export interface WebhookReceipt {
  webhookId: string;
  receivedAt: string;
  eventType: string;
  monitorId?: string;
  projectId?: string;
  processed: boolean;
}
