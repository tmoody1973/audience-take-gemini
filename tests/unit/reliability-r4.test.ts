import { describe, it, expect } from "vitest";
import {
  validateScoutProposal,
  checkCitationCoverage,
  checkCrossSectionContradictions,
  checkHypeAndHallucinations,
  verifyPublicationGate,
} from "@/agent/deterministic-validator";

const baseProposal = {
  projectTitle: "The Desert Sings at Dawn",
  medium: "short" as const,
  stage: "festival_circuit" as const,
  creators: ["Tariq Mansoor"],
  whatWeKnow: [
    "Tariq Mansoor directed this 18-minute short film in the Rub' al Khali desert.",
    "Premiered at Doha Film Institute showcase in spring 2026.",
    "Original soundscape composed using traditional oud and ambient wind recordings.",
  ],
  whatWereChecking: [
    "Whether international rights have been cleared for European broadcasting.",
  ],
  whyScouted: "Atmospheric Middle Eastern cinema with singular sonic identity.",
  sourceMedia: [
    {
      type: "youtube_embed" as const,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      verified: true,
      caption: "Official Teaser",
    },
  ],
  evidenceLedger: [
    {
      id: "ev-1",
      sourceUrl: "https://example.com/dfi-showcase-2026",
      title: "Doha Film Institute 2026 Spring Showcase",
      publisher: "Doha Film Institute",
      claimType: "reported" as const,
      excerpt: "Tariq Mansoor premiered his 18-minute short film The Desert Sings at Dawn, filmed in the Rub' al Khali desert.",
      verified: true,
      publishedAt: "2026-04-10T12:00:00Z",
      retrievedAt: "2026-05-01T10:00:00Z",
    },
    {
      id: "ev-2",
      sourceUrl: "https://example.com/sound-cinema-oud",
      title: "Sonic Landscapes in Contemporary Gulf Cinema",
      publisher: "Arab Film Tribune",
      claimType: "observation" as const,
      excerpt: "The Desert Sings at Dawn features an original soundscape composed using traditional oud and ambient wind recordings.",
      verified: true,
      publishedAt: "2026-05-05T09:00:00Z",
      retrievedAt: "2026-05-15T14:00:00Z",
    },
  ],
  pathways: [
    {
      title: "Curated International Festival Tour",
      mediumFitRationale: "18-minute duration aligns with premier international short film programming slots.",
      targetAudience: "Global art-house and Middle Eastern diaspora audiences.",
      risksAndUncertainties: ["High competition for Clermont-Ferrand short competition."],
      nextBoundedExperiment: {
        name: "Festival Submission Screening",
        description: "Submit to Venice Orizzonti Short Film selection.",
        successMetric: "Festival programmer review invitation.",
      },
      prerequisites: ["English subtitled DCP"],
      owner: "Producer / Director",
      blockers: ["Color finish"],
    },
  ],
  decisionBrief: {
    logline: "An elderly Bedouin falconer listens to shifting dunes to locate a forgotten oasis before commercial surveyors arrive.",
    coreHook: "Haunting acoustic landscape paired with widescreen anamorphic desert vistas.",
    comparativeTitles: ["Theeb", "Caravan"],
    primaryRisk: "Slow-burn contemplative shorts require specialized curation to find broad audiences.",
    triageSummary: "Finished festival short with strong festival trajectory; commercial rights pending chain-of-title confirmation.",
    materialUncertainty: "Underlying music clearance documentation for European broadcast remains unconfirmed.",
    nextDiligenceStep: "Review music clearance contracts with Tariq Mansoor.",
  },
  industryLens: {
    marketContext: "Gulf regional shorts are gaining significant curatorial interest at Cannes Court Métrage and Clermont-Ferrand.",
    comparables: ["Theeb (2014)"],
    realisticConstraints: "Short films rely on cultural grants rather than commercial theatrical pre-sales.",
  },
};

