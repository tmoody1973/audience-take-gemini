/**
 * Audience Take — Bounded Proposal Repair Module
 * 
 * Surgically qualifies, sanitizes, or redacts ungrounded commercial assertions,
 * buyer acquisition hype, unverified budgets, accolades, and talent attachments
 * flagged by the deterministic proposal validator, preserving verified facts
 * and moving unverified assertions into whatWereChecking.
 */

export interface RepairResult {
  repaired: boolean;
  actionsTaken: string[];
  proposal: any;
}

const BUYER_PATTERNS = [
  {
    regex: /\b(pitch(?:ing)?\s+(?:the\s+project\s+)?to\s+)?(netflix|a24|hbo|disney|apple(?:\s*tv)?|amazon(?:\s*studios)?|paramount|warner)\b.{0,80}?\b(buying|acquired|acquisition|in\s+talks|bidding|bid|pre-buy|gauge\s+series\s+acquisition)\b/gi,
    replacement: "gauge audience demand across distribution platforms",
  },
  {
    regex: /\b(buying|acquired|acquisition|in\s+talks\s+with|bidding\s+on|deal\s+with)\b.{0,80}?\s+(netflix|a24|hbo|disney|apple|amazon|paramount|warner)\b/gi,
    replacement: "distribution partners",
  },
  {
    regex: /\b(netflix|a24|hbo|disney|apple|amazon|paramount|warner)\s+to\s+gauge\s+series\s+acquisition\b/gi,
    replacement: "explore potential series adaptation across streaming platforms",
  },
];

const STRICT_HYPE_REPLACEMENTS = [
  { regex: /\bgreenlight\s*score\b/gi, replacement: "audience interest assessment" },
  { regex: /\bguaranteed\s*(hit|commercial|box\s*office|return|success)\b/gi, replacement: "projected audience alignment" },
  { regex: /\bcertain\s*commercial\s*success\b/gi, replacement: "prospective audience viability" },
  { regex: /\bpredicted\s*roi\b/gi, replacement: "projected interest" },
];

function sanitizeString(input: string): { text: string; modified: boolean } {
  let text = input;
  let modified = false;

  for (const bp of BUYER_PATTERNS) {
    if (bp.regex.test(text)) {
      text = text.replace(bp.regex, bp.replacement);
      modified = true;
    }
  }

  for (const hp of STRICT_HYPE_REPLACEMENTS) {
    if (hp.regex.test(text)) {
      text = text.replace(hp.regex, hp.replacement);
      modified = true;
    }
  }

  return { text, modified };
}

