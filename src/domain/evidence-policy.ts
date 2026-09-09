/**
 * Audience Take — Shared Evidence Policy & Verification Contract
 * 
 * Provides unified source health, passage provenance, and claim support rules
 * shared across initial agent research, publication gates, data adapters,
 * corrections, and derivative briefing freshness.
 */

import { createHash } from "node:crypto";

export type SourceHealthState =
  | "available"
  | "not_found"
  | "restricted"
  | "timed_out"
  | "fetch_error"
  | "soft_error"
  | "not_checked";

export type ClaimSupportStatus =
  | "supported"
  | "qualified"
  | "conflicting"
  | "unsupported"
  | "inference"
  | "unassessed";

export interface SourceRetrievalReceipt {
  sourceId: string;
  url: string;
  finalUrl: string;
  attemptedAt: string;
  outcome: "success" | "http_error" | "timeout" | "redirect_blocked" | "soft_404" | "network_error" | "untested";
  httpStatus?: number;
  contentOrigin: "direct_fetch" | "parallel_extract" | "parallel_search" | "snapshot" | "legacy_seed";
  contentHash?: string;
  errorDetail?: string;
}

export interface EvidencePassage {
  id: string;
  sourceId: string;
  exactText: string;
  context?: string;
  isSubstantive: boolean;
  qualityNotes?: string[];
}

export interface ClaimAssessment {
  claimId: string;
  statement: string;
  projectId: string;
  entityMatch: boolean;
  temporalMatch?: boolean;
  supportingPassageIds: string[];
  status: ClaimSupportStatus;
  qualification: string | null;
  assessor: string;
  policyVersion: string;
  assessedInputsHash: string;
}

// Patterns that indicate soft-404, error pages, cookie walls, or navigation boilerplate
const SOFT_ERROR_PATTERNS = [
  /\b(?:404\s+not\s+found|page\s+not\s+found|error\s+404)\b/i,
  /\b(?:the\s+page\s+you\s+(?:requested|are\s+looking\s+for)\s+(?:could\s+not\s+be\s+found|does\s+not\s+exist))\b/i,
  /\b(?:this\s+article\s+is\s+no\s+longer\s+available|content\s+has\s+been\s+removed)\b/i,
  /\b(?:oops!|whoops!)\s+page\s+not\s+found\b/i,
];

const BOILERPLATE_PATTERNS = [
  /\b(?:we\s+use\s+cookies\s+to|by\s+continuing\s+to\s+use\s+this\s+site|accept\s+all\s+cookies|cookie\s+policy)\b/i,
  /\b(?:subscribe\s+now\s+to\s+(?:read|continue)|sign\s+in\s+to\s+your\s+account\s+to\s+read)\b/i,
  /\b(?:all\s+rights\s+reserved\.?\s*privacy\s+policy\s*\|\s*terms\s+of\s+service)\b/i,
  /\b(?:skip\s+to\s+main\s+content|search\s+query\s+show\s+search)\b/i,
];

/**
 * Detects whether captured text is a soft-404 error page, cookie banner, or navigation fragment.
 */
export function detectBoilerplateOrSoftError(
  text: string,
  title?: string
): { isSoftError: boolean; isBoilerplate: boolean; reason?: string } {
  const trimmed = (text || "").trim();
  const header = (title || "").trim();

  // Check title for explicit 404/not found
  if (SOFT_ERROR_PATTERNS.some((p) => p.test(header))) {
    return { isSoftError: true, isBoilerplate: true, reason: `Title matches 404/error pattern: "${header}"` };
  }

  // Check text body
  if (trimmed.length < 40 && SOFT_ERROR_PATTERNS.some((p) => p.test(trimmed))) {
    return { isSoftError: true, isBoilerplate: true, reason: `Content matches soft 404 pattern: "${trimmed}"` };
  }

  if (BOILERPLATE_PATTERNS.some((p) => p.test(trimmed))) {
    return { isSoftError: false, isBoilerplate: true, reason: "Content matches cookie, login, or navigation boilerplate" };
  }

  return { isSoftError: false, isBoilerplate: false };
}

