import { z } from "zod";

import completeFixture from "./fixtures/junichiro-card.json";
import fallbackFixture from "./fixtures/junichiro-card-fallback.json";
import partialFixture from "./fixtures/junichiro-card-partial.json";
import unavailableMediaFixture from "./fixtures/junichiro-card-unavailable-media.json";
import { getAdminFirestore } from "../../lib/firebase/admin";
import { youtubeVideoId } from "../../lib/media/youtube";
import { dataRepo } from "../../services/firestore-repo";
import { cleanTextExcerpt } from "./evidence-display";
import { computeMarketViability } from "../../critic/market-viability-engine";
import type { ClaimStatus, EvidenceClaim, ScoutCard, ScoutPathway, SourceLedgerEntry } from "./types";

export const JUNICHIO_SLUG = "junichiro-jackson";
export const JUNICHIO_LIVE_SLUG = "junichiro-live-project";
export const LIVE_REFRESH_FALLBACK_LABEL = "Previously generated — live refresh unavailable.";

const text = z.string().min(1);
const nullableText = z.string().nullable();
const dateTime = z.string().datetime();
const httpUrl = z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://"));
const claimStatus = z.enum(["unclaimed", "pending", "approved", "rejected"]);
const completeness = z.enum(["complete", "partial"]);
const evidenceStatus = z.enum(["verified_core", "verification_in_progress", "source_limited", "conflicting"]);
const stringList = z.array(text);

