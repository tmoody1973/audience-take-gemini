import { describe, it, expect } from "vitest";
import { validateScoutProposal } from "@/agent/deterministic-validator";
import { EvidenceItemSchema } from "@/domain/schemas";
import { loadPublishedScoutCard } from "@/features/scout-card/data";
import { dataRepo } from "@/services/firestore-repo";

const validBaseProposal = {
  projectTitle: "Echoes of the Red Soil",
  medium: "short",
  stage: "post_production",
  creators: ["Amara Okafor"],
  whatWeKnow: [
    "Amara Okafor directed this 15-minute narrative short shot on location in Enugu.",
    "Post-production sound mixing was completed in July 2026.",
    "The project focuses on artisanal palm oil farming traditions.",
  ],
  whatWereChecking: [
    "Festival submission timeline for FESPACO 2027.",
    "Confirmation of international streaming rights.",
  ],
  whyScouted: "Visually evocative West African regional storytelling with strong cultural specificity.",
  sourceMedia: [
    {
      type: "youtube_embed",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      verified: true,
      caption: "Official Trailer",
    },
  ],
  evidenceLedger: [
    {
      id: "ev-1",
      sourceUrl: "https://example.com/enugu-film-report",
      title: "Enugu Regional Cinema Spotlight",
      publisher: "Nollywood Arts Journal",
      claimType: "reported",
      excerpt: "Amara Okafor directed and wrapped principal photography for Echoes of the Red Soil in Enugu.",
      verified: false,
      publishedAt: "2026-07-15T10:00:00Z",
      retrievedAt: "2026-08-01T14:30:00Z",
      supportingClaimIds: ["claim-1"],
    },
    {
      id: "ev-2",
      sourceUrl: "https://example.com/enugu-craft-audio",
      title: "Artisanal Farming and Sound in Nigerian Cinema",
      publisher: "African Screen Daily",
      claimType: "observation",
      excerpt: "Echoes of the Red Soil focuses on artisanal palm oil farming traditions, with sound mixing completed in July 2026.",
      verified: false,
      publishedAt: "2026-07-20T10:00:00Z",
      retrievedAt: "2026-08-01T14:30:00Z",
      supportingClaimIds: ["claim-2", "claim-3"],
    },
  ],
  pathways: [
    {
      title: "Pan-African Festival Tour and Educational Distribution",
      mediumFitRationale: "15-minute runtime is optimal for international diaspora film festival showcases.",
      targetAudience: "African diaspora audiences, academic film archives, and cultural institutions.",
      risksAndUncertainties: ["Securing screening travel grants for international premieres."],
      nextBoundedExperiment: {
        name: "FESPACO Submission Review",
        description: "Submit rough cut screener to FESPACO short film selection committee.",
        successMetric: "Official festival selection notification.",
      },
      prerequisites: ["Locked audio master", "French subtitle track"],
      owner: "Amara Okafor / Festival Coordinator",
      blockers: ["Color grading completion"],
    },
  ],
  decisionBrief: {
    logline: "In rural Enugu, a young palm oil harvester navigates family legacy against environmental shifts.",
    coreHook: "Lush textural cinematography with indigenous language dialogue and authentic agrarian rhythm.",
    comparativeTitles: ["Mami Wata", "The Gravedigger's Wife"],
    primaryRisk: "Short films face limited commercial monetization without festival laurels or SVOD bundle acquisition.",
    triageSummary: "Finished production with verified regional shoot; festival premiere pending and rights intact.",
    materialUncertainty: "Status of French subtitling and international festival distribution attachments.",
    nextDiligenceStep: "Confirm completion date of sound mix with director Amara Okafor.",
  },
  industryLens: {
    marketContext: "African short-form cinema is seeing growing inclusion at Rotterdam, Clermont-Ferrand, and Toronto.",
    comparables: ["Lizard (2020)"],
    realisticConstraints: "Financing relies heavily on cultural grants rather than commercial pre-sales.",
  },
};

