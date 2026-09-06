/**
 * Audience Take — Autonomous Research Question Ledger & Budget Planner
 * Replaces keyword-based stopping with a structured question ledger:
 * identity, source work, intended format, stage, rights, financing,
 * attached organizations, festival/distribution, and audience evidence.
 */

export type QuestionId =
  | "identity"
  | "source_work"
  | "development_stage"
  | "creator_ambition"
  | "rights"
  | "financing"
  | "attached_organizations"
  | "festival_distribution"
  | "audience_evidence";

export type QuestionStatus = "supported" | "disputed" | "unknown" | "inaccessible";

export interface ResearchQuestion {
  id: QuestionId;
  question: string;
  status: QuestionStatus;
  relevantClaims: string[];
  attemptedSearches: string[];
  creatorControlledDiligenceStep?: string;
}

export interface ResearchBudget {
  maxSearches: number;
  maxExtractions: number;
  searchesUsed: number;
  extractionsUsed: number;
  attemptedUrls: string[];
}

export function createInitialQuestionLedger(
  projectTitle: string,
  initialUrl: string
): Record<QuestionId, ResearchQuestion> {
  return {
    identity: {
      id: "identity",
      question: `What is the verified title, creator(s), and canonical origin for "${projectTitle}"?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    source_work: {
      id: "source_work",
      question: `What is the underlying source work, medium, and format?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    development_stage: {
      id: "development_stage",
      question: `What is the verified current production/development stage?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    creator_ambition: {
      id: "creator_ambition",
      question: `What is the creator's stated artistic ambition and audience intention?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    rights: {
      id: "rights",
      question: `Are underlying rights, chain-of-title, or territory distribution rights confirmed or unencumbered?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
      creatorControlledDiligenceStep: "Request chain-of-title certificate and option agreement directly from creator/producer.",
    },
    financing: {
      id: "financing",
      question: `What public grants, crowdfunding, equity, or co-production financing have been verified?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    attached_organizations: {
      id: "attached_organizations",
      question: `Are there attached production studios, sales agencies, or distribution partners?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    festival_distribution: {
      id: "festival_distribution",
      question: `Has the project screened at film festivals, won laurels, or announced premiere dates?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
    audience_evidence: {
      id: "audience_evidence",
      question: `What observable audience traction, backer count, views, or critical reviews exist?`,
      status: "unknown",
      relevantClaims: [],
      attemptedSearches: [],
    },
  };
}

export function assessQuestionLedger(
  ledger: Record<QuestionId, ResearchQuestion>,
  evidencePassages: Array<{ url: string; title: string; text: string }>
): Record<QuestionId, ResearchQuestion> {
  const fullCorpus = evidencePassages.map((p) => `${p.title} ${p.text}`).join("\n").toLowerCase();

  // 1. Identity
  if (fullCorpus.includes("directed by") || fullCorpus.includes("creator") || fullCorpus.includes("written by") || fullCorpus.includes("starring")) {
    ledger.identity.status = "supported";
  }

  // 2. Source work & medium
  if (fullCorpus.includes("feature") || fullCorpus.includes("short film") || fullCorpus.includes("series") || fullCorpus.includes("pilot") || fullCorpus.includes("animation") || fullCorpus.includes("documentary")) {
    ledger.source_work.status = "supported";
  }

  // 3. Stage
  if (fullCorpus.includes("principal photography") || fullCorpus.includes("in production") || fullCorpus.includes("post-production") || fullCorpus.includes("development") || fullCorpus.includes("completed")) {
    ledger.development_stage.status = "supported";
  }

  // 4. Creator ambition
  if (fullCorpus.includes("vision") || fullCorpus.includes("inspired by") || fullCorpus.includes("aims to") || fullCorpus.includes("concept")) {
    ledger.creator_ambition.status = "supported";
  }

  // 5. Festival & Premiere (CRUCIAL: Festival selection does NOT prove rights!)
  const hasFestivalSignals =
    fullCorpus.includes("festival") ||
    fullCorpus.includes("selection") ||
    fullCorpus.includes("premiere") ||
    fullCorpus.includes("screening") ||
    fullCorpus.includes("laurels");

  if (hasFestivalSignals) {
    ledger.festival_distribution.status = "supported";
  }

  // 6. Rights (CRUCIAL: Requires specific distribution deal, sales agent, or rights language)
  const hasSpecificRightsTradeReport =
    fullCorpus.includes("worldwide rights acquired") ||
    fullCorpus.includes("north american rights") ||
    fullCorpus.includes("sales agent attached") ||
    fullCorpus.includes("distribution rights acquired") ||
    fullCorpus.includes("unencumbered rights") ||
    fullCorpus.includes("optioned by");

  if (hasSpecificRightsTradeReport) {
    ledger.rights.status = "supported";
  } else if (hasFestivalSignals) {
    // Festival selection exists, but commercial rights/chain-of-title remain unknown
    ledger.rights.status = "unknown";
  }

  // 7. Financing
  if (fullCorpus.includes("funded") || fullCorpus.includes("budget") || fullCorpus.includes("grant") || fullCorpus.includes("kickstarter") || fullCorpus.includes("co-production")) {
    ledger.financing.status = "supported";
  }

  // 8. Attached organizations
  if (fullCorpus.includes("production company") || fullCorpus.includes("produced by") || fullCorpus.includes("sales agent") || fullCorpus.includes("studio")) {
    ledger.attached_organizations.status = "supported";
  }

  // 9. Audience evidence
  if (fullCorpus.includes("backers") || fullCorpus.includes("views") || fullCorpus.includes("review") || fullCorpus.includes("audience")) {
    ledger.audience_evidence.status = "supported";
  }

  return ledger;
}

export function planNextResearchStep(
  ledger: Record<QuestionId, ResearchQuestion>,
  budget: ResearchBudget,
  projectTitle: string
): {
  shouldSearch: boolean;
  targetQuestion?: QuestionId;
  objective?: string;
  queries?: string[];
} {
  if (budget.searchesUsed >= budget.maxSearches) {
    return { shouldSearch: false };
  }

  // Priority 1: Unresolved Rights (especially if festival selection is known but rights are unconfirmed)
  if (ledger.rights.status === "unknown") {
    return {
      shouldSearch: true,
      targetQuestion: "rights",
      objective: `Investigate underlying rights, chain-of-title, sales agent, or commercial distribution for "${projectTitle}"`,
      queries: [
        `${projectTitle} distribution rights worldwide sales agent acquisition`,
        `${projectTitle} chain of title rights unencumbered`,
      ],
    };
  }

  // Priority 2: Unresolved Financing & Budget
  if (ledger.financing.status === "unknown") {
    return {
      shouldSearch: true,
      targetQuestion: "financing",
      objective: `Investigate financing partners, production grants, or budget backing for "${projectTitle}"`,
      queries: [
        `${projectTitle} financing budget grant funding`,
        `${projectTitle} co-production partners investor`,
      ],
    };
  }

  // Priority 3: Unresolved Attached Organizations
  if (ledger.attached_organizations.status === "unknown") {
    return {
      shouldSearch: true,
      targetQuestion: "attached_organizations",
      objective: `Investigate production company and studio attachments for "${projectTitle}"`,
      queries: [
        `${projectTitle} production company studio producers`,
      ],
    };
  }

  // All high-impact public questions are satisfied or bounded
  return { shouldSearch: false };
}
