import { describe, it, expect } from "vitest";
import { validateScoutProposal } from "@/agent/deterministic-validator";
import {
  validSciFiShortProposal,
  hypeViolatingProposal,
  mediumMismatchDocProposal,
} from "../fixtures/sample-proposals";

describe("Deterministic AI Proposal Validator", () => {
  it("approves a valid, evidence-grounded scout proposal", () => {
    const result = validateScoutProposal(validSciFiShortProposal);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedCard).toBeDefined();
    expect(result.sanitizedCard?.status).toBe("published");
    expect(result.sanitizedCard?.pathways).toHaveLength(3);
  });

  it("rejects proposals containing forbidden commercial hype and fake greenlight scores", () => {
    const result = validateScoutProposal(hypeViolatingProposal);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Disallowed commercial hype"))).toBe(true);
  });

  it("rejects proposals with medium-pathway mismatches (e.g. animated pathways for documentary)", () => {
    const result = validateScoutProposal(mediumMismatchDocProposal);
    expect(result.errors.some((e) => e.includes("animation pathways without hybrid evidence"))).toBe(true);
  });

  it("rejects proposals where whatWeKnow is only supported by an unverified nominator submission lead", () => {
    const rawLead = {
      id: "ev-nominator-lead",
      sourceUrl: "https://example.com/submitted-video",
      title: "Nominator Submission Lead",
      publisher: "Nominator",
      claimType: "reported" as const,
      excerpt: 'Nominator context: "Jane Doe directed this short."',
      verified: false,
      isNominatorLead: true,
      origin: "nominator" as const,
    };

    const nominatorOnlyProposal = {
      ...validSciFiShortProposal,
      evidenceLedger: [rawLead],
      whatWeKnow: ["Jane Doe directed this short.", "Jane Doe created and directed the short."],
    };

    const result = validateScoutProposal(nominatorOnlyProposal);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Insufficient passage grounding"))).toBe(true);
  });
});