export function repairScoutProposal(proposalData: any, errors: string[]): RepairResult {
  const proposal = JSON.parse(JSON.stringify(proposalData));
  const actionsTaken: string[] = [];

  if (!Array.isArray(proposal.whatWereChecking)) {
    proposal.whatWereChecking = [];
  }

  for (const error of errors) {
    // 1. Repair ungrounded budget or financial assertion
    if (error.includes("Ungrounded budget or financial assertion")) {
      const budgetMatch = error.match(/"([^"]+)"/)?.[1];
      const fieldMatch = error.match(/in\s+([\w.]+):/)?.[1] || "whyScouted";

      if (budgetMatch) {
        if (fieldMatch === "whyScouted" && typeof proposal.whyScouted === "string") {
          const sentences: string[] = proposal.whyScouted.split(/(?<=[.!?])\s+/);
          const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(budgetMatch.toLowerCase()));
          if (filtered.length > 0) {
            proposal.whyScouted = filtered.join(" ");
          } else {
            proposal.whyScouted = proposal.whyScouted.replace(
              new RegExp(`\\${budgetMatch}`, "gi"),
              "crowdfunding and community production support"
            );
          }
          actionsTaken.push(`Removed ungrounded budget "${budgetMatch}" from whyScouted`);
        } else if (fieldMatch.startsWith("decisionBrief") && proposal.decisionBrief) {
          const subField = fieldMatch.split(".")[1] || "logline";
          if (typeof proposal.decisionBrief[subField] === "string") {
            const sentences: string[] = proposal.decisionBrief[subField].split(/(?<=[.!?])\s+/);
            const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(budgetMatch.toLowerCase()));
            proposal.decisionBrief[subField] = filtered.length > 0 ? filtered.join(" ") : "Independent production.";
            actionsTaken.push(`Removed ungrounded budget "${budgetMatch}" from ${fieldMatch}`);
          }
        } else if (fieldMatch.startsWith("industryLens") && proposal.industryLens) {
          const subField = fieldMatch.split(".")[1] || "marketContext";
          if (typeof proposal.industryLens[subField] === "string") {
            const sentences: string[] = proposal.industryLens[subField].split(/(?<=[.!?])\s+/);
            const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(budgetMatch.toLowerCase()));
            proposal.industryLens[subField] = filtered.length > 0 ? filtered.join(" ") : "Independent market landscape.";
            actionsTaken.push(`Removed ungrounded budget "${budgetMatch}" from ${fieldMatch}`);
          }
        }
        proposal.whatWereChecking.push(`Budget claims pending verified documentation: ${budgetMatch}`);
      }
    }

    // 2. Repair ungrounded buyer claim or commercial hype
    if (
      error.includes("Disallowed commercial hype or ungrounded buyer claim detected") ||
      error.includes("Ungrounded acquisition or market hype")
    ) {
      // Sanitize pathways
      if (Array.isArray(proposal.pathways)) {
        for (let i = 0; i < proposal.pathways.length; i++) {
          const p = proposal.pathways[i];
          if (p.title) {
            const res = sanitizeString(p.title);
            if (res.modified) {
              p.title = res.text;
              actionsTaken.push(`Sanitized commercial hype in pathway[${i}].title`);
            }
          }
          if (p.mediumFitRationale) {
            const res = sanitizeString(p.mediumFitRationale);
            if (res.modified) {
              p.mediumFitRationale = res.text;
              actionsTaken.push(`Sanitized commercial hype in pathway[${i}].mediumFitRationale`);
            }
          }
          if (p.targetAudience) {
            const res = sanitizeString(p.targetAudience);
            if (res.modified) {
              p.targetAudience = res.text;
              actionsTaken.push(`Sanitized commercial hype in pathway[${i}].targetAudience`);
            }
          }
        }
      }

      // Sanitize whyScouted
      if (typeof proposal.whyScouted === "string") {
        const res = sanitizeString(proposal.whyScouted);
        if (res.modified) {
          proposal.whyScouted = res.text;
          actionsTaken.push("Sanitized buyer acquisition claim in whyScouted");
        }
      }

      // Sanitize decisionBrief
      if (proposal.decisionBrief) {
        for (const key of ["logline", "triageSummary", "materialUncertainty"]) {
          if (typeof proposal.decisionBrief[key] === "string") {
            const res = sanitizeString(proposal.decisionBrief[key]);
            if (res.modified) {
              proposal.decisionBrief[key] = res.text;
              actionsTaken.push(`Sanitized buyer claim in decisionBrief.${key}`);
            }
          }
        }
      }

      // Sanitize industryLens
      if (proposal.industryLens) {
        for (const key of ["comparableTitles", "marketContext", "potentialDistributionPartners"]) {
          if (typeof proposal.industryLens[key] === "string") {
            const res = sanitizeString(proposal.industryLens[key]);
            if (res.modified) {
              proposal.industryLens[key] = res.text;
              actionsTaken.push(`Sanitized buyer claim in industryLens.${key}`);
            }
          }
        }
      }

      proposal.whatWereChecking.push("Buyer and platform acquisition claims pending trade verification");
    }

    // 3. Repair ungrounded award or festival claim
    if (error.includes("Ungrounded award or festival claim in")) {
      const festivalMatch = error.match(/"([^"]+)"/)?.[1] || "festival";
      const fieldMatch = error.match(/in\s+([\w.]+):/)?.[1] || "whyScouted";

      if (fieldMatch === "whyScouted" && typeof proposal.whyScouted === "string") {
        const sentences: string[] = proposal.whyScouted.split(/(?<=[.!?])\s+/);
        const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(festivalMatch.toLowerCase()));
        proposal.whyScouted = filtered.join(" ");
        actionsTaken.push(`Removed ungrounded festival claim "${festivalMatch}" from whyScouted`);
      } else if (fieldMatch.startsWith("decisionBrief") && proposal.decisionBrief) {
        const subField = fieldMatch.split(".")[1] || "triageSummary";
        if (typeof proposal.decisionBrief[subField] === "string") {
          const sentences: string[] = proposal.decisionBrief[subField].split(/(?<=[.!?])\s+/);
          const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(festivalMatch.toLowerCase()));
          proposal.decisionBrief[subField] = filtered.join(" ");
          actionsTaken.push(`Removed ungrounded festival claim "${festivalMatch}" from ${fieldMatch}`);
        }
      }
      proposal.whatWereChecking.push(`Festival accolade claims pending verification: ${festivalMatch}`);
    }

    // 4. Repair ungrounded talent or cast attachment
    if (error.includes("Ungrounded talent or cast attachment in")) {
      const talentMatch = error.match(/"([^"]+)"/)?.[1];
      const fieldMatch = error.match(/in\s+([\w.]+):/)?.[1] || "whyScouted";

      if (talentMatch) {
        if (fieldMatch === "whyScouted" && typeof proposal.whyScouted === "string") {
          const sentences: string[] = proposal.whyScouted.split(/(?<=[.!?])\s+/);
          const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(talentMatch.toLowerCase()));
          proposal.whyScouted = filtered.join(" ");
          actionsTaken.push(`Removed ungrounded talent attachment "${talentMatch}" from whyScouted`);
        } else if (fieldMatch.startsWith("decisionBrief") && proposal.decisionBrief) {
          const subField = fieldMatch.split(".")[1] || "logline";
          if (typeof proposal.decisionBrief[subField] === "string") {
            const sentences: string[] = proposal.decisionBrief[subField].split(/(?<=[.!?])\s+/);
            const filtered = sentences.filter((s: string) => !s.toLowerCase().includes(talentMatch.toLowerCase()));
            proposal.decisionBrief[subField] = filtered.join(" ");
            actionsTaken.push(`Removed ungrounded talent attachment "${talentMatch}" from ${fieldMatch}`);
          }
        }
        proposal.whatWereChecking.push(`Talent attachment claims pending verification: ${talentMatch}`);
      }
    }
  }

  proposal.whatWereChecking = Array.from(new Set(proposal.whatWereChecking));

  // Guarantee schema minimum length invariants if sentences were stripped
  if (typeof proposal.whyScouted === "string" && proposal.whyScouted.trim().length < 10) {
    proposal.whyScouted = "Independent screen project discovered and monitored by Audience Take scouts.";
  }
  if (proposal.decisionBrief) {
    if (typeof proposal.decisionBrief.logline === "string" && proposal.decisionBrief.logline.trim().length < 10) {
      proposal.decisionBrief.logline = "Independent screen project currently in development.";
    }
    if (typeof proposal.decisionBrief.triageSummary === "string" && proposal.decisionBrief.triageSummary.trim().length < 10) {
      proposal.decisionBrief.triageSummary = "Project under active evaluation by scouts.";
    }
  }

  return {
    repaired: actionsTaken.length > 0,
    actionsTaken,
    proposal,
  };
}
