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
  quarantinedEvidence?: Array<{ rawItem: unknown; reason: string }>;
  sanitizedCard?: Omit<ScoutCard, "id" | "projectId" | "version" | "publishedAt" | "trailerCriticId">;
}

const STRICT_HYPE_PATTERNS = [
  /\bgreenlight\s*score\b/i,
  /\bguaranteed\s*(hit|commercial|box\s*office|return|success)\b/i,
  /\bcertain\s*commercial\s*success\b/i,
  /\bpredicted\s*roi\b/i,
];

const BUYER_ACQUISITION_PATTERNS = [
  { regex: /\b(netflix)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "netflix" },
  { regex: /\b(a24)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "a24" },
  { regex: /\b(hbo)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "hbo" },
  { regex: /\b(disney)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "disney" },
  { regex: /\b(apple\s*tv|apple)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "apple" },
  { regex: /\b(amazon\s*studios|amazon)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "amazon" },
  { regex: /\b(paramount)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "paramount" },
  { regex: /\b(warner)\b.{0,60}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy)\b/i, buyer: "warner" },
  { regex: /\b(buying|acquired|acquisition|in\s+talks\s+with|bidding\s+on|deal\s+with)\b.{0,60}?\s+(netflix|a24|hbo|disney|apple|amazon|paramount|warner)\b/i, buyer: "any" },
];

export const NEGATION_PATTERNS = [
  /\b(not|never|neither|nor|no|denies|denied|unconfirmed|false|refuted|untrue|disputed)\b/i,
  /\bhasn't\b/i,
  /\bdidn't\b/i,
  /\bwasn't\b/i,
  /\bisn't\b/i,
  /\bwon't\b/i,
];

export function hasNegationContradiction(claim: string, passage: string): boolean {
  const normPassage = passage.toLowerCase();
  const normClaim = claim.toLowerCase();

  const claimHasNegation = NEGATION_PATTERNS.some((p) => p.test(normClaim));
  const passageHasNegation = NEGATION_PATTERNS.some((p) => p.test(normPassage));

  if (!claimHasNegation && passageHasNegation) {
    const claimKeywords = normClaim
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !COMMON_STOPWORDS.has(w));

    for (const pattern of NEGATION_PATTERNS) {
      const match = normPassage.match(pattern);
      if (match && match.index !== undefined) {
        const start = Math.max(0, match.index - 80);
        const end = Math.min(normPassage.length, match.index + 80);
        const windowText = normPassage.slice(start, end);
        const matchedInWindow = claimKeywords.filter((kw) => {
          const stem = kw.length > 5 ? kw.replace(/(ing|ed|es|s)$/, "") : kw;
          return windowText.includes(kw) || (stem.length >= 4 && windowText.includes(stem));
        });
        if (matchedInWindow.length >= 2) {
          return true;
        }
      }
    }
  }
  return false;
}

const COMMON_STOPWORDS = new Set([
  "this", "that", "with", "from", "have", "been", "were", "what", "which",
  "will", "would", "about", "there", "their", "where", "into", "over", "more",
  "most", "some", "such", "than", "them", "then", "when", "also", "both",
  "each", "other", "after", "before", "while", "during", "project", "independent"
]);

