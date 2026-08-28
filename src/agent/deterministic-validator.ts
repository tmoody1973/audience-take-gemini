/**
 * Audience Take — Deterministic AI Proposal Validator
 * Pure TypeScript post-processor ensuring grounded citations, medium concordance,
 * and zero hallucinated hype/commercial certainty before publishing Scout Cards.
 */

import { LLMScoutProposalSchema } from "@/domain/schemas";
import type { ScoutCard, MediumType, EvidenceItem, PathwayHypothesis } from "@/domain";

export interface ValidationResult {
  valid: boolean;
  isPartial: boolean;
  errors: string[];
  warnings: string[];
  sanitizedCard?: Omit<ScoutCard, "id" | "projectId" | "version" | "publishedAt" | "trailerCriticId">;
}

const FORBIDDEN_HYPE_PATTERNS = [
  /\bgreenlight\s*score\b/i,
  /\bguaranteed\s*(hit|commercial|box\s*office|return|success)\b/i,
  /\b(netflix|a24|hbo|disney|apple\s*tv|amazon\s*studios|paramount|warner)\s*(is\s*buying|has\s*acquired|is\s*in\s*talks|is\s*bidding)\b/i,
  /\bcertain\s*commercial\s*success\b/i,
  /\bpredicted\s*roi\b/i,
];

export function checkMediumConcordance(
  medium: MediumType,
  pathways: [PathwayHypothesis, PathwayHypothesis, PathwayHypothesis]
): { concordant: boolean; error?: string } {
  const allPathwayText = pathways
    .map((p) => `${p.title} ${p.mediumFitRationale} ${p.targetAudience}`)
    .join(" ")
    .toLowerCase();

  // Rule 1: A live documentary must not receive animation pathways without explicit hybrid framing
  if (medium === "documentary") {
    if (allPathwayText.includes("animated series") || allPathwayText.includes("animated feature")) {
      if (!allPathwayText.includes("hybrid") && !allPathwayText.includes("animation sequence")) {
        return {
          concordant: false,
          error: "Documentary project received pure animation pathways without hybrid evidence.",
        };
      }
    }
  }

  // Rule 2: A short or proof of concept must have realistic expansion or festival pathways
  if (medium === "proof_of_concept" || medium === "short") {
    const hasGrowthPath = pathways.some(
      (p) =>
        p.title.toLowerCase().includes("expansion") ||
        p.title.toLowerCase().includes("feature") ||
        p.title.toLowerCase().includes("series") ||
        p.title.toLowerCase().includes("festival") ||
        p.title.toLowerCase().includes("proof") ||
        p.mediumFitRationale.toLowerCase().includes("short") ||
        p.mediumFitRationale.toLowerCase().includes("proof")
    );
    if (!hasGrowthPath) {
      return {
        concordant: false,
        error: "Short/Proof of concept lacks pathways addressing expansion or short-form festival strategy.",
      };
    }
  }

  return { concordant: true };
}

export function checkHypeAndHallucinations(text: string): { clean: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const pattern of FORBIDDEN_HYPE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  return { clean: matches.length === 0, matches };
}

export function checkCitationCoverage(
  evidenceLedger: EvidenceItem[],
  whatWeKnow: string[]
): { sufficientCoverage: boolean; ungroundedClaims: string[] } {
  if (evidenceLedger.length === 0) {
    return { sufficientCoverage: false, ungroundedClaims: whatWeKnow };
  }

  const ungrounded: string[] = [];
  const sourceTexts = evidenceLedger.map((e) => `${e.title} ${e.excerpt} ${e.publisher}`.toLowerCase()).join(" ");

  // Simple token overlap / semantic grounding check
  for (const claim of whatWeKnow) {
    const words = claim
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const matchingWords = words.filter((w) => sourceTexts.includes(w));
    const overlapRatio = words.length > 0 ? matchingWords.length / words.length : 0;

    // Must have at least 25% lexical grounding in cited source excerpts
    if (overlapRatio < 0.25 && words.length > 4) {
      ungrounded.push(claim);
    }
  }

  return {
    sufficientCoverage: ungrounded.length <= 1,
    ungroundedClaims: ungrounded,
  };
}

export function validateScoutProposal(
  rawProposal: unknown,
  modelName: string = "gemini-2.5-pro"
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Zod Schema Validation
  const parseResult = LLMScoutProposalSchema.safeParse(rawProposal);
  if (!parseResult.success) {
    return {
      valid: false,
      isPartial: false,
      errors: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      warnings,
    };
  }

  const proposal = parseResult.data;

  // Step 2: Hype & Hallucination Inspection
  const fullText = JSON.stringify(proposal);
  const hypeCheck = checkHypeAndHallucinations(fullText);
  if (!hypeCheck.clean) {
    errors.push(`Disallowed commercial hype or greenlight score detected: ${hypeCheck.matches.join(", ")}`);
  }

  // Step 3: Medium Concordance Check
  const mediumCheck = checkMediumConcordance(proposal.medium, proposal.pathways);
  if (!mediumCheck.concordant) {
    errors.push(mediumCheck.error || "Medium concordance check failed");
  }

  // Step 4: Citation Grounding Check
  const citationCheck = checkCitationCoverage(proposal.evidenceLedger, proposal.whatWeKnow);
  if (!citationCheck.sufficientCoverage) {
    warnings.push(`Some claims have weak source grounding: ${citationCheck.ungroundedClaims.join("; ")}`);
  }

  // Determine if valid or partial
  if (errors.length > 0) {
    // If we have critical errors, we fail validation
    return {
      valid: false,
      isPartial: false,
      errors,
      warnings,
    };
  }

  const isPartial = warnings.length > 0 || proposal.whatWeKnow.length < 3;

  const sanitizedCard = {
    status: isPartial ? ("partial" as const) : ("published" as const),
    whatWeKnow: proposal.whatWeKnow,
    whatWereChecking: proposal.whatWereChecking,
    whyScouted: proposal.whyScouted,
    sourceMedia: proposal.sourceMedia,
    evidenceLedger: proposal.evidenceLedger,
    pathways: proposal.pathways,
    decisionBrief: proposal.decisionBrief,
    industryLens: proposal.industryLens,
    versionProvenance: {
      generatedAt: new Date().toISOString(),
      model: modelName,
      changeReason: "Initial agent research run and deterministic validation pass",
    },
  };

  return {
    valid: true,
    isPartial,
    errors,
    warnings,
    sanitizedCard,
  };
}
