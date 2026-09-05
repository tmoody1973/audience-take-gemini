import type { ScoutCard } from "@/features/scout-card/types";
import type {
  ScoutBriefTranscript,
  ScoutBriefSegment,
  ScoutBriefSection,
  ScoutBriefVariant,
} from "@/features/scout-brief/types";

export interface ClosedWorldCardInput {
  projectId: string;
  cardVersionId: string;
  variant: ScoutBriefVariant;
  title: string;
  hook: string;
  projectType: string;
  developmentStage: string;
  creatorName: string;
  claimStatus: string;
  decisionPrerequisites: string[];
  nextDiligenceStep: string;
  watchOrFollowUrl?: string;
  evidenceClaims: Array<{
    id: string;
    statement: string;
    status: string;
    qualification?: string | null;
    sourceIds: string[];
  }>;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    origin?: string;
  }>;
  limitations: string[];
}

/**
 * Extracts a minimal, untrusted, closed-world representation of the ScoutCard.
 */
export function buildClosedWorldScriptInput(
  card: ScoutCard,
  variant: ScoutBriefVariant = "pro"
): ClosedWorldCardInput {
  const supportedClaims = (card.evidenceClaims || []).filter(
    (c) => c.status === "supported" || c.status === "qualified"
  );

  const stage = card.storyContext?.currentFormat
    || card.projectType
    || "in active development";

  const creator = card.creatorContext?.displayName || "Independent Creative Team";

  const nextMove = card.decisionBrief?.nextDiligenceStep
    || card.pathways?.[0]?.nextExperiment?.title
    || "Primary diligence on rights and creative materials";

  const watchUrl = card.media?.sourceUrl || card.provenance?.submittedSourceUrl;

  return {
    projectId: card.projectId,
    cardVersionId: card.cardVersionId,
    variant,
    title: card.title,
    hook: card.hook,
    projectType: card.projectType,
    developmentStage: stage,
    creatorName: creator,
    claimStatus: card.claimStatus,
    decisionPrerequisites: card.decisionBrief?.materialUncertainty ? [card.decisionBrief.materialUncertainty] : [],
    nextDiligenceStep: nextMove,
    watchOrFollowUrl: watchUrl,
    evidenceClaims: supportedClaims.map((e) => ({
      id: e.id,
      statement: e.statement,
      status: e.status,
      qualification: e.qualification,
      sourceIds: e.sourceIds || [],
    })),
    sources: (card.sourceLedger || []).map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
      origin: s.origin,
    })),
    limitations: card.limitations || [],
  };
}

/**
 * Counts words accurately across all spoken transcript segments.
 */
export function countTranscriptWords(segments: ScoutBriefSegment[]): number {
  return segments.reduce((total, seg) => {
    const words = seg.text.trim().split(/\s+/).filter(Boolean).length;
    return total + words;
  }, 0);
}

/**
 * Validates a generated transcript against strict closed-world ScoutCard rules.
 */