const nextExperimentSchema = z.object({
  title: text, hypothesis: text, method: text, participantAction: text, signal: text, timebox: text,
  owner: text.optional(), prerequisite: text.optional(), costClass: z.enum(["low", "medium", "high", "unknown"]).optional(),
  requiredPermission: text.optional(), successCriterion: text.optional(), audienceTakeRole: text.optional(),
});
const pathwaySchema = z.object({
  id: text, order: z.number().int().min(1).max(3), label: text, format: text, audience: text, rationale: text,
  strategyKind: z.enum(["development", "distribution", "audience", "financing", "education", "adaptation"]).optional(),
  proposedMedium: z.enum(["documentary", "live_action", "animation", "hybrid", "unknown"]).optional(),
  crossFormat: z.boolean().optional(), crossFormatClaimIds: stringList.optional(),
  supportingClaimIds: stringList.min(1), comparableSourceIds: stringList, strengths: stringList.min(1), risks: stringList.min(1),
  openQuestions: stringList.min(1), confidence: z.enum(["low", "medium", "high"]), nextExperiment: nextExperimentSchema,
  prerequisites: stringList.optional(), owner: text.optional(), blockers: stringList.optional(),
});
const sourceLedgerSchema = z.object({
  id: text, origin: z.enum(["submitted", "parallel", "community_lead", "creator"]), title: text, url: httpUrl,
  publishedAt: dateTime.nullable(), retrievedAt: dateTime, availability: z.enum(["available", "unavailable", "restricted"]),
  verificationStatus: z.enum(["observed", "verified", "qualified", "conflicting", "unverified"]), supportsClaimIds: stringList,
  sourceRole: z.enum(["primary_work", "commentary", "trade_reporting", "community", "creator_statement", "other"]).optional(),
  sourceTier: z.enum(["primary", "creator_authorized", "reputable_trade", "platform_metadata", "secondary", "community"]).optional(),
  externalCommentary: z.boolean(),
  excerpt: text.optional(),
});
const mediaSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("authorized_embed"), title: text, sourceUrl: httpUrl, embedUrl: httpUrl, attribution: text, accessibleFallback: text }),
  z.object({ state: z.literal("authorized_image"), title: text, sourceUrl: httpUrl, imageUrl: text, attribution: text, accessibleFallback: text }),
  z.object({ state: z.literal("editorial_fallback"), title: text, sourceUrl: httpUrl, attribution: text, accessibleFallback: text }),
  z.object({ state: z.literal("unavailable"), title: text, sourceUrl: httpUrl, attribution: text, accessibleFallback: text }),
]);
const timestamp = z.string().regex(/^\d{2}:\d{2}$/);
function timestampSeconds(value: string): number {
  const [minutes, seconds] = value.split(":").map(Number);
  return minutes * 60 + seconds;
}
export const trailerCriticSchema = z.object({
  artifactId: text, projectId: text, sourceId: text, youtubeUrl: httpUrl,
  youtubeVideoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/), modelId: text,
  analysisVersion: z.number().int().min(1), cardVersionId: text,
  structuralNarrative: z.object({
    genreSignaling: text, narrativeDelivery: text, trailerType: text,
    beats: z.array(z.object({
      label: text, start: timestamp, end: timestamp, observation: text,
      modality: z.enum(["visual", "audio", "audiovisual"]),
    }).strict()).min(2).max(6),
  }).strict(),
  technicalCraft: z.object({
    editingAndPace: text, cinematographyAndFraming: text,
    soundAndScore: text, graphicsAndTitles: text,
  }).strict(),
  marketingPersuasion: z.object({
    uniqueSellingProposition: text, targetAudienceHypothesis: text,
    conceptVsStarEmphasis: text, representationCaveat: text,
  }).strict(),
  emotionalRhetorical: z.object({
    emotionalHook: text, toneAndMoodBalance: text, persuasiveArgument: text,
  }).strict(),
  matrix: z.array(z.object({
    category: z.enum(["genre", "narrative_stance", "usp", "target_audience", "sound_music", "camera_editing"]),
    analysis: text,
  }).strict()).length(6),
  sourceIds: stringList, limitations: stringList.min(1), analyzedAt: dateTime,
  visibility: z.literal("public"),
}).strict().superRefine((value, context) => {
  const categories = value.matrix.map((row) => row.category);
  const expected = ["genre", "narrative_stance", "usp", "target_audience", "sound_music", "camera_editing"];
  if (categories.some((category, index) => category !== expected[index])) {
    context.addIssue({ code: "custom", path: ["matrix"], message: "Critic matrix order is invalid." });
  }
  const starts = value.structuralNarrative.beats.map((beat) => timestampSeconds(beat.start));
  value.structuralNarrative.beats.forEach((beat, index) => {
    if (timestampSeconds(beat.end) < timestampSeconds(beat.start)) {
      context.addIssue({ code: "custom", path: ["structuralNarrative", "beats", index], message: "Beat timestamps are invalid." });
    }
    if (index > 0 && starts[index] < starts[index - 1]) {
      context.addIssue({ code: "custom", path: ["structuralNarrative", "beats", index], message: "Beats must be chronological." });
    }
  });
  if (new Set(value.sourceIds).size !== value.sourceIds.length) {
    context.addIssue({ code: "custom", path: ["sourceIds"], message: "Source IDs must be unique." });
  }
});
const scoutCardSchema = z.object({
  cardVersionId: text, runId: text, researchVersion: z.number().int().min(1), projectId: text,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text, hook: text,
  projectType: z.enum(["series", "film", "short_film", "documentary", "creator_project"]), submissionLabel: text,
  claimStatus, completeness, structureStatus: completeness.optional(), evidenceStatus: evidenceStatus.optional(),
  identity: z.object({
    relationshipStatus: z.enum(["unresolved", "source_aligned", "creator_confirmed", "disputed"]),
    primarySourceId: text.optional(), lastVerifiedAt: dateTime.optional(),
  }).optional(),
  primaryWorkSourceId: text.optional(), fallbackUsed: z.boolean(), fallbackLabel: z.string().optional(),
  provenance: z.object({ submissionType: z.enum(["fan", "creator"]), submittedSourceUrl: httpUrl, nominationLabel: text, nominatedByLabel: text, researchedAt: dateTime }),
  media: mediaSchema,
  storyContext: z.object({ summary: text, storyworld: text, themes: stringList, currentFormat: text, audienceHooks: stringList, claimIds: stringList.min(1) }),
  creatorContext: z.object({ displayName: nullableText, claimStatus, summary: text, sourceIds: stringList, limitations: stringList }),
  sourceIds: stringList.min(1), claimIds: stringList.min(1),
  evidenceClaims: z.array(z.object({ id: text, statement: text, status: z.enum(["supported", "qualified", "conflicting", "unsupported", "inference"]), sourceIds: stringList, qualification: nullableText })).min(1),
  externalSignals: z.array(z.object({ label: text, analysis: text, sourceIds: stringList.min(1), limitations: stringList.min(1), nativeAudienceCount: z.literal(false) })),
  pathwayIds: stringList.min(1).max(3), pathways: z.array(pathwaySchema).min(1).max(3), sourceLedger: z.array(sourceLedgerSchema).min(1),
  missingSections: stringList, limitations: stringList.min(1),
  industryLens: z.object({ pathwayIds: stringList.min(1).max(3), comparables: z.array(z.object({ title: text, relevance: text, sourceIds: stringList.min(1), limitations: stringList.min(1) })), risks: stringList.min(1), unresolvedQuestions: stringList.min(1), signalLimitations: stringList.min(1), creatorClaimStatus: claimStatus, recommendedNextExperiment: nextExperimentSchema }),
  publishedAt: dateTime,
});

const fixtures = {
  complete: scoutCardSchema.parse(completeFixture) as ScoutCard,
  partial: scoutCardSchema.parse(partialFixture) as ScoutCard,
  unavailable: scoutCardSchema.parse(unavailableMediaFixture) as ScoutCard,
  fallback: scoutCardSchema.parse(fallbackFixture) as ScoutCard,
} as const;

export type ScoutCardFixtureState = keyof typeof fixtures;

const MAX_ERROR_MESSAGE_LENGTH = 500;

