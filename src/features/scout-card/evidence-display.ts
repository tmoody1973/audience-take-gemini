import type {
  EvidenceClaim,
  EvidenceDisplayState,
  EvidenceStatus,
  ScoutCard,
  SourceLedgerEntry,
  SourceRole,
  SourceTier,
} from "./types";

const evidenceStatusLabels: Record<EvidenceStatus, string> = {
  verified_core: "Core evidence verified",
  verification_in_progress: "Verification in progress",
  source_limited: "Source limited",
  conflicting: "Conflicting evidence",
};

const evidenceStateLabels: Record<EvidenceDisplayState, string> = {
  verified: "Verified",
  reported: "Reported",
  inferred: "Inferred",
  conflicting: "Conflicting",
  unknown: "Unknown",
};

const sourceRoleLabels: Record<SourceRole, string> = {
  primary_work: "Primary work",
  commentary: "Commentary",
  trade_reporting: "Trade reporting",
  community: "Community lead",
  creator_statement: "Creator statement",
  other: "Other source",
};

const sourceTierLabels: Record<SourceTier, string> = {
  primary: "Primary source",
  creator_authorized: "Creator-authorized",
  reputable_trade: "Reputable trade",
  platform_metadata: "Platform metadata",
  secondary: "Secondary source",
  community: "Community source",
};

export function claimEvidenceState(
  claim: EvidenceClaim,
  sources: SourceLedgerEntry[],
): EvidenceDisplayState {
  if (claim.status === "conflicting") return "conflicting";
  if (claim.status === "inference") return "inferred";
  if (claim.status === "unsupported") return "unknown";

  const usableSources = sources.filter(
    (source) => claim.sourceIds.includes(source.id) && source.availability === "available",
  );
  if (usableSources.length === 0) return "unknown";
  if (
    claim.status === "supported"
    && usableSources.some((source) => source.verificationStatus === "verified")
  ) return "verified";
  return "reported";
}

export function evidenceStateLabel(state: EvidenceDisplayState): string {
  return evidenceStateLabels[state];
}

export function cardEvidenceStatus(card: ScoutCard): EvidenceStatus {
  if (card.evidenceStatus) return card.evidenceStatus;
  const states = card.evidenceClaims.map((claim) => claimEvidenceState(claim, card.sourceLedger));
  if (states.includes("conflicting")) return "conflicting";
  if (states.length > 0 && states.every((state) => state === "verified")) return "verified_core";
  const availableSourceIds = new Set(
    card.sourceLedger.filter((source) => source.availability === "available").map((source) => source.id),
  );
  const citedAvailableSources = new Set(
    card.evidenceClaims.flatMap((claim) => claim.sourceIds).filter((id) => availableSourceIds.has(id)),
  );
  if (citedAvailableSources.size < 2 || states.every((state) => state === "unknown")) {
    return "source_limited";
  }
  return "verification_in_progress";
}

export function evidenceStatusLabel(card: ScoutCard): string {
  return evidenceStatusLabels[cardEvidenceStatus(card)];
}

export function structureStatus(card: ScoutCard): ScoutCard["completeness"] {
  return card.structureStatus ?? card.completeness;
}

export function sourcePresentation(source: SourceLedgerEntry): { role: string; tier: string } {
  const role = source.sourceRole
    ? sourceRoleLabels[source.sourceRole]
    : source.externalCommentary
      ? "Commentary"
      : source.origin === "creator"
        ? "Creator statement"
        : source.origin === "community_lead"
          ? "Community lead"
          : source.origin === "submitted"
            ? "Submitted source"
            : "Research source";
  const tier = source.sourceTier
    ? sourceTierLabels[source.sourceTier]
    : source.verificationStatus === "verified"
      ? "Verified source"
      : source.verificationStatus === "observed"
        ? "Observed source"
        : "Unverified source";
  return { role, tier };
}

export function cleanTextExcerpt(raw: string, fallbackTitle?: string): string {
  if (!raw && !fallbackTitle) return "";
  let text = raw || "";
  // Remove markdown image syntax ![alt](url)
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");
  // Replace markdown link syntax [text](url) with just text (or remove if navigational/boilerplate)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, linkText) => {
    const lower = linkText.toLowerCase();
    if (
      lower.includes("subscribe") ||
      lower.includes("home") ||
      lower.includes("homepage") ||
      lower.includes("password") ||
      lower.includes("sign in") ||
      lower.includes("login") ||
      lower.includes("cookie") ||
      lower.includes("read more") ||
      lower.includes("share")
    ) {
      return "";
    }
    return linkText;
  });

  // Remove leading partial url slugs like "com/foo-bar/?share=abc)"
  text = text.replace(/^[a-z0-9_.-]*\.(com|ie|org|net|co|io|uk|ai|tv)\/[^\s\)]*\)?\s*/gi, "");
  text = text.replace(/^[^\s\(\[]*\)\s*/g, "");

  // Remove Markdown headers (#, ##, etc.)
  text = text.replace(/#+\s+/g, "");
  // Remove Markdown bold/italics
  text = text.replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, "$1");
  // Remove repeated whitespace and list markers
  text = text.replace(/^[\s*•-]+/g, "").replace(/\s+/g, " ").trim();
  // Filter out leading boilerplate words
  text = text.replace(/^(subscribe|sign in|forgot your password|read more|image:?|you may also like:?)\s*/i, "");

  // Remove trailing "You may also like..." or listicle junk
  text = text.replace(/\b(you may also like|related articles|share this|read next|more stories).*/i, "").trim();

  // Find sentences and exclude non-content snippets
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 20 &&
        !s.toLowerCase().includes("subscribe") &&
        !s.toLowerCase().includes("password") &&
        !s.toLowerCase().includes("cookie policy") &&
        !/\d+\+\s+(best|top|of)/i.test(s) &&
        !/best\s+.*\s+of\s+all\s+time/i.test(s) &&
        !/woman holding/i.test(s)
    );

  if (sentences.length > 0) {
    text = sentences.slice(0, 2).join(" ");
  } else if (fallbackTitle) {
    text = fallbackTitle.replace(/#+\s+/g, "").replace(/[*_]/g, "").trim();
  }

  // If text became too short or lost meaning, fallback to title
  if (text.length < 25 && fallbackTitle) {
    text = fallbackTitle.replace(/#+\s+/g, "").replace(/[*_]/g, "").trim();
  }

  if (text.length > 250) {
    const truncated = text.slice(0, 250);
    const lastPeriod = truncated.lastIndexOf(".");
    if (lastPeriod > 120) {
      text = truncated.slice(0, lastPeriod + 1);
    } else {
      const lastSpace = truncated.lastIndexOf(" ");
      text = (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated) + "...";
    }
  }
  return text.trim();
}