export function checkCrossSectionContradictions(proposal: any): {
  hasContradiction: boolean;
  contradictions: string[];
  qualifications: Array<{ field: string; from: string; to: string }>;
} {
  const contradictions: string[] = [];
  const qualifications: Array<{ field: string; from: string; to: string }> = [];

  const triageSummary = String(proposal.decisionBrief?.triageSummary || "");
  const materialUncertainty = String(proposal.decisionBrief?.materialUncertainty || "");
  const whatWereChecking = Array.isArray(proposal.whatWereChecking) ? proposal.whatWereChecking.join(" ") : "";
  const whatWeKnow = Array.isArray(proposal.whatWeKnow) ? proposal.whatWeKnow.join(" ") : "";

  // 1. Rights Contradiction: Unencumbered vs Unconfirmed Chain of Title
  const rightsFreePattern = /\b((?:feature\s+|commercial\s+)?rights\s+(?:is|are\s+)?unencumbered|commercial\s+rights\s+free|rights\s+(?:is|are\s+)?available|unencumbered\s+rights)\b/i;
  const rightsUnconfirmedPattern = /\b(chain[\s-]*of[\s-]*title[^\w]*(?:is|are\s+)?unconfirmed|rights\s+(?:is|are\s+)?unconfirmed|rights\s+(?:is|are\s+)?unknown|underlying\s+rights[^\w]*(?:is|are\s+)?unconfirmed|chain[\s-]*of[\s-]*title\s+unknown)\b/i;

  const claimsRightsFree = rightsFreePattern.test(triageSummary) || rightsFreePattern.test(whatWeKnow);
  const claimsRightsUnconfirmed = rightsUnconfirmedPattern.test(materialUncertainty) || rightsUnconfirmedPattern.test(whatWereChecking) || rightsUnconfirmedPattern.test(triageSummary);

  if (claimsRightsFree && claimsRightsUnconfirmed) {
    if (rightsFreePattern.test(triageSummary)) {
      qualifications.push({
        field: "decisionBrief.triageSummary",
        from: "rights unencumbered",
        to: "rights pending chain-of-title confirmation",
      });
      contradictions.push(
        "Rights contradiction: Commercial rights claimed unencumbered while chain-of-title is unconfirmed. Qualified triageSummary."
      );
    } else {
      contradictions.push(
        "Rights contradiction: Commercial rights claimed unencumbered in factual sections while chain-of-title is unconfirmed."
      );
    }
  }

  // 2. Format Contradiction: Short claimed as completed feature
  if (proposal.medium === "short" || proposal.medium === "proof_of_concept") {
    const featureCompletePattern = /\b(completed\s+feature\s+film|released\s+feature\s+film|feature-length\s+release)\b/i;
    if (featureCompletePattern.test(whatWeKnow)) {
      contradictions.push(
        "Format contradiction: Project medium is short/proof_of_concept but whatWeKnow claims an already completed feature film."
      );
    }
  }

  // 3. Ownership Contradiction: Unclaimed status conflated with unowned
  const unownedPattern = /\b(project\s+is\s+unowned|work\s+is\s+unowned|public\s+domain\s+work)\b/i;
  if (unownedPattern.test(whatWeKnow)) {
    contradictions.push(
      "Ownership contradiction: Unclaimed platform status conflated with unowned or public domain rights."
    );
  }

  return {
    hasContradiction: contradictions.length > 0,
    contradictions,
    qualifications,
  };
}

export function checkMediumConcordance(
  medium: MediumType,
  pathways: PathwayHypothesis[]
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

  // Rule 2: A short or proof of concept must have realistic expansion, festival, screening, or recognition pathways
  if (medium === "proof_of_concept" || medium === "short") {
    const hasRealisticPath = pathways.some(
      (p) =>
        p.title.toLowerCase().includes("expansion") ||
        p.title.toLowerCase().includes("feature") ||
        p.title.toLowerCase().includes("series") ||
        p.title.toLowerCase().includes("festival") ||
        p.title.toLowerCase().includes("proof") ||
        p.title.toLowerCase().includes("screening") ||
        p.title.toLowerCase().includes("recognition") ||
        p.title.toLowerCase().includes("showcase") ||
        p.mediumFitRationale.toLowerCase().includes("short") ||
        p.mediumFitRationale.toLowerCase().includes("festival") ||
        p.mediumFitRationale.toLowerCase().includes("screening") ||
        p.mediumFitRationale.toLowerCase().includes("proof")
    );
    if (!hasRealisticPath) {
      return {
        concordant: false,
        error: "Short/Proof of concept lacks pathways addressing expansion, festival, screening, or recognition strategy.",
      };
    }
  }

  return { concordant: true };
}