describe("Scout Agent Reliability R4: Shared Claim-Verification and Publication Gate", () => {
  it("passage-specific grounding: detects ungrounded claims when tokens are scattered across unrelated sources", () => {
    // A claim whose words exist scattered in disparate sources, but no single source passage actually supports it
    const scatteredClaim = "Tariq Mansoor compose European broadcasting documentation.";
    const check = checkCitationCoverage(baseProposal.evidenceLedger, [scatteredClaim]);

    expect(check.sufficientCoverage).toBe(false);
    expect(check.ungroundedClaims).toContain(scatteredClaim);
  });

  it("zero-unsupported-claims allowance: removes ungrounded claims from whatWeKnow into whatWereChecking", () => {
    const proposalWithUngroundedClaim = {
      ...baseProposal,
      whatWeKnow: [
        baseProposal.whatWeKnow[0], // Grounded in ev-1
        baseProposal.whatWeKnow[1], // Grounded in ev-1
        "Invented claim: Director signed a $3M multi-picture deal with Sony Pictures in Tokyo.", // Completely ungrounded
      ],
    };

    const result = validateScoutProposal(proposalWithUngroundedClaim);

    expect(result.valid).toBe(true);
    expect(result.isPartial).toBe(true);
    // Assert the invented claim was stripped from factual section
    expect(result.sanitizedCard?.whatWeKnow).not.toContain(
      "Invented claim: Director signed a $3M multi-picture deal with Sony Pictures in Tokyo."
    );
    // Assert it was safely moved to whatWereChecking
    expect(
      result.sanitizedCard?.whatWereChecking.some((c) => c.includes("Sony Pictures"))
    ).toBe(true);
  });

  it("fails validation if fewer than 2 grounded claims remain after filtering ungrounded assertions", () => {
    const proposalWithMostlyUngroundedClaims = {
      ...baseProposal,
      whatWeKnow: [
        baseProposal.whatWeKnow[0], // 1 grounded claim
        "Ungrounded claim 1 about unverified studio attachments.",
        "Ungrounded claim 2 about worldwide theatrical box office returns.",
      ],
    };

    const result = validateScoutProposal(proposalWithMostlyUngroundedClaims);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Insufficient passage grounding"))).toBe(true);
  });

  it("detects and qualifies rights contradictions (unencumbered vs unconfirmed chain of title)", () => {
    const contradictoryProposal = {
      ...baseProposal,
      decisionBrief: {
        ...baseProposal.decisionBrief,
        triageSummary: "High visual craft; festival premiere announced and feature rights unencumbered.",
        materialUncertainty: "Underlying feature screenplay status and chain-of-title are unconfirmed in public records.",
      },
    };

    const result = validateScoutProposal(contradictoryProposal);

    expect(result.valid).toBe(true);
    // Triage summary must be qualified to prevent claiming unencumbered rights
    expect(result.sanitizedCard?.decisionBrief.triageSummary).toContain(
      "feature rights pending chain-of-title confirmation"
    );
    expect(result.sanitizedCard?.versionProvenance.gateReceipt?.contradictions.length).toBeGreaterThan(0);
  });

  it("fails validation on critical format contradictions (e.g. short claimed as completed feature film)", () => {
    const formatContradictionProposal = {
      ...baseProposal,
      medium: "short" as const,
      whatWeKnow: [
        ...baseProposal.whatWeKnow,
        "Completed feature film released across 2,000 commercial theaters.",
      ],
    };

    const result = validateScoutProposal(formatContradictionProposal);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Format contradiction"))).toBe(true);
  });

  it("permits distributor acquisition reporting when supported by cited trade evidence, but rejects when uncited", () => {
    // 1. Uncited Netflix acquisition claim -> FAILS
    const uncitedProposal = {
      ...baseProposal,
      whatWeKnow: [
        baseProposal.whatWeKnow[0],
        baseProposal.whatWeKnow[1],
        "Netflix has acquired worldwide streaming rights.",
      ],
    };
    const uncitedResult = validateScoutProposal(uncitedProposal);
    expect(uncitedResult.valid).toBe(false);
    expect(uncitedResult.errors.some((e) => e.includes("Disallowed commercial hype or ungrounded buyer claim"))).toBe(true);

    // 2. Sourced Netflix acquisition claim in evidenceLedger -> PASSES
    const sourcedProposal = {
      ...baseProposal,
      evidenceLedger: [
        ...baseProposal.evidenceLedger,
        {
          id: "ev-trade-deadline",
          sourceUrl: "https://deadline.com/2026/netflix-acquires-desert-sings",
          title: "Deadline: Netflix Acquires Worldwide Rights to The Desert Sings at Dawn",
          publisher: "Deadline Hollywood",
          claimType: "reported" as const,
          excerpt: "Netflix has acquired worldwide distribution rights to Tariq Mansoor's desert short following its festival premiere.",
          verified: true,
          publishedAt: "2026-05-20T10:00:00Z",
          retrievedAt: "2026-05-21T08:00:00Z",
        },
      ],
      whatWeKnow: [
        baseProposal.whatWeKnow[0],
        baseProposal.whatWeKnow[1],
        "Netflix has acquired worldwide distribution rights following festival premiere.",
      ],
    };
    const sourcedResult = validateScoutProposal(sourcedProposal);
    expect(sourcedResult.valid).toBe(true);
    expect(sourcedResult.sanitizedCard?.whatWeKnow).toContain(
      "Netflix has acquired worldwide distribution rights following festival premiere."
    );
  });

  it("verifyPublicationGate enforces the gate and persists an immutable gate receipt", () => {
    const gateResult = verifyPublicationGate({
      id: "card-desert-v1",
      projectId: "proj-desert",
      version: 1,
      ...baseProposal,
    });

    expect(gateResult.passed).toBe(true);
    expect(gateResult.sanitizedCard).toBeDefined();
    expect(gateResult.sanitizedCard?.versionProvenance.gateReceipt).toEqual(
      expect.objectContaining({
        passed: true,
        policyVersion: "2026.1",
        approvedClaimsCount: expect.any(Number),
      })
    );
  });
});