/**
 * Normalizes passage text to preserve substantive sentences and strip excess whitespace.
 */
export function cleanPassageText(text: string): string {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Computes a hash of assessed claim inputs to verify that neither the statement
 * nor the supporting passage mutated after assessment.
 */
export function computeAssessedInputsHash(
  projectId: string,
  statement: string,
  passages: Array<{ id: string; text: string }>
): string {
  const normalized = {
    projectId: projectId.trim(),
    statement: statement.trim().toLowerCase(),
    passages: passages
      .map((p) => ({ id: p.id, text: cleanPassageText(p.text).toLowerCase() }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

/**
 * Assesses whether a passage supports an assertion with project entity match,
 * preventing unrelated articles (e.g. 2014 films or separate filmmaker biographies)
 * from establishing ungrounded claims.
 */
export function evaluatePassageSupport(options: {
  statement: string;
  passageText: string;
  targetProjectTitle: string;
  targetYear?: number | string;
  disallowedYears?: Array<number | string>;
  knownCreatorNames?: string[];
}): {
  supported: boolean;
  qualified: boolean;
  reason: string;
} {
  const { statement, passageText, targetProjectTitle, targetYear, disallowedYears = [], knownCreatorNames = [] } = options;

  const cleanPassage = cleanPassageText(passageText);
  if (!cleanPassage || cleanPassage.length < 20) {
    return { supported: false, qualified: false, reason: "Passage is too short or empty to be substantive evidence." };
  }

  const { isSoftError, isBoilerplate, reason: bpReason } = detectBoilerplateOrSoftError(cleanPassage);
  if (isSoftError || isBoilerplate) {
    return { supported: false, qualified: false, reason: bpReason || "Passage contains error or boilerplate text." };
  }

  // Entity check: if passage mentions disallowed distractor year, reject
  const passageLower = cleanPassage.toLowerCase();
  for (const dy of disallowedYears) {
    if (passageLower.includes(String(dy))) {
      return { supported: false, qualified: false, reason: `Passage explicitly refers to distractor year ${dy}.` };
    }
  }

  // Entity check: project title or creator name must be attested in passage
  const titleLower = targetProjectTitle.toLowerCase();
  const hasTitle = titleLower.length > 2 && passageLower.includes(titleLower);
  const hasCreator = knownCreatorNames.some((c) => c.length > 2 && passageLower.includes(c.toLowerCase()));

  if (!hasTitle && !hasCreator) {
    return { supported: false, qualified: false, reason: `Passage does not mention project "${targetProjectTitle}" or creators.` };
  }

  // Check named people / entities in statement: if statement names specific persons, all must be present
  const nameMatches = statement.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
  const significantNames = nameMatches.filter(
    (n) => !["Feature Documentary", "Film Festival", "United States", "Independent Screen", "Mount Pleasant"].includes(n)
  );
  if (significantNames.length > 0) {
    const missingNames = significantNames.filter((n) => !passageLower.includes(n.toLowerCase()));
    if (missingNames.length > 0) {
      return {
        supported: false,
        qualified: true,
        reason: `Passage does not attest named party: ${missingNames.join(", ")}. Split or qualify compound credit claim.`,
      };
    }
  }

  // Substantive overlap check between assertion statement and passage
  const stmtWords = statement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["this", "that", "with", "from", "film", "project"].includes(w));

  const matchCount = stmtWords.filter((w) => passageLower.includes(w)).length;
  const ratio = stmtWords.length > 0 ? matchCount / stmtWords.length : 0;

  if (ratio >= 0.6) {
    return { supported: true, qualified: false, reason: `Passage supports assertion (${Math.round(ratio * 100)}% keyterm match).` };
  } else if (ratio >= 0.35) {
    return { supported: false, qualified: true, reason: `Passage partially mentions claim (${Math.round(ratio * 100)}% match); requires qualification.` };
  }

  return { supported: false, qualified: false, reason: "Passage does not establish the factual relationship asserted in the claim." };
}