function redactDiagnosticMessage(message: string): string {
  return message
    .replace(/\b(Bearer|Basic)\s+[^\s"',]+/gi, "$1 [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[REDACTED_JWT]")
    .replace(/([?&](?:access_token|id_token|token|key)=)[^&\s]+/gi, "$1[REDACTED]")
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

function boundedDiagnosticScalar(value: unknown, maxLength: number): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.length === 0) return undefined;
  return redactDiagnosticMessage(value).slice(0, maxLength);
}

function logPublishedCardLoadFailure(slug: string, error: unknown): void {
  const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const errorName = error instanceof Error ? error.name : boundedDiagnosticScalar(details.name, 80);
  const errorMessage = error instanceof Error
    ? redactDiagnosticMessage(error.message)
    : boundedDiagnosticScalar(details.message, MAX_ERROR_MESSAGE_LENGTH);

  console.error(JSON.stringify({
    level: "error",
    event: "published_scout_card_load_failed",
    slug,
    errorName,
    errorCode: boundedDiagnosticScalar(details.code, 120),
    errorStatus: boundedDiagnosticScalar(details.status, 40),
    errorMessage,
  }));
}

type DocumentSnapshotLike = { id: string; exists: boolean; data(): unknown };
type QuerySnapshotLike = { docs: DocumentSnapshotLike[] };
type QueryLike = { where(field: string, operator: "==", value: unknown): QueryLike; limit(count: number): QueryLike; get(): Promise<QuerySnapshotLike> };
type CollectionLike = QueryLike & { doc(id: string): { get(): Promise<DocumentSnapshotLike> } };
export type ScoutCardFirestore = { collection(name: string): CollectionLike };

export function parsePublishedCard(value: unknown, expected: { cardVersionId: string; projectId: string; slug: string }): ScoutCard | null {
  if (!value || typeof value !== "object" || (value as { visibility?: unknown }).visibility !== "public") return null;
  const { visibility: _visibility, ...publicValue } = value as Record<string, unknown>;
  void _visibility;
  const result = scoutCardSchema.safeParse(publicValue);
  if (!result.success) return null;
  const card = result.data as ScoutCard;
  const pathwayIds = card.pathways.map((pathway) => pathway.id);
  if (
    card.cardVersionId !== expected.cardVersionId || card.projectId !== expected.projectId || card.slug !== expected.slug ||
    new Set(card.pathwayIds).size !== 3 || pathwayIds.some((id, index) => id !== card.pathwayIds[index]) ||
    card.pathways.some((pathway, index) => pathway.order !== index + 1) ||
    (card.completeness === "complete" && card.missingSections.length > 0) ||
    (card.completeness === "partial" && card.missingSections.length === 0) ||
    (card.fallbackUsed && card.fallbackLabel !== LIVE_REFRESH_FALLBACK_LABEL)
  ) return null;
  return card;
}

async function readPublishedScoutCard(slug: string, database: ScoutCardFirestore): Promise<ScoutCard | null> {
  let projectSnapshot: DocumentSnapshotLike | undefined;
  const projects = await database.collection("projects").where("slug", "==", slug).limit(2).get();
  if (projects.docs.length === 1) {
    projectSnapshot = projects.docs[0];
  } else {
    const directDoc = await database.collection("projects").doc(slug).get();
    if (directDoc.exists) {
      projectSnapshot = directDoc;
    }
  }
  if (!projectSnapshot) return null;
  const project = projectSnapshot.data();
  if (!project || typeof project !== "object") return null;
  const projectData = project as Record<string, unknown>;
  if (
    projectData.publicationStatus !== "published" ||
    (projectData.moderationState !== undefined && projectData.moderationState !== "clear") ||
    typeof projectData.latestCardVersionId !== "string" || !projectData.latestCardVersionId
  ) return null;

  const cardSnapshot = await database.collection("scoutCards").doc(projectData.latestCardVersionId).get();
  if (!cardSnapshot.exists) return null;
  const card = parsePublishedCard(cardSnapshot.data(), { cardVersionId: projectData.latestCardVersionId, projectId: projectSnapshot.id, slug });
  if (!card) return null;

  // Claim status is a mutable authorization fact owned by trusted project and
  // role records. Model-authored card text must never grant or imply access.
  const trustedClaimStatus = claimStatus.safeParse(projectData.claimStatus).success
    ? claimStatus.parse(projectData.claimStatus)
    : "unclaimed";
  const analysisIds = Array.isArray(projectData.latestVideoAnalysisIds)
    ? [...new Set(projectData.latestVideoAnalysisIds.filter((value): value is string => typeof value === "string" && value.length > 0))].slice(0, 5)
    : [];
  const analysisSnapshots = await Promise.all(
    analysisIds.map((analysisId) => database.collection("videoAnalyses").doc(analysisId).get()),
  );
  const trailerCritiques = analysisSnapshots.flatMap((snapshot) => {
    if (!snapshot.exists) return [];
    const parsed = trailerCriticSchema.safeParse(snapshot.data());
    if (!parsed.success || parsed.data.artifactId !== snapshot.id || parsed.data.projectId !== card.projectId) return [];
    const source = card.sourceLedger.find((entry) => entry.id === parsed.data.sourceId);
    if (!source || youtubeVideoId(source.url) !== parsed.data.youtubeVideoId || youtubeVideoId(parsed.data.youtubeUrl) !== parsed.data.youtubeVideoId) return [];
    return [parsed.data];
  });

  const cardData = cardSnapshot.data() as any;
  const decisionBrief = cardData?.decisionBrief || card.decisionBrief;
  const directTrailerCritiques = Array.isArray(cardData?.trailerCritiques) && cardData.trailerCritiques.length > 0
    ? cardData.trailerCritiques
    : trailerCritiques;
  const computedViability = cardData?.marketViability ?? undefined;
  const computedFandom = cardData?.fandomDna ?? undefined;
  const computedLivingDossier = cardData?.livingDossier ?? undefined;

  return {
    ...card,
    claimStatus: trustedClaimStatus,
    creatorContext: { ...card.creatorContext, claimStatus: trustedClaimStatus },
    industryLens: { ...card.industryLens, creatorClaimStatus: trustedClaimStatus },
    trailerCritiques: directTrailerCritiques,
    decisionBrief,
    marketViability: computedViability,
    fandomDna: computedFandom,
    livingDossier: computedLivingDossier,
  };
}

export function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("ref");
    let normalized = parsed.toString();
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch {
    return (rawUrl || "").trim().toLowerCase();
  }
}

const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "all", "also", "and", "any", "are", "aren't",
  "because", "been", "before", "being", "below", "between", "both", "but", "can", "cannot",
  "could", "couldn't", "did", "didn't", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
  "having", "how", "into", "itself", "just", "more", "most", "mustn't", "not", "off", "once",
  "only", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
  "she", "should", "shouldn't", "some", "such", "than", "that", "the", "their", "theirs",
  "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
  "they're", "they've", "this", "those", "through", "under", "until", "very", "was", "wasn't",
  "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while",
  "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd",
  "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "project", "public"
]);

