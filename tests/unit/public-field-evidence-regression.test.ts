import { describe, expect, it } from "vitest";
import { validSciFiShortProposal } from "../fixtures/sample-proposals";
import { validateProposal } from "@/agent/deterministic-validator";
import { validateScoutBriefTranscript } from "@/services/scout-brief/script-builder";

describe("Public Field & Transcript Evidence Grounding Regressions", () => {
  it("rejects ungrounded awards and factual claims in whyScouted, decisionBrief, and industryLens", () => {
    const candidate = structuredClone(validSciFiShortProposal) as any;
    // Inject ungrounded Sundance Best Director award claim into public-facing fields
    candidate.whyScouted = "Jane Doe won Best Director at Sundance in 2026 for this project.";
    candidate.decisionBrief.logline = "Jane Doe won Best Director at Sundance in 2026 for this project.";
    candidate.decisionBrief.triageSummary = "Jane Doe won Best Director at Sundance in 2026 for this project.";
    candidate.industryLens.marketContext = "Jane Doe won Best Director at Sundance in 2026 for this project.";

    const result = validateProposal(candidate);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("Sundance") || e.includes("ungrounded") || e.includes("award"))).toBe(true);
  });

  it("rejects transcripts containing non-existent source IDs, fake claim IDs, and ungrounded commercial claims", () => {
    const card = {
      sourceLedger: [{ id: "S1", title: "Official Short Film Page", url: "https://example.com/short" }],
      evidenceClaims: [{ id: "C1", statement: "The film runs 14 minutes.", status: "supported", sourceIds: ["S1"] }],
    } as any;

    const transcript = {
      variant: "discover",
      disclosure: "AI generated.",
      limitations: [],
      segments: [
        { order: 1, section: "hook", speaker: "Scout", text: "Netflix acquired the project in a record-setting bidding war.", claimIds: ["FAKE"], sourceIds: ["S999"] },
        { order: 2, section: "project", speaker: "Analyst", text: "The film runs 14 minutes and was picked up by major distributors.", claimIds: ["FAKE"], sourceIds: ["S999"] },
        { order: 3, section: "evidence", speaker: "Scout", text: "Verified evidence confirms a multi-million dollar bidding war.", claimIds: ["FAKE"], sourceIds: ["S999"] },
        { order: 4, section: "next_move", speaker: "Analyst", text: "We recommend moving immediately to acquisition.", claimIds: ["FAKE"], sourceIds: ["S999"] },
      ],
    } as any;

    const result = validateScoutBriefTranscript(transcript, card, 50, 400);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("S999") || e.includes("FAKE") || e.includes("acquisition") || e.includes("unknown source"))).toBe(true);
  });

  it("POSITIVE CONTROL: properly grounded proposal and valid transcript pass validation", () => {
    const validCandidate = structuredClone(validSciFiShortProposal);
    const proposalResult = validateProposal(validCandidate);
    expect(proposalResult.valid).toBe(true);

    const validCard = {
      sourceLedger: [{ id: "S1", title: "Official Short Film Page", url: "https://example.com/short" }],
      evidenceClaims: [{ id: "C1", statement: "The film runs 14 minutes.", status: "supported", sourceIds: ["S1"] }],
    } as any;

    const validTranscript = {
      variant: "discover",
      disclosure: "AI generated analysis.",
      limitations: ["Exploratory research"],
      segments: [
        { order: 1, section: "hook", speaker: "Scout", text: "This independent sci-fi project explores deep space salvage.", claimIds: ["C1"], sourceIds: ["S1"] },
        { order: 2, section: "project", speaker: "Analyst", text: "The film runs 14 minutes and features analog practical models.", claimIds: ["C1"], sourceIds: ["S1"] },
        { order: 3, section: "evidence", speaker: "Scout", text: "Public records confirm independent festival interest.", claimIds: ["C1"], sourceIds: ["S1"] },
        { order: 4, section: "next_move", speaker: "Analyst", text: "The recommended next diligence step is rights verification.", claimIds: ["C1"], sourceIds: ["S1"] },
      ],
    } as any;

    const transcriptResult = validateScoutBriefTranscript(validTranscript, validCard, 30, 400);
    expect(transcriptResult.valid).toBe(true);
    expect(transcriptResult.errors).toHaveLength(0);
  });
});
