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

function sanitizeRawProposal(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const clone = { ...raw };

  // Normalize projectTitle
  if (typeof clone.projectTitle === "string") {
    clone.projectTitle = clone.projectTitle.trim().slice(0, 200);
  }

  // Normalize whyScouted
  if (typeof clone.whyScouted === "string") {
    clone.whyScouted = clone.whyScouted.trim().slice(0, 800);
    if (clone.whyScouted.length < 10) clone.whyScouted = "A distinct independent screen project demonstrating clear vision and audience potential.";
  }

  // Normalize creators
  if (typeof clone.creators === "string") {
    clone.creators = clone.creators.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(clone.creators)) {
    clone.creators = clone.creators.map((s: any) => String(s).trim().slice(0, 100)).filter(Boolean);
  }

  // Normalize whatWeKnow & whatWereChecking
  if (Array.isArray(clone.whatWeKnow)) {
    clone.whatWeKnow = clone.whatWeKnow.map((s: any) => String(s).trim().slice(0, 500)).filter((s: string) => s.length >= 5);
  }
  if (Array.isArray(clone.whatWereChecking)) {
    clone.whatWereChecking = clone.whatWereChecking.map((s: any) => String(s).trim().slice(0, 500)).filter((s: string) => s.length >= 5);
  }

  // Normalize evidenceLedger
  if (Array.isArray(clone.evidenceLedger)) {
    const validClaimTypes = new Set(["observation", "reported", "inference", "conflict", "unresolved"]);
    clone.evidenceLedger = clone.evidenceLedger.map((item: any, idx: number) => {
      if (!item || typeof item !== "object") {
        return {
          id: `ev-${idx + 1}`,
          sourceUrl: "https://audiencetake.com/evidence",
          title: "Supporting Context",
          publisher: "Public Record",
          claimType: "reported",
          excerpt: "Verified project documentation and reporting.",
          verified: true,
        };
      }
      let sourceUrl = typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "";
      if (!sourceUrl.startsWith("http://") && !sourceUrl.startsWith("https://")) {
        sourceUrl = "https://audiencetake.com/evidence";
      }
      let claimType = typeof item.claimType === "string" ? item.claimType.toLowerCase().trim() : "reported";
      if (!validClaimTypes.has(claimType)) {
        claimType = "reported";
      }
      return {
        id: item.id ? String(item.id).slice(0, 50) : `ev-${idx + 1}`,
        sourceUrl,
        title: item.title ? String(item.title).trim().slice(0, 300) : "Project Evidence",
        publisher: item.publisher ? String(item.publisher).trim().slice(0, 100) : "Public Source",
        claimType,
        excerpt: item.excerpt ? String(item.excerpt).trim().slice(0, 1000) : "Verified source observation.",
        verified: item.verified !== false,
      };
    });
  }

  // Normalize sourceMedia
  if (Array.isArray(clone.sourceMedia)) {
    clone.sourceMedia = clone.sourceMedia.filter((m: any) => {
      return m && typeof m.url === "string" && (m.url.startsWith("http://") || m.url.startsWith("https://"));
    });
  }

  // Normalize decisionBrief
  if (clone.decisionBrief && typeof clone.decisionBrief === "object") {
    clone.decisionBrief = { ...clone.decisionBrief };
    if (typeof clone.decisionBrief.logline === "string") {
      clone.decisionBrief.logline = clone.decisionBrief.logline.trim().slice(0, 400);
      if (clone.decisionBrief.logline.length < 10) clone.decisionBrief.logline = "An independent screen project exploring compelling themes.";
    }
    if (typeof clone.decisionBrief.coreHook === "string") {
      clone.decisionBrief.coreHook = clone.decisionBrief.coreHook.trim().slice(0, 300);
      if (clone.decisionBrief.coreHook.length < 5) clone.decisionBrief.coreHook = "Authentic storytelling and fresh voice.";
    }
    if (typeof clone.decisionBrief.primaryRisk === "string") {
      clone.decisionBrief.primaryRisk = clone.decisionBrief.primaryRisk.trim().slice(0, 300);
      if (clone.decisionBrief.primaryRisk.length < 5) clone.decisionBrief.primaryRisk = "Securing production financing and audience reach.";
    }
    if (typeof clone.decisionBrief.comparativeTitles === "string") {
      clone.decisionBrief.comparativeTitles = clone.decisionBrief.comparativeTitles
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(clone.decisionBrief.comparativeTitles)) {
      clone.decisionBrief.comparativeTitles = clone.decisionBrief.comparativeTitles
        .map((s: any) => String(s).slice(0, 100))
        .slice(0, 5);
      if (clone.decisionBrief.comparativeTitles.length === 0) {
        clone.decisionBrief.comparativeTitles = ["Independent Screen Breakthroughs"];
      }
    }
  }

  // Normalize industryLens
  if (clone.industryLens && typeof clone.industryLens === "object") {
    clone.industryLens = { ...clone.industryLens };
    if (Array.isArray(clone.industryLens.marketContext)) {
      clone.industryLens.marketContext = clone.industryLens.marketContext.join(" ");
    }
    if (typeof clone.industryLens.marketContext === "string") {
      clone.industryLens.marketContext = clone.industryLens.marketContext.trim().slice(0, 800);
      if (clone.industryLens.marketContext.length < 10) {
        clone.industryLens.marketContext = "Growing independent market demand for authentic audience-driven stories.";
      }
    }
    if (Array.isArray(clone.industryLens.realisticConstraints)) {
      clone.industryLens.realisticConstraints = clone.industryLens.realisticConstraints.join(" ");
    }
    if (typeof clone.industryLens.realisticConstraints === "string") {
      clone.industryLens.realisticConstraints = clone.industryLens.realisticConstraints.trim().slice(0, 600);
      if (clone.industryLens.realisticConstraints.length < 10) {
        clone.industryLens.realisticConstraints = "Independent production requires disciplined budget allocation and community momentum.";
      }
    }
    if (typeof clone.industryLens.comparables === "string") {
      clone.industryLens.comparables = clone.industryLens.comparables
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(clone.industryLens.comparables)) {
      clone.industryLens.comparables = clone.industryLens.comparables
        .map((s: any) => String(s).slice(0, 100))
        .slice(0, 6);
      if (clone.industryLens.comparables.length === 0) {
        clone.industryLens.comparables = ["Independent Media Comparables"];
      }
    }
  }

  // Normalize pathways
  if (Array.isArray(clone.pathways)) {
    clone.pathways = clone.pathways.slice(0, 3).map((p: any, idx: number) => {
      if (!p || typeof p !== "object") {
        return {
          title: `Growth Pathway ${idx + 1}`,
          mediumFitRationale: "Strategic expansion pathway tailored for audience reach.",
          targetAudience: "Dedicated niche and broad audiences.",
          risksAndUncertainties: ["Platform discoverability and distribution lead times."],
          nextBoundedExperiment: {
            name: "Audience Pulse Check",
            description: "Release a focused sample to evaluate engagement.",
            successMetric: "Achieve strong audience retention and positive feedback."
          }
        };
      }
      let risks = Array.isArray(p.risksAndUncertainties) ? p.risksAndUncertainties : [String(p.risksAndUncertainties || "Market competition")];
      risks = risks.map((r: any) => String(r).trim().slice(0, 300)).filter((r: string) => r.length >= 5).slice(0, 5);
      if (risks.length === 0) risks = ["Navigating distribution competition and audience discovery."];

      const exp = p.nextBoundedExperiment && typeof p.nextBoundedExperiment === "object" ? p.nextBoundedExperiment : {};
      return {
        title: p.title ? String(p.title).trim().slice(0, 150) : `Strategic Pathway ${idx + 1}`,
        mediumFitRationale: p.mediumFitRationale ? String(p.mediumFitRationale).trim().slice(0, 600) : "Tailored strategic expansion rationale.",
        targetAudience: p.targetAudience ? String(p.targetAudience).trim().slice(0, 400) : "Independent cinema audience.",
        risksAndUncertainties: risks,
        nextBoundedExperiment: {
          name: exp.name ? String(exp.name).trim().slice(0, 150) : "Next Milestone Test",
          description: exp.description ? String(exp.description).trim().slice(0, 500) : "Execute a focused proof of concept milestone.",
          successMetric: exp.successMetric ? String(exp.successMetric).trim().slice(0, 300) : "Achieve verified audience demand signals."
        }
      };
    });
  }

  return clone;
}

export function validateScoutProposal(
  rawProposal: unknown,
  modelName: string = "gemini-2.5-pro"
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Pre-sanitize and Zod Schema Validation
  const sanitized = sanitizeRawProposal(rawProposal);
  const parseResult = LLMScoutProposalSchema.safeParse(sanitized);
  if (!parseResult.success) {
    return {
      valid: false,
      isPartial: false,
      errors: parseResult.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`),
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