export function findSupportingSourceIds(
  claimText: string,
  sources: Array<{ id: string; title: string; excerpt?: string; url: string }>
): string[] {
  if (!claimText || sources.length === 0) return [];
  const normalizedClaim = claimText.toLowerCase();

  const words = normalizedClaim
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));

  const matchingSourceIds: string[] = [];

  for (const source of sources) {
    const sourceContent = `${source.title} ${source.excerpt || ""} ${source.url}`.toLowerCase();

    let matchCount = 0;
    for (const word of words) {
      if (sourceContent.includes(word)) {
        matchCount++;
      }
    }

    const distinctRatio = words.length > 0 ? matchCount / words.length : 0;
    const hasPhraseMatch = Boolean(
      source.excerpt &&
      source.excerpt.length > 15 &&
      (normalizedClaim.includes(source.excerpt.slice(0, 30).toLowerCase()) ||
       sourceContent.includes(normalizedClaim.slice(0, 30)))
    );

    if ((matchCount >= 2 && distinctRatio >= 0.2) || hasPhraseMatch || matchCount >= 3) {
      matchingSourceIds.push(source.id);
    }
  }

  return matchingSourceIds;
}

export async function loadPublishedScoutCard(slug: string, database?: ScoutCardFirestore): Promise<ScoutCard | null> {
  try {
    const db = (database ?? getAdminFirestore()) as any;
    const fromFirestore = await readPublishedScoutCard(slug, db);
    if (fromFirestore) return fromFirestore;

    // Check dataRepo and Firestore for dynamically scouted projects in live environment
    let dynamicProject = await dataRepo.getProjectById(slug);
    if (!dynamicProject && db) {
      try {
        const doc = await db.collection("projects").doc(slug).get();
        if (doc.exists) {
          dynamicProject = { id: doc.id, ...doc.data() } as any;
        } else {
          const snap = await db.collection("projects").where("slug", "==", slug).limit(1).get();
          if (!snap.empty) {
            dynamicProject = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
          }
        }
      } catch (err) {
        console.warn("[ScoutCard] Firestore dynamicProject lookup failed:", err);
      }
    }

    const dyn = dynamicProject as any;
    if (dyn) {
      if (
        dyn.publicationStatus !== "published" ||
        (dyn.moderationState !== undefined && dyn.moderationState !== "clear")
      ) {
        return null;
      }
    }

    let dynamicCard: any = null;
    if (dyn?.publishedCardId) {
      dynamicCard = await dataRepo.getScoutCardById(dyn.publishedCardId);
      if (!dynamicCard && db) {
        try {
          const cardDoc = await db.collection("scoutCards").doc(dyn.publishedCardId).get();
          if (cardDoc.exists) dynamicCard = { id: cardDoc.id, ...cardDoc.data() };
        } catch {}
      }
    }
    if (!dynamicCard && dyn?.latestCardVersionId) {
      dynamicCard = await dataRepo.getScoutCardById(dyn.latestCardVersionId);
      if (!dynamicCard && db) {
        try {
          const cardDoc = await db.collection("scoutCards").doc(dyn.latestCardVersionId).get();
          if (cardDoc.exists) dynamicCard = { id: cardDoc.id, ...cardDoc.data() };
        } catch {}
      }
    }
    if (!dynamicCard) {
      dynamicCard = await dataRepo.getScoutCardById(`card-${slug}-v1`);
      if (!dynamicCard && db) {
        try {
          const cardDoc = await db.collection("scoutCards").doc(`card-${slug}-v1`).get();
          if (cardDoc.exists) dynamicCard = { id: cardDoc.id, ...cardDoc.data() };
        } catch {}
      }
    }
    if (!dynamicCard) {
      dynamicCard = await dataRepo.getScoutCardById(slug);
      if (!dynamicCard && db) {
        try {
          const cardDoc = await db.collection("scoutCards").doc(slug).get();
          if (cardDoc.exists) dynamicCard = { id: cardDoc.id, ...cardDoc.data() };
        } catch {}
      }
    }

    if (dynamicCard) {
      const dynamicCritic = await dataRepo.getTrailerCriticById(dynamicProject?.id || slug);
      const originalUrl = dynamicProject?.identity?.originalUrl || dynamicCard.sourceMedia?.[0]?.url || dynamicCard.evidenceLedger?.[0]?.sourceUrl || "https://www.youtube.com";

      // Deduplicate canonical sources from evidenceLedger
      const canonUrlToSourceId = new Map<string, string>();
      const sourceLedgerEntries: SourceLedgerEntry[] = [];

      for (let idx = 0; idx < (dynamicCard.evidenceLedger || []).length; idx++) {
        const ev = dynamicCard.evidenceLedger[idx];
        const rawUrl = ev.sourceUrl || originalUrl;
        const canonUrl = canonicalizeUrl(rawUrl);
        if (canonUrlToSourceId.has(canonUrl)) {
          continue;
        }

        const sourceId = ev.id || `source-${idx + 1}`;
        canonUrlToSourceId.set(canonUrl, sourceId);

        const isSubmitted =
          canonUrl === canonicalizeUrl(originalUrl) ||
          canonUrl.includes(canonicalizeUrl(originalUrl)) ||
          canonicalizeUrl(originalUrl).includes(canonUrl);

        const rawExcerpt = ev.excerpt || ev.title || "";
        const cleanedExcerpt = cleanTextExcerpt(rawExcerpt, ev.title);

        sourceLedgerEntries.push({
          id: sourceId,
          origin: isSubmitted ? ("submitted" as const) : ("parallel" as const),
          title: ev.title || (isSubmitted ? "Submitted Project Media" : "Parallel Web Discovery"),
          url: rawUrl,
          publishedAt: ev.publishedAt || ev.publish_date || null,
          retrievedAt: ev.retrievedAt || ev.timestamp || dynamicCard.createdAt || dynamicProject?.createdAt || "2026-08-26T12:00:00Z",
          availability: "available" as const,
          verificationStatus: isSubmitted ? ("observed" as const) : (ev.verified ? "verified" as const : "observed" as const),
          sourceRole: isSubmitted ? ("primary_work" as const) : ("trade_reporting" as const),
          sourceTier: isSubmitted ? ("primary" as const) : ("secondary" as const),
          supportsClaimIds: [],
          externalCommentary: false,
          excerpt: cleanedExcerpt,
        });
      }

      if (sourceLedgerEntries.length === 0) {
        sourceLedgerEntries.push({
          id: "source-1",
          origin: "submitted" as const,
          title: "Submitted Project Media",
          url: originalUrl,
          publishedAt: null,
          retrievedAt: dynamicProject?.createdAt || "2026-08-26T12:00:00Z",
          availability: "available" as const,
          verificationStatus: "observed" as const,
          sourceRole: "primary_work" as const,
          sourceTier: "primary" as const,
          supportsClaimIds: [],
          externalCommentary: false,
          excerpt: undefined,
        });
      }

      const sourceIds = sourceLedgerEntries.map((s) => s.id);

      const youtubeCandidate =
        dynamicCard.sourceMedia?.find((m: any) => m.url?.includes("youtube.com") || m.url?.includes("youtu.be"))?.url
        || (dynamicProject?.nomination?.initialLinks || []).find((l: string) => l?.includes("youtube.com") || l?.includes("youtu.be"))
        || dynamicCard.evidenceLedger?.find((e: any) => e.sourceUrl?.includes("youtube.com") || e.sourceUrl?.includes("youtu.be"))?.sourceUrl
        || dynamicCard.sourceMedia?.[0]?.url
        || originalUrl;

      const vidId = youtubeVideoId(youtubeCandidate);
      const resolvedEmbedUrl = vidId ? `https://www.youtube-nocookie.com/embed/${vidId}` : originalUrl;

      const title = dynamicProject?.identity?.title
        || dynamicCard.evidenceLedger?.find((e: any) => e.sourceUrl.includes("youtube.com") || e.sourceUrl.includes("youtu.be"))?.title?.replace(/^Video Title:\s*/i, "")
        || dynamicCard.evidenceLedger?.find((e: any) => e.title.includes("Trailer") || e.title.includes("Official"))?.title?.replace(/^Video Title:\s*/i, "")
        || (dynamicCard as any).projectTitle
        || (dynamicCard as any).decisionBrief?.logline
        || "Independent Screen Project";

      const hook = dynamicProject?.identity?.logline
        || (dynamicCard as any).decisionBrief?.coreHook
        || dynamicCard.whyScouted;

      const medium = dynamicProject?.identity?.medium || (dynamicCard as any).medium || "series";
      const creators = dynamicProject?.identity?.creators || (dynamicCard as any).creators || ["Independent Filmmaker"];
      const claimStatusVal = (dynamicProject?.creatorClaim?.status || "unclaimed") as ClaimStatus;
      const resolvedCardVersionId = dynamicCard.cardVersionId || dynamicCard.id || dyn?.latestCardVersionId || (dyn as any)?.publishedCardId || `card-${slug}-v1`;

      const evidenceClaims: EvidenceClaim[] = [];
      const seenStatements = new Set<string>();

      // 1. Ground synthesized claims from whatWeKnow against source ledger
      if (Array.isArray(dynamicCard.whatWeKnow)) {
        dynamicCard.whatWeKnow.forEach((text: string, idx: number) => {
          const stmt = cleanTextExcerpt(text);
          if (!stmt || stmt.length < 15 || seenStatements.has(stmt.toLowerCase())) return;
          seenStatements.add(stmt.toLowerCase());

          const claimId = `claim-synthesized-${idx + 1}`;
          const matchingSources = findSupportingSourceIds(stmt, sourceLedgerEntries);

          if (matchingSources.length > 0) {
            evidenceClaims.push({
              id: claimId,
              statement: stmt,
              status: "supported",
              sourceIds: matchingSources,
              qualification: null,
            });
            for (const sId of matchingSources) {
              const src = sourceLedgerEntries.find((s) => s.id === sId);
              if (src && !src.supportsClaimIds.includes(claimId)) {
                src.supportsClaimIds.push(claimId);
              }
            }
          } else {
            // Truthful abstention without inventing fake citations
            evidenceClaims.push({
              id: claimId,
              statement: stmt,
              status: "inference",
              sourceIds: [],
              qualification: "Synthesized observation without direct passage match in retrieved sources.",
            });
          }
        });
      }

      // 2. Direct passage claims from evidenceLedger
      (dynamicCard.evidenceLedger || []).forEach((ev: any, idx: number) => {
        const stmt = cleanTextExcerpt(ev.excerpt || ev.title, ev.title);
        if (!stmt || stmt.length < 15 || seenStatements.has(stmt.toLowerCase())) return;
        seenStatements.add(stmt.toLowerCase());

        const canonUrl = canonicalizeUrl(ev.sourceUrl || originalUrl);
        const canonSourceId = canonUrlToSourceId.get(canonUrl) || ev.id || `source-${idx + 1}`;
        const claimId = ev.id ? `claim-${ev.id}` : `claim-ev-${idx + 1}`;

        const isConflict = ev.claimType === "conflict";
        const isInference = ev.claimType === "inference";

        evidenceClaims.push({
          id: claimId,
          statement: stmt,
          status: isConflict ? "conflicting" : isInference ? "inference" : "supported",
          sourceIds: [canonSourceId],
          qualification: isConflict ? "Source reports conflicting information." : null,
        });

        const src = sourceLedgerEntries.find((s) => s.id === canonSourceId);
        if (src && !src.supportsClaimIds.includes(claimId)) {
          src.supportsClaimIds.push(claimId);
        }
      });

      const claimIds = evidenceClaims.map((c) => c.id);

      const pathways: ScoutPathway[] = (dynamicCard.pathways || []).slice(0, 3).map((pw: any, idx: number) => {
        const pathwayClaimIds: string[] = [];
        const pwTokens = `${pw.title} ${pw.mediumFitRationale || ""}`.toLowerCase();
        for (const claim of evidenceClaims) {
          const claimTokens = claim.statement.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
          if (claimTokens.some((tok) => pwTokens.includes(tok))) {
            pathwayClaimIds.push(claim.id);
          }
        }
        if (pathwayClaimIds.length === 0 && evidenceClaims[0]) {
          pathwayClaimIds.push(evidenceClaims[0].id);
        }
        if (pathwayClaimIds.length === 0) {
          pathwayClaimIds.push(`claim-pathway-${idx + 1}`);
        }

        const comparableSourceIds = findSupportingSourceIds(pw.title, sourceLedgerEntries);

        return {
          id: `pathway-${idx + 1}`,
          order: idx + 1,
          label: pw.title,
          format: pw.title,
          audience: pw.targetAudience,
          rationale: pw.mediumFitRationale,
          supportingClaimIds: pathwayClaimIds,
          comparableSourceIds,
          strengths: [pw.mediumFitRationale],
          risks: pw.risksAndUncertainties || ["Development and audience validation risks."],
          openQuestions: ["How will audience feedback shape development?"],
          confidence: "medium" as const,
          prerequisites: Array.isArray(pw.prerequisites) ? pw.prerequisites : [],
          owner: typeof pw.owner === "string" ? pw.owner : undefined,
          blockers: Array.isArray(pw.blockers) ? pw.blockers : [],
          nextExperiment: {
            title: pw.nextBoundedExperiment?.name || "Audience Feedback Pulse",
            hypothesis: pw.nextBoundedExperiment?.description || "Audience will validate interest",
            method: "Collect structured feedback on Audience Take",
            participantAction: "Vote and submit Takes",
            signal: pw.nextBoundedExperiment?.successMetric || "50+ positive takes",
            timebox: "14 days",
          },
        };
      });

      return {
        cardVersionId: resolvedCardVersionId,
        runId: "run-dynamic",
        researchVersion: 1,
        projectId: dynamicProject?.id || dyn?.id || slug,
        slug: dynamicProject?.id || slug,
        title,
        hook,
        projectType: (medium === "series" ? "series" : "film") as any,
        submissionLabel: (claimStatusVal as string) === "approved" || (claimStatusVal as string) === "verified" ? "Creator submission" : "Fan nomination — unclaimed by creator",
        claimStatus: claimStatusVal,
        completeness: "complete" as const,
        fallbackUsed: false,
        provenance: {
          submissionType: "fan" as const,
          submittedSourceUrl: originalUrl,
          nominationLabel: "Fan-submitted public project source",
          nominatedByLabel: "Community scout",
          researchedAt: dynamicProject?.createdAt || dynamicCard.createdAt || "2026-08-26T12:00:00Z",
        },
        media: {
          state: vidId ? ("authorized_embed" as const) : ("editorial_fallback" as const),
          title,
          sourceUrl: youtubeCandidate || originalUrl,
          embedUrl: resolvedEmbedUrl,
          attribution: creators[0] || "Public Source",
          accessibleFallback: `Public video for ${title}`,
        },
        storyContext: {
          summary: Array.isArray(dynamicCard.whatWeKnow) ? dynamicCard.whatWeKnow.join(" ") : (dynamicCard.whatWeKnow || dynamicCard.whyScouted),
          storyworld: Array.isArray(dynamicCard.whatWeKnow) ? dynamicCard.whatWeKnow.join(" ") : (dynamicCard.whatWeKnow || dynamicCard.whyScouted),
          themes: ["independent cinema", "creative vision"],
          currentFormat: medium,
          audienceHooks: ["independent creators", "unique storytelling"],
          claimIds,
        },
        creatorContext: {
          displayName: creators[0] || null,
          claimStatus: claimStatusVal,
          summary: dynamicCard.whyScouted,
          sourceIds,
          limitations: ["Based on public web reporting and submitted video evidence."],
        },
        sourceIds,
        claimIds,
        evidenceClaims,
        externalSignals: [],
        pathwayIds: pathways.map((p) => p.id),
        pathways,
        sourceLedger: sourceLedgerEntries,
        missingSections: [],
        limitations: ["Based on public web reporting and submitted video evidence."],
        industryLens: {
          pathwayIds: pathways.map((p) => p.id),
          comparables: (dynamicCard.industryLens?.comparables || ["Independent Comparable"]).map((cmpTitle: string) => {
            const matchingSources = findSupportingSourceIds(cmpTitle, sourceLedgerEntries);
            return {
              title: cmpTitle,
              relevance: "Comparable market trajectory and audience crossover.",
              sourceIds: matchingSources,
              limitations: matchingSources.length > 0
                ? ["Market conditions differ."]
                : ["Market conditions differ; no dedicated public trade source retrieved for this comparable."],
            };
          }),
          risks: [dynamicCard.decisionBrief?.primaryRisk || "Financing and distribution alignment."],
          unresolvedQuestions: ["Distribution rights exclusivity."],
          signalLimitations: ["Early audience demand signals."],
          creatorClaimStatus: claimStatusVal,
          recommendedNextExperiment: {
            title: "Community Proof of Concept",
            hypothesis: "Demonstrates core fan demographic engagement",
            method: "Track audience commitments and pulse",
            participantAction: "Commit support",
            signal: "100+ community signals",
            timebox: "30 days",
          },
        },
        marketViability: dynamicCard?.marketViability ?? undefined,
        livingDossier: dynamicCard?.livingDossier ?? undefined,
        fandomDna: dynamicCard?.fandomDna ?? undefined,
        channelEcosystem: dynamicCard?.channelEcosystem ?? undefined,
        publishedAt: dynamicCard?.publishedAt || dynamicProject?.updatedAt || dynamicProject?.createdAt || "2026-08-26T12:00:00Z",
        trailerCritiques: dynamicCritic ? [{
          artifactId: dynamicCritic.id,
          projectId: dynamicProject?.id || slug,
          sourceId: sourceIds[0] || "source-1",
          youtubeUrl: dynamicCritic.sourceVideoUrl,
          youtubeVideoId: youtubeVideoId(dynamicCritic.sourceVideoUrl) || "M2djoKmnOTY",
          modelId: dynamicCritic.model || "gemini-3.7-flash",
          analysisVersion: 1,
          cardVersionId: dynamicCard.id,
          structuralNarrative: {
            genreSignaling: dynamicCritic.genreAndForm || "Independent Screen Project",
            narrativeDelivery: dynamicCritic.summary || "Audiovisual scene development",
            trailerType: dynamicCritic.genreAndForm?.includes("Trailer") ? "Official Trailer" : "Project Media Preview",
            beats: (dynamicCritic.timestampedBeats || []).slice(0, 6).map((b: any, bIdx: number, allBeats: any[]) => {
              const nextBeat = allBeats[bIdx + 1];
              const start = b.timestampFormatted || "0:00";
              const end = nextBeat?.timestampFormatted || "1:00";
              return {
                label: b.label || "Narrative Beat",
                start,
                end,
                observation: b.description || "Audiovisual scene development",
                modality: "audiovisual" as const,
              };
            }),
          },
          technicalCraft: {
            editingAndPace: dynamicCritic.craftAnalysis?.editingAndPacing || "Media analysis pending or unavailable.",
            cinematographyAndFraming: dynamicCritic.craftAnalysis?.cinematography || "Media analysis pending or unavailable.",
            soundAndScore: dynamicCritic.craftAnalysis?.soundAndScore || "Media analysis pending or unavailable.",
            graphicsAndTitles: dynamicCritic.craftAnalysis?.graphicsAndText || "Media analysis pending or unavailable.",
          },
          marketingPersuasion: {
            uniqueSellingProposition: dynamicCritic.whyItMayConnect || "Media analysis pending or unavailable.",
            targetAudienceHypothesis: dynamicCritic.persuasionAndEmotion?.targetPersona || "Audience hypothesis pending direct community feedback.",
            conceptVsStarEmphasis: "Independent creative concept led.",
            representationCaveat: "Subject to public community verification.",
          },
          emotionalRhetorical: {
            emotionalHook: dynamicCritic.whyItMayConnect || dynamicCritic.persuasionAndEmotion?.emotionalArc || "Grounded story hook.",
            toneAndMoodBalance: dynamicCritic.craftAnalysis?.cinematography || "Tone and pacing observed in sample.",
            persuasiveArgument: dynamicCritic.persuasionAndEmotion?.callToAction || "Explore project on Audience Take.",
          },
          matrix: [
            { category: "genre" as const, analysis: dynamicCritic.genreAndForm || "Independent Screen Project" },
            { category: "narrative_stance" as const, analysis: dynamicCritic.summary || "Narrative delivery observed from submitted media." },
            { category: "usp" as const, analysis: dynamicCritic.whyItMayConnect || "Creative identity and distinct perspective." },
            { category: "target_audience" as const, analysis: dynamicCritic.persuasionAndEmotion?.targetPersona || "Prospective audience for independent screen storytelling." },
            { category: "sound_music" as const, analysis: dynamicCritic.craftAnalysis?.soundAndScore || "Audio craft observed from submitted media." },
            { category: "camera_editing" as const, analysis: dynamicCritic.craftAnalysis?.cinematography || "Visual framing observed from submitted media." },
          ],
          sourceIds: [sourceIds[0] || "source-1"],
          limitations: [dynamicCritic.limitations || "Based on multimodal audiovisual stream analysis."],
          analyzedAt: dynamicCritic.analyzedAt || new Date().toISOString(),
          visibility: "public" as const,
        }] : [],
      };
    }
  } catch (err: any) {
    const rawMessage = String(err?.message || "");
    const sanitizedMessage = rawMessage
      .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
      .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi, "[REDACTED_JWT]")
      .replace(/access_token=[^\s&]+/gi, "access_token=[REDACTED]");

    console.error(JSON.stringify({
      level: "error",
      event: "published_scout_card_load_failed",
      slug,
      errorName: err?.name || "Error",
      errorCode: err?.code || err?.status,
      errorStatus: err?.status,
      errorMessage: sanitizedMessage,
    }));
    if (slug === "junichiro-jackson" || slug === JUNICHIO_LIVE_SLUG) {
      return {
        ...fixtures.fallback,
        fallbackUsed: true,
        fallbackLabel: LIVE_REFRESH_FALLBACK_LABEL,
      } as ScoutCard;
    }
  }
  return null;
}

/** Contract fixtures are explicit test/local-preview helpers and are never the route's live data source. */
export function getScoutCardFixture(state: ScoutCardFixtureState): ScoutCard {
  return fixtures[state];
}