describe("Scout Agent Reliability R3: Canonical Claim & Provenance Contracts", () => {
  it("preserves publishedAt, retrievedAt, and supportingClaimIds through validation", () => {
    const result = validateScoutProposal(validBaseProposal);

    expect(result.valid).toBe(true);
    expect(result.sanitizedCard).toBeDefined();

    const ev = result.sanitizedCard?.evidenceLedger[0];
    expect(ev?.publishedAt).toBe("2026-07-15T10:00:00Z");
    expect(ev?.retrievedAt).toBe("2026-08-01T14:30:00Z");
    expect(ev?.supportingClaimIds).toEqual(["claim-1"]);
    expect(ev?.verified).toBe(false);
  });

  it("EvidenceItemSchema defaults verified to false", () => {
    const parsed = EvidenceItemSchema.parse({
      id: "ev-test",
      sourceUrl: "https://example.com/test",
      title: "Test Evidence Title",
      publisher: "Test Journal",
      claimType: "reported",
      excerpt: "A factual excerpt for testing purposes.",
    });

    expect(parsed.verified).toBe(false);
  });

  it("quarantines malformed evidence items instead of fabricating audiencetake.com placeholders", () => {
    const proposalWithCorruptItem = {
      ...validBaseProposal,
      whatWeKnow: [
        "Amara Okafor directed this narrative short film.",
        "Principal photography was completed on location in Enugu.",
      ],
      evidenceLedger: [
        null, // Malformed null item
        { foo: "bar" }, // Missing sourceUrl
        { sourceUrl: "ftp://bad-scheme.com", title: "Bad Scheme", excerpt: "Excerpt text goes here" }, // Invalid scheme
        validBaseProposal.evidenceLedger[0], // Valid item
      ],
    };

    const result = validateScoutProposal(proposalWithCorruptItem);

    expect(result.valid).toBe(true);
    expect(result.quarantinedEvidence).toBeDefined();
    expect(result.quarantinedEvidence?.length).toBe(3);

    // Assert that audiencetake.com/evidence was NEVER manufactured
    const hasFabricatedCitation = result.sanitizedCard?.evidenceLedger.some((e) =>
      e.sourceUrl.includes("audiencetake.com")
    );
    expect(hasFabricatedCitation).toBe(false);

    // Only the single valid item remains
    expect(result.sanitizedCard?.evidenceLedger.length).toBe(1);
    expect(result.sanitizedCard?.evidenceLedger[0].id).toBe("ev-1");
  });

  it("fails validation if all evidence items are malformed, preventing zero-evidence publication", () => {
    const proposalWithAllCorruptItems = {
      ...validBaseProposal,
      evidenceLedger: [
        null,
        { sourceUrl: "invalid-url-string", title: "Corrupt" },
      ],
    };

    const result = validateScoutProposal(proposalWithAllCorruptItems);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("evidenceLedger"))).toBe(true);
    expect(result.sanitizedCard).toBeUndefined();
  });

  it("quarantines evidence items with future retrieval timestamps", () => {
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString(); // 1 year in future
    const proposalWithFutureRetrieval = {
      ...validBaseProposal,
      whatWeKnow: [
        "Amara Okafor directed this narrative short film.",
        "Principal photography was completed on location in Enugu.",
      ],
      evidenceLedger: [
        {
          id: "ev-future",
          sourceUrl: "https://example.com/future",
          title: "Future Reporting",
          publisher: "Future Gazette",
          claimType: "reported",
          excerpt: "Future excerpt that could not possibly have been retrieved yet.",
          retrievedAt: futureDate,
        },
        validBaseProposal.evidenceLedger[0],
      ],
    };

    const result = validateScoutProposal(proposalWithFutureRetrieval);

    expect(result.valid).toBe(true);
    expect(result.quarantinedEvidence?.some((q) => q.reason.includes("future retrieval timestamp"))).toBe(true);
    expect(result.sanitizedCard?.evidenceLedger.length).toBe(1);
    expect(result.sanitizedCard?.evidenceLedger[0].id).toBe("ev-1");
  });

  it("projects unverified reported claims to status 'qualified' rather than 'supported' in loadPublishedScoutCard", async () => {
    const testProjectId = "proj-nigeria-r3";
    const testProject = {
      id: testProjectId,
      publicationStatus: "published",
      identity: {
        title: "Echoes of the Red Soil",
        originalUrl: "https://example.com/enugu-film-report",
        medium: "short" as const,
        currentStage: "post_production" as const,
      },
      publishedCardId: `card-${testProjectId}-v1`,
      nomination: {
        submittedByUid: "fan-1",
        nominatorRole: "fan" as const,
        reason: "Important Nigerian short film",
        initialLinks: ["https://example.com/enugu-film-report"],
        createdAt: "2026-08-01T00:00:00Z",
      },
      creatorClaim: { status: "unclaimed" as const },
      metrics: { watchCount: 0, payCount: 0, cityDemandCount: 0, backCount: 0, pathwayVotes: [0, 0, 0], cities: {} },
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    };

    const testCard = {
      id: `card-${testProjectId}-v1`,
      projectId: testProjectId,
      version: 1,
      status: "published" as const,
      whatWeKnow: ["Director Amara Okafor's narrative short explores palm oil harvesting traditions in rural Enugu."],
      whatWereChecking: ["Festival submission dates."],
      whyScouted: "West African short cinema.",
      sourceMedia: [],
      evidenceLedger: [
        {
          id: "ev-unverified-1",
          sourceUrl: "https://example.com/enugu-film-report",
          title: "Nollywood Arts Journal Reporting",
          publisher: "Nollywood Arts",
          claimType: "reported" as const,
          excerpt: "Amara Okafor wrapped principal photography for Echoes of the Red Soil in Enugu.",
          verified: false, // Unverified reported claim
          publishedAt: "2026-07-15T10:00:00Z",
          retrievedAt: "2026-08-01T14:30:00Z",
        },
      ],
      pathways: validBaseProposal.pathways,
      decisionBrief: validBaseProposal.decisionBrief,
      industryLens: validBaseProposal.industryLens,
      trailerCriticId: null,
      versionProvenance: {
        generatedAt: "2026-08-01T15:00:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Initial test card",
      },
    };

    await dataRepo.createProject(testProject as any);
    await dataRepo.publishScoutCard(testCard as any);

    const projected = await loadPublishedScoutCard(testProjectId);
    expect(projected).toBeDefined();

    // Check that direct passage claim from unverified evidence is projected as "qualified", NOT "supported"
    const passageClaim = projected?.evidenceClaims.find((c) => c.id === "claim-ev-unverified-1");
    expect(passageClaim).toBeDefined();
    expect(passageClaim?.status).toBe("qualified");
    expect(passageClaim?.qualification).toContain("pending independent verification");
  });
});
