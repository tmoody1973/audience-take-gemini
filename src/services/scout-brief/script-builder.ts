import type { ScoutCard } from "@/features/scout-card/types";
import type {
  ScoutBriefTranscript,
  ScoutBriefSegment,
  ScoutBriefSection,
} from "@/features/scout-brief/types";

export interface ClosedWorldCardInput {
  projectId: string;
  cardVersionId: string;
  title: string;
  hook: string;
  projectType: string;
  claimStatus: string;
  audienceHeatScore?: number;
  marketReadinessScore?: number;
  pathways: Array<{
    id: string;
    label: string;
    format: string;
    rationale: string;
    audience: string;
    risks: string[];
    nextExperiment: string;
  }>;
  evidenceClaims: Array<{
    id: string;
    statement: string;
    sourceIds: string[];
  }>;
  sources: Array<{
    id: string;
    title: string;
    url: string;
  }>;
}

/**
 * Extracts a minimal, untrusted, closed-world representation of the ScoutCard.
 */
export function buildClosedWorldScriptInput(card: ScoutCard): ClosedWorldCardInput {
  return {
    projectId: card.projectId,
    cardVersionId: card.cardVersionId,
    title: card.title,
    hook: card.hook,
    projectType: card.projectType,
    claimStatus: card.claimStatus,
    audienceHeatScore: card.marketViability?.audienceHeatScore,
    marketReadinessScore: card.marketViability?.marketReadinessScore,
    pathways: (card.pathways || []).map((p, idx) => ({
      id: p.id || `pathway-${idx + 1}`,
      label: p.label,
      format: p.format,
      rationale: p.rationale,
      audience: p.audience,
      risks: p.risks || [],
      nextExperiment: `${p.nextExperiment.title} / ${p.nextExperiment.timebox}`,
    })),
    evidenceClaims: (card.evidenceClaims || []).map((e) => ({
      id: e.id,
      statement: e.statement,
      sourceIds: e.sourceIds || [],
    })),
    sources: (card.sourceLedger || []).map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
    })),
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
 * Validates a generated transcript against the strict closed-world ScoutCard rules.
 */
export function validateScoutBriefTranscript(
  transcript: ScoutBriefTranscript,
  card: ScoutCard,
  minWords = 100,
  maxWords = 1500
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!transcript || !Array.isArray(transcript.segments) || transcript.segments.length < 4) {
    errors.push("Transcript must contain at least 4 ordered segments");
    return { valid: false, errors };
  }

  const requiredSections: ScoutBriefSection[] = ["hook", "project", "evidence", "uncertainty", "pathways", "next_move"];
  const presentSections = new Set<string>();

  let scoutTurns = 0;
  let analystTurns = 0;

  const validSourceIds = new Set((card.sourceLedger || []).map((s) => s.id));

  transcript.segments.forEach((seg, idx) => {
    if (seg.order !== idx + 1) {
      errors.push(`Segment at index ${idx} has invalid order ${seg.order}, expected ${idx + 1}`);
    }

    presentSections.add(seg.section);

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

  if (scoutTurns < 2) errors.push(`Scout must speak at least 2 times (found ${scoutTurns})`);
  if (analystTurns < 2) errors.push(`Analyst must speak at least 2 times (found ${analystTurns})`);

  for (const sec of requiredSections) {
    if (!presentSections.has(sec)) {
      errors.push(`Missing required transcript section: ${sec}`);
    }
  }

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
 * Builds the Gemini 3.5 Flash prompt for structured script generation.
 */
export function buildScriptGenerationPrompt(cardInput: ClosedWorldCardInput): string {
  return `You are writing a 3-to-5 minute (500 to 650 words) two-speaker executive audio podcast script called "Scout Brief" for Audience Take.

SPEAKER ROLES:
- Scout: Enthusiastic, cultural insider, introduces the hook, grassroots fandom heat, and YouTube comment resonance.
- Analyst: Rigorous, objective institutional evaluator, breaks down unit economics, Kickstarter figures, trade press validation, risks, and the 3 development pathways.

CLOSED-WORLD RULES:
1. You may ONLY state facts provided in the DATA below. Do NOT invent budget numbers, views, awards, or cast attachments.
2. Every segment must be mapped to the relevant sourceIds and claimIds.
3. You must include all 6 sections in order:
   - "hook": Catchy opening on why this project was scouted and its Audience Heat rating.
   - "project": The story premise, creative vision, and format.
   - "evidence": Quantitative metrics (Kickstarter totals, views, comment sentiment).
   - "uncertainty": Budget realism unit costs (€/min) and production risks.
   - "pathways": The three distinct development pathways in order.
   - "next_move": The recommended bounded next experiment for studio buyers.
4. Keep the tone natural, conversational, and professional.

DATA:
${JSON.stringify(cardInput, null, 2)}
`;
}