export function isNominatorEvidence(ev: any): boolean {
  if (!ev) return false;
  if (ev.isNominatorLead === true) return true;
  if (ev.origin === "nominator") return true;
  if (typeof ev.id === "string" && (ev.id === "ev-nominator" || ev.id.startsWith("ev-nominator-") || ev.id.startsWith("ev-nominator"))) return true;
  if (typeof ev.publisher === "string" && ev.publisher.trim().toLowerCase() === "nominator") return true;
  return false;
}

export function checkHypeAndHallucinations(
  text: string,
  evidenceLedger?: EvidenceItem[]
): { clean: boolean; matches: string[] } {
  const matches: string[] = [];

  for (const pattern of STRICT_HYPE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }

  for (const item of BUYER_ACQUISITION_PATTERNS) {
    const match = text.match(item.regex);
    if (match) {
      // Check if evidenceLedger has verified trade coverage supporting this buyer report without negation
      const isSourcedInEvidence = Boolean(
        evidenceLedger?.some((ev) => {
          if (!ev.verified || isNominatorEvidence(ev) || ev.claimType === "unresolved") {
            return false;
          }
          const passage = `${ev.title} ${ev.excerpt} ${ev.publisher}`.toLowerCase();
          const mentionsBuyer = item.buyer === "any"
            ? /(netflix|a24|hbo|disney|apple|amazon|paramount|warner)/i.test(passage)
            : passage.includes(item.buyer);
          const mentionsAcquisition = (
            passage.includes("acquire") ||
            passage.includes("buying") ||
            passage.includes("bought") ||
            passage.includes("talks") ||
            passage.includes("deal") ||
            passage.includes("bid")
          );
          if (!mentionsBuyer || !mentionsAcquisition) return false;
          const targetBuyer = item.buyer === "any"
            ? (passage.match(/(netflix|a24|hbo|disney|apple|amazon|paramount|warner)/i)?.[0] || "buyer")
            : item.buyer;
          return !hasNegationContradiction(`${targetBuyer} has acquired the project`, passage);
        })
      );
      if (!isSourcedInEvidence) {
        matches.push(match[0]);
      }
    }
  }

  return { clean: matches.length === 0, matches };
}

export function isBuyerOrHypeClaim(claim: string): boolean {
  return (
    BUYER_ACQUISITION_PATTERNS.some((p) => p.regex.test(claim)) ||
    STRICT_HYPE_PATTERNS.some((p) => p.test(claim)) ||
    /\b\$\d+[\d,]*\s*(million|m\b|billion|b\b)/i.test(claim)
  );
}