export function validateScoutBriefTranscript(
  transcript: ScoutBriefTranscript,
  card: ScoutCard,
  minWords = 100,
  maxWords = 350
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!transcript || !Array.isArray(transcript.segments) || transcript.segments.length < 4) {
    errors.push("Transcript must contain at least 4 ordered segments");
    return { valid: false, errors };
  }

  const validSections: ScoutBriefSection[] = [
    "hook",
    "project",
    "evidence",
    "uncertainty",
    "pathways",
    "next_move",
  ];

  let scoutTurns = 0;
  let analystTurns = 0;

  const validSourceIds = new Set((card.sourceLedger || []).map((s) => s.id));

  transcript.segments.forEach((seg, idx) => {
    if (seg.order !== idx + 1) {
      errors.push(`Segment at index ${idx} has invalid order ${seg.order}, expected ${idx + 1}`);
    }

    if (!validSections.includes(seg.section)) {
      errors.push(`Invalid section identifier: ${seg.section}`);
    }

    if (seg.speaker === "Scout") scoutTurns++;
    else if (seg.speaker === "Analyst") analystTurns++;
    else errors.push(`Unknown speaker: ${seg.speaker}`);

    // Verify citation integrity
    if (Array.isArray(seg.sourceIds)) {
      for (const sid of seg.sourceIds) {
        if (validSourceIds.size > 0 && !validSourceIds.has(sid)) {
          if (!sid.startsWith("S") && !sid.startsWith("src-") && !sid.startsWith("source-")) {
            errors.push(`Referenced invalid sourceId: ${sid}`);
          }
        }
      }
    }
  });

  if (scoutTurns < 1) errors.push(`Scout must speak at least 1 time (found ${scoutTurns})`);
  if (analystTurns < 1) errors.push(`Analyst must speak at least 1 time (found ${analystTurns})`);

  const totalWords = countTranscriptWords(transcript.segments);
  if (totalWords < minWords || totalWords > maxWords) {
    errors.push(`Total transcript word count ${totalWords} is outside acceptable range [${minWords}, ${maxWords}]`);
  }

  if (!transcript.disclosure || transcript.disclosure.length < 5) {
    errors.push("Missing required AI generation disclosure");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Builds the Gemini prompt for structured script generation tailored to Discovery or Professional audience.
 */
export function buildScriptGenerationPrompt(
  cardInput: ClosedWorldCardInput,
  variant: ScoutBriefVariant = "pro"
): string {
  if (variant === "discover") {
    return `You are writing a concise 60 to 90-second (130 to 190 words) two-speaker audio briefing for Audience Take called "Scout Brief (Discovery View)".

EDITORIAL PURPOSE:
Introduce a film/animation fan to an exciting independent project quickly, honestly, and engagingly.

STRUCTURE (4 substantive turns alternating Scout and Analyst):
1. Scout ("hook"): State the project title and creative hook immediately. Do NOT say "Welcome to Audience Take" or open with a greeting monologue.
2. Analyst ("project"): Explain the creative vision, format, and what distinguishes this work.
3. Scout ("evidence"): Highlight attributable community buzz or note an honest gap if data is limited. Do NOT invent sentiment or merch claims.
4. Analyst ("next_move"): Conclude with where listeners can watch the teaser, follow the creator, or track future updates.

EDITORIAL RULES:
- Word count MUST be between 130 and 190 words.
- Never invent facts, numbers, awards, or cast attachments.
- Do NOT read opaque market ratings or scores.
- Avoid repetitive filler like "That is right, Scout" or "Exactly, Scout".
- Map each segment to valid sourceIds and claimIds from the DATA below.

DATA:
${JSON.stringify(cardInput, null, 2)}
`;
  }

  return `You are writing a concise 90 to 150-second (190 to 320 words) two-speaker executive audio briefing for Audience Take called "Scout Brief (Professional View)".

EDITORIAL PURPOSE:
Provide film studio executives, scouts, and buyers with an evidence-grounded assessment and ONE actionable next diligence step.

STRUCTURE (4 to 5 substantive turns alternating Scout and Analyst):
1. Scout ("project"): State the project title, creator, and current development stage directly. No greeting monologues.
2. Analyst ("evidence"): Detail the strongest verified evidence (crowdfunding pledges, verified partners, festival selections). At most TWO decision-relevant numbers; all numbers must have supported scope and date.
3. Scout ("uncertainty"): Highlight what the evidence does NOT establish (e.g. rights availability, chain of title, unverified budgets, sample limitations).
4. Analyst ("next_move"): Provide exactly ONE decisive next diligence action tied to the primary unresolved prerequisite. Do NOT list three mechanical pathways.

EDITORIAL RULES:
- Word count MUST be between 190 and 320 words.
- Never invent facts, budget estimates, €/min unit costs, or distribution claims.
- Put uncertainty directly next to the associated claim.
- Avoid filler introductions like "That is right, Scout".
- Map each segment to valid sourceIds and claimIds from the DATA below.

DATA:
${JSON.stringify(cardInput, null, 2)}
`;
}