export function checkCitationCoverage(
  evidenceLedger: EvidenceItem[],
  whatWeKnow: string[]
): { sufficientCoverage: boolean; ungroundedClaims: string[]; groundedClaims: string[] } {
  // Exclude nominator leads and unresolved placeholders from ever grounding claims
  const nonNominatorEvidence = (evidenceLedger || []).filter(
    (ev) => !isNominatorEvidence(ev) && ev.claimType !== "unresolved"
  );

  if (nonNominatorEvidence.length === 0) {
    return { sufficientCoverage: false, ungroundedClaims: whatWeKnow, groundedClaims: [] };
  }

  const ungrounded: string[] = [];
  const grounded: string[] = [];

  for (const claim of whatWeKnow) {
    const cleanClaim = claim.toLowerCase().replace(/[^\w\s-]/g, " ");
    const words = cleanClaim
      .split(/\s+/)
      .filter((w) => w.length > 3 && !COMMON_STOPWORDS.has(w));

    // Buyer acquisitions and commercial hype require strictly verified evidence
    const requiresVerified = isBuyerOrHypeClaim(claim);
    const candidateEvidence = requiresVerified
      ? nonNominatorEvidence.filter((ev) => ev.verified === true)
      : nonNominatorEvidence;

    let hasPassageSupport = false;

    for (const ev of candidateEvidence) {
      const passage = `${ev.title} ${ev.excerpt} ${ev.publisher}`.toLowerCase().replace(/[^\w\s-]/g, " ");

      // Check negation first! A negating source cannot support an affirmative claim
      if (hasNegationContradiction(claim, passage)) {
        continue;
      }

      // 1. Exact phrase / substring match
      if (cleanClaim.length >= 20 && passage.includes(cleanClaim.slice(0, 30))) {
        hasPassageSupport = true;
        break;
      }
      if (ev.excerpt && ev.excerpt.length >= 20 && cleanClaim.includes(ev.excerpt.slice(0, 30).toLowerCase())) {
        hasPassageSupport = true;
        break;
      }

      // 2. Significant token overlap in this single passage
      if (words.length > 0) {
        let matchCount = 0;
        for (const w of words) {
          const stem = w.length > 5 ? w.replace(/(ing|ed|es|s)$/, "") : w;
          if (passage.includes(w) || (stem.length >= 4 && passage.includes(stem))) {
            matchCount++;
          }
        }
        const ratio = matchCount / words.length;
        if ((matchCount >= 2 && ratio >= 0.35) || matchCount >= 3) {
          hasPassageSupport = true;
          break;
        }
      }
    }

    if (hasPassageSupport) {
      grounded.push(claim);
    } else {
      ungrounded.push(claim);
    }
  }

  return {
    sufficientCoverage: ungrounded.length === 0,
    ungroundedClaims: ungrounded,
    groundedClaims: grounded,
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

  // Normalize evidenceLedger: quarantine malformed items, preserve provenance, reject future retrieval dates
  const quarantinedEvidence: Array<{ rawItem: unknown; reason: string }> = [];
  if (Array.isArray(clone.evidenceLedger)) {
    const validClaimTypes = new Set(["observation", "reported", "inference", "conflict", "unresolved"]);
    const validItems: any[] = [];
    const nowMs = Date.now() + 60_000; // 60s tolerance for clock skew

    for (let idx = 0; idx < clone.evidenceLedger.length; idx++) {
      const item = clone.evidenceLedger[idx];
      if (!item || typeof item !== "object") {
        quarantinedEvidence.push({ rawItem: item, reason: "Evidence item is null or not an object." });
        continue;
      }
      const sourceUrl = typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "";
      if (!sourceUrl.startsWith("http://") && !sourceUrl.startsWith("https://")) {
        quarantinedEvidence.push({ rawItem: item, reason: `Invalid or missing URL scheme in sourceUrl: "${sourceUrl}".` });
        continue;
      }
      if (item.retrievedAt) {
        const retrievedDate = new Date(item.retrievedAt);
        if (!isNaN(retrievedDate.getTime()) && retrievedDate.getTime() > nowMs) {
          quarantinedEvidence.push({ rawItem: item, reason: `Invalid future retrieval timestamp: ${item.retrievedAt}.` });
          continue;
        }
      }
      let claimType = typeof item.claimType === "string" ? item.claimType.toLowerCase().trim() : "reported";
      if (!validClaimTypes.has(claimType)) {
        claimType = "reported";
      }
      validItems.push({
        id: item.id ? String(item.id).slice(0, 50) : `ev-${idx + 1}`,
        sourceUrl,
        title: item.title ? String(item.title).trim().slice(0, 300) : "Project Evidence",
        publisher: item.publisher ? String(item.publisher).trim().slice(0, 100) : "Public Source",
        claimType,
        excerpt: item.excerpt ? String(item.excerpt).trim().slice(0, 1000) : "Source observation.",
        verified: item.verified === true,
        timestamp: item.timestamp ? String(item.timestamp) : undefined,
        publishedAt: item.publishedAt !== undefined ? item.publishedAt : null,
        retrievedAt: item.retrievedAt ? String(item.retrievedAt) : undefined,
        supportingClaimIds: Array.isArray(item.supportingClaimIds)
          ? item.supportingClaimIds.map((c: any) => String(c)).slice(0, 20)
          : undefined,
        isNominatorLead: item.isNominatorLead === true || isNominatorEvidence(item),
        origin: (item.origin as any) || (isNominatorEvidence(item) ? "nominator" : undefined),
      });
    }
    clone.evidenceLedger = validItems;
    clone._quarantinedEvidence = quarantinedEvidence;
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
    }
    if (typeof clone.decisionBrief.coreHook === "string") {
      clone.decisionBrief.coreHook = clone.decisionBrief.coreHook.trim().slice(0, 300);
    }
    if (typeof clone.decisionBrief.primaryRisk === "string") {
      clone.decisionBrief.primaryRisk = clone.decisionBrief.primaryRisk.trim().slice(0, 300);
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
        .filter(Boolean)
        .slice(0, 5);
    }
    if (typeof clone.decisionBrief.triageSummary === "string") {
      clone.decisionBrief.triageSummary = clone.decisionBrief.triageSummary.trim().slice(0, 600);
    }
    if (typeof clone.decisionBrief.materialUncertainty === "string") {
      clone.decisionBrief.materialUncertainty = clone.decisionBrief.materialUncertainty.trim().slice(0, 400);
    }
    if (typeof clone.decisionBrief.nextDiligenceStep === "string") {
      clone.decisionBrief.nextDiligenceStep = clone.decisionBrief.nextDiligenceStep.trim().slice(0, 400);
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
    }
    if (Array.isArray(clone.industryLens.realisticConstraints)) {
      clone.industryLens.realisticConstraints = clone.industryLens.realisticConstraints.join(" ");
    }
    if (typeof clone.industryLens.realisticConstraints === "string") {
      clone.industryLens.realisticConstraints = clone.industryLens.realisticConstraints.trim().slice(0, 600);
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
        .filter(Boolean)
        .slice(0, 6);
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
          },
          prerequisites: ["Audience discovery milestones"],
          owner: "Creator / Producer",
          blockers: ["Initial distribution commitments"]
        };
      }
      let risks = Array.isArray(p.risksAndUncertainties) ? p.risksAndUncertainties : [String(p.risksAndUncertainties || "Market competition")];
      risks = risks.map((r: any) => String(r).trim().slice(0, 300)).filter((r: string) => r.length >= 5).slice(0, 5);
      if (risks.length === 0) risks = ["Navigating distribution competition and audience discovery."];

      const exp = p.nextBoundedExperiment && typeof p.nextBoundedExperiment === "object" ? p.nextBoundedExperiment : {};
      
      const prerequisites = Array.isArray(p.prerequisites)
        ? p.prerequisites.map((pr: any) => String(pr).trim().slice(0, 200)).filter((pr: string) => pr.length > 0).slice(0, 5)
        : undefined;
      const owner = typeof p.owner === "string" && p.owner.trim() ? p.owner.trim().slice(0, 100) : undefined;
      const blockers = Array.isArray(p.blockers)
        ? p.blockers.map((b: any) => String(b).trim().slice(0, 200)).filter((b: string) => b.length > 0).slice(0, 5)
        : undefined;

      let title = p.title ? String(p.title).trim().slice(0, 150) : `Strategic Pathway ${idx + 1}`;
      if (title.length < 5) title = `Strategic Pathway ${idx + 1}`;

      let mediumFitRationale = p.mediumFitRationale ? String(p.mediumFitRationale).trim().slice(0, 600) : "Tailored strategic expansion rationale.";
      if (mediumFitRationale.length < 10) mediumFitRationale = "Tailored strategic expansion rationale.";

      let targetAudience = p.targetAudience ? String(p.targetAudience).trim().slice(0, 400) : "Independent cinema audience.";
      if (targetAudience.length < 5) targetAudience = "Independent cinema audience.";

      let expName = exp.name ? String(exp.name).trim().slice(0, 150) : "Next Milestone Test";
      if (expName.length < 3) expName = "Next Milestone Test";

      let expDesc = exp.description ? String(exp.description).trim().slice(0, 500) : "Execute a focused proof of concept milestone.";
      if (expDesc.length < 10) expDesc = "Execute a focused proof of concept milestone.";

      let expMetric = exp.successMetric ? String(exp.successMetric).trim().slice(0, 300) : "Achieve verified audience demand signals.";
      if (expMetric.length < 5) expMetric = "Achieve verified audience demand signals.";

      return {
        title,
        mediumFitRationale,
        targetAudience,
        risksAndUncertainties: risks,
        nextBoundedExperiment: {
          name: expName,
          description: expDesc,
          successMetric: expMetric,
        },
        prerequisites,
        owner,
        blockers,
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
  const quarantinedEvidence: Array<{ rawItem: unknown; reason: string }> = sanitized?._quarantinedEvidence || [];
  if (sanitized && typeof sanitized === "object") {
    delete sanitized._quarantinedEvidence;
  }
  if (quarantinedEvidence.length > 0) {
    warnings.push(`Quarantined ${quarantinedEvidence.length} invalid evidence item(s): ${quarantinedEvidence.map((q) => q.reason).join("; ")}`);
  }

  const parseResult = LLMScoutProposalSchema.safeParse(sanitized);
  if (!parseResult.success) {
    return {
      valid: false,
      isPartial: false,
      errors: parseResult.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`),
      warnings,
      quarantinedEvidence: quarantinedEvidence.length > 0 ? quarantinedEvidence : undefined,
    };
  }

  const proposal = parseResult.data;

  // Step 2: Cross-Section Contradiction Inspection & Rights Qualification
  const contradictionCheck = checkCrossSectionContradictions(proposal);
  if (contradictionCheck.qualifications.length > 0) {
    if (proposal.decisionBrief?.triageSummary) {
      proposal.decisionBrief.triageSummary = proposal.decisionBrief.triageSummary
        .replace(/feature rights unencumbered/gi, "feature rights pending chain-of-title confirmation")
        .replace(/rights unencumbered/gi, "rights pending chain-of-title confirmation")
        .replace(/commercial rights free/gi, "commercial rights pending confirmation");
    }
    warnings.push(...contradictionCheck.contradictions);
  }
  // Check for any unhandled format or ownership contradictions
  const criticalContradictions = contradictionCheck.contradictions.filter(
    (c) => c.includes("Format contradiction") || c.includes("Ownership contradiction")
  );
  if (criticalContradictions.length > 0) {
    errors.push(...criticalContradictions);
  }

  // Step 3: Hype & Hallucination Inspection (distinguishing sourced trade reporting)
  const fullText = JSON.stringify(proposal);
  const hypeCheck = checkHypeAndHallucinations(fullText, proposal.evidenceLedger);
  if (!hypeCheck.clean) {
    errors.push(`Disallowed commercial hype or ungrounded buyer claim detected: ${hypeCheck.matches.join(", ")}`);
  }

  // Step 4: Medium Concordance Check
  const mediumCheck = checkMediumConcordance(proposal.medium, proposal.pathways);
  if (!mediumCheck.concordant) {
    errors.push(mediumCheck.error || "Medium concordance check failed");
  }

  // Step 5: Passage-Specific Citation Grounding Check
  const citationCheck = checkCitationCoverage(proposal.evidenceLedger, proposal.whatWeKnow);
  let withheldClaims: string[] = [];
  if (!citationCheck.sufficientCoverage) {
    // Filter ungrounded claims out of factual section whatWeKnow
    const supportedWhatWeKnow = proposal.whatWeKnow.filter(
      (c) => !citationCheck.ungroundedClaims.includes(c)
    );
    withheldClaims = citationCheck.ungroundedClaims;
    proposal.whatWereChecking = [
      ...proposal.whatWereChecking,
      ...citationCheck.ungroundedClaims.map((c) => `Pending verification: ${c}`),
    ];
    if (supportedWhatWeKnow.length < 2) {
      errors.push(
        `Insufficient passage grounding: whatWeKnow contains ungrounded factual claims with fewer than 2 supported facts remaining (${citationCheck.ungroundedClaims.join("; ")}).`
      );
    } else {
      proposal.whatWeKnow = supportedWhatWeKnow;
      warnings.push(
        `Filtered ${citationCheck.ungroundedClaims.length} ungrounded claim(s) from whatWeKnow into whatWereChecking: ${citationCheck.ungroundedClaims.join("; ")}`
      );
    }
  }

  // Step 5b: Cross-Surface Factual Assertion Grounding Check
  const publicSurfaces: Array<{ field: string; text: string }> = [
    { field: "whyScouted", text: proposal.whyScouted || "" },
    { field: "decisionBrief.logline", text: proposal.decisionBrief?.logline || "" },
    { field: "decisionBrief.triageSummary", text: proposal.decisionBrief?.triageSummary || "" },
    { field: "industryLens.marketContext", text: proposal.industryLens?.marketContext || "" },
  ];

  for (const surface of publicSurfaces) {
    if (!surface.text) continue;

    // A. Affirmative award or festival selection/honor assertion check
    // Distinguish affirmative project accolades from benign geographic/ecosystem mentions
    const affirmativeAwardRegex = /\b(won|winner|winning|best\s+director|best\s+actor|best\s+actress|best\s+film|best\s+short|grand\s+jury\s+prize|jury\s+award|audience\s+award|palme\s+d'or|golden\s+lion|silver\s+bear|laurel|selected\s+(?:for|by|at)|official\s+selection|premiered\s+at|screened\s+at|nominated\s+for|nominee)\b/i;
    const festivalBodyRegex = /\b(sundance|cannes|oscars?|academy\s+awards?|bafta|emmys?|golden\s+globes?|sxsw|venice|berlin|tribeca|annecy|clermont-ferrand|toronto|tiff|telluride)\b/i;

    if (affirmativeAwardRegex.test(surface.text) && festivalBodyRegex.test(surface.text)) {
      const festivalMatch = surface.text.match(festivalBodyRegex)?.[0] || "festival";
      const isSourced = proposal.evidenceLedger?.some((ev: any) => {
        if (!ev.verified || isNominatorEvidence(ev) || ev.claimType === "unresolved") return false;
        const evText = `${ev.title || ""} ${ev.excerpt || ""} ${ev.publisher || ""}`.toLowerCase();
        const mentionsFestival = evText.includes(festivalMatch.toLowerCase());
        const mentionsHonor = /\b(won|winner|award|prize|laurel|selection|selected|premiered|screened|nominee|nominated|competition)\b/i.test(evText);
        const hasNegativeContext = /\b(deadline|no selections|not selected|unannounced|pending announcement|submissions?)\b/i.test(evText);
        return mentionsFestival && mentionsHonor && !hasNegativeContext && !hasNegationContradiction(`selected or won award at ${festivalMatch}`, evText);
      });

      if (!isSourced) {
        errors.push(
          `Ungrounded award or festival claim in ${surface.field}: "${festivalMatch}" accolade is not attested by verified evidence in evidenceLedger.`
        );
      }
    }

    // B. Affirmative talent/cast attachment check
    const talentAttachmentRegexes = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:stars\b|is\s+starring\b|joined\s+the\s+cast\b|is\s+attached\s+to\s+star\b)/g,
      /\b(?:stars?|starring|featuring|joined\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    ];
    for (const regex of talentAttachmentRegexes) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(surface.text)) !== null) {
        const talentName = match[1];
        if (
          proposal.projectTitle?.toLowerCase().includes(talentName.toLowerCase()) ||
          proposal.creators?.some((c: string) => c.toLowerCase().includes(talentName.toLowerCase()))
        ) {
          continue;
        }
        const isTalentAttested = proposal.evidenceLedger?.some((ev: any) => {
          if (!ev.verified || isNominatorEvidence(ev) || ev.claimType === "unresolved") return false;
          const evText = `${ev.title || ""} ${ev.excerpt || ""} ${ev.publisher || ""}`.toLowerCase();
          return evText.includes(talentName.toLowerCase());
        });
        if (!isTalentAttested) {
          errors.push(
            `Ungrounded talent or cast attachment in ${surface.field}: "${talentName}" is not attested by verified evidence in evidenceLedger.`
          );
        }
      }
    }

    // C. Check for ungrounded buyer acquisition or commercial market hype
    const hypeCheck = checkHypeAndHallucinations(surface.text, proposal.evidenceLedger);
    if (!hypeCheck.clean) {
      for (const m of hypeCheck.matches) {
        errors.push(`Ungrounded acquisition or market hype in ${surface.field}: "${m}".`);
      }
    }
  }

  // Also check pathways for ungrounded buyer acquisitions or awards
  if (Array.isArray(proposal.pathways)) {
    for (let i = 0; i < proposal.pathways.length; i++) {
      const p = proposal.pathways[i];
      const pText = `${p.title || ""} ${p.mediumFitRationale || ""} ${p.targetAudience || ""}`;
      const hype = checkHypeAndHallucinations(pText, proposal.evidenceLedger);
      if (!hype.clean) {
        for (const m of hype.matches) {
          errors.push(`Ungrounded acquisition or market hype in pathway[${i}]: "${m}".`);
        }
      }
    }
  }

  // Determine if valid or failed
  if (errors.length > 0) {
    return {
      valid: false,
      isPartial: false,
      errors,
      warnings,
      quarantinedEvidence: quarantinedEvidence.length > 0 ? quarantinedEvidence : undefined,
    };
  }

  const isPartial = warnings.length > 0 || proposal.whatWeKnow.length < 3 || withheldClaims.length > 0;

  const gateReceipt = {
    passed: true,
    approvedClaimsCount: proposal.whatWeKnow.length,
    withheldClaimsCount: withheldClaims.length,
    contradictions: contradictionCheck.contradictions,
    policyVersion: "2026.1",
    verifiedAt: new Date().toISOString(),
  };

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
      gateReceipt,
    },
  };

  return {
    valid: true,
    isPartial,
    errors,
    warnings,
    quarantinedEvidence: quarantinedEvidence.length > 0 ? quarantinedEvidence : undefined,
    sanitizedCard,
  };
}

export function verifyPublicationGate(candidate: unknown): {
  passed: boolean;
  errors: string[];
  warnings: string[];
  sanitizedCard?: ScoutCard;
} {
  const cand = (candidate && typeof candidate === "object" ? { ...candidate } : {}) as any;
  // If candidate is a ScoutCard without top-level project identity fields, fill defaults
  if (!cand.projectTitle) cand.projectTitle = cand.title || "Project";
  if (!cand.medium) cand.medium = "feature";
  if (!cand.stage) cand.stage = "production";
  if (!cand.creators) cand.creators = [];
  if (!cand.whyScouted) cand.whyScouted = "Monitored screen project update verified by Audience Take.";
  if (!cand.whatWereChecking || cand.whatWereChecking.length === 0) cand.whatWereChecking = ["Monitoring ongoing production milestones"];

  const result = validateScoutProposal(cand);
  if (!result.valid || !result.sanitizedCard) {
    return {
      passed: false,
      errors: result.errors,
      warnings: result.warnings,
    };
  }
  const card: ScoutCard = {
    id: cand.id || `card-${cand.projectId || "project"}-v${cand.version || 1}`,
    projectId: cand.projectId || "project",
    version: cand.version || 1,
    ...result.sanitizedCard,
    trailerCriticId: cand.trailerCriticId || null,
  };
  return {
    passed: true,
    errors: [],
    warnings: result.warnings,
    sanitizedCard: card,
  };
}

export const validateProposal = validateScoutProposal;
