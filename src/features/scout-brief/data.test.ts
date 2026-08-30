import { describe, it, expect } from "vitest";
import { loadScoutBriefForCard } from "./data";
import type { ScoutCard } from "../scout-card/types";

const mockCard = {
  cardVersionId: "card-brief-test-01",
  projectId: "proj-test",
  runId: "run-01",
  researchVersion: 1,
  title: "Junichiro Jackson",
  slug: "junichiro-jackson",
  claimStatus: "approved",
  publishedAt: "2026-08-29T12:00:00Z",
  submissionLabel: "Direct",
  completeness: "complete",
  hook: "A high-octane indie anime pilot.",
  projectType: "series",
  fallbackUsed: false,
  provenance: {
    submissionType: "fan",
    submittedSourceUrl: "https://youtube.com/watch?v=123",
    nominationLabel: "Community Nom",
    nominatedByLabel: "Scout #1",
    researchedAt: "2026-08-29",
  },
  media: {
    state: "authorized_embed",
    title: "Teaser",
    sourceUrl: "https://youtube.com/watch?v=123",
    embedUrl: "https://youtube.com/embed/123",
    attribution: "Creator",
    accessibleFallback: "Audio description",
  },
  storyContext: { summary: "Summary", storyworld: "World", themes: [], currentFormat: "Pilot", audienceHooks: [], claimIds: [] },
  creatorContext: { displayName: "Creator", claimStatus: "approved", summary: "Summary", sourceIds: [], limitations: [] },
  sourceIds: ["S1"],
  claimIds: ["c1"],
  evidenceClaims: [],
  sourceLedger: [
    {
      id: "S1",
      origin: "submitted",
      title: "YouTube Pilot",
      url: "https://youtube.com/watch?v=123",
      publishedAt: "2026-08-29",
      retrievedAt: "2026-08-29",
      availability: "available",
      verificationStatus: "verified",
      supportsClaimIds: [],
      externalCommentary: false,
    },
  ],
  pathwayIds: ["p1", "p2", "p3"],
  pathways: [
    {
      id: "p1",
      order: 1,
      label: "Prestige Series",
      format: "TV-MA Animation",
      audience: "YA",
      rationale: "Fit",
      supportingClaimIds: [],
      comparableSourceIds: [],
      strengths: [],
      risks: [],
      openQuestions: [],
      confidence: "high",
      nextExperiment: {
        title: "Production Bible",
        hypothesis: "Hypothesis",
        method: "Method",
        participantAction: "Action",
        signal: "Signal",
        timebox: "4 weeks",
      },
    },
    {
      id: "p2",
      order: 2,
      label: "Feature Film",
      format: "Theatrical",
      audience: "Global",
      rationale: "Fit",
      supportingClaimIds: [],
      comparableSourceIds: [],
      strengths: [],
      risks: [],
      openQuestions: [],
      confidence: "medium",
      nextExperiment: {
        title: "Script Draft",
        hypothesis: "Hypothesis",
        method: "Method",
        participantAction: "Action",
        signal: "Signal",
        timebox: "6 weeks",
      },
    },
    {
      id: "p3",
      order: 3,
      label: "Web Comic",
      format: "Digital",
      audience: "Fandom",
      rationale: "Fit",
      supportingClaimIds: [],
      comparableSourceIds: [],
      strengths: [],
      risks: [],
      openQuestions: [],
      confidence: "high",
      nextExperiment: {
        title: "Pilot Chapter",
        hypothesis: "Hypothesis",
        method: "Method",
        participantAction: "Action",
        signal: "Signal",
        timebox: "2 weeks",
      },
    },
  ],
  missingSections: [],
  limitations: [],
  externalSignals: [],
  industryLens: {
    pathwayIds: ["p1"],
    comparables: [],
    marketContext: "Context",
    realisticConstraints: "Constraints",
  },
} as unknown as ScoutCard;

describe("Scout Brief Data Loader", () => {
  it("loads or generates a valid, schema-compliant Scout Brief for a card", async () => {
    const brief = await loadScoutBriefForCard(mockCard);

    expect(brief).toBeDefined();
    expect(brief?.cardVersionId).toBe("card-brief-test-01");
    expect(brief?.status).toBe("ready");
    expect(brief?.language).toBe("en-US");
    expect(brief?.speakers.length).toBe(2);
    expect(brief?.transcript.segments.length).toBeGreaterThanOrEqual(4);
    expect(brief?.audioUrl).toMatch(/^(\/api\/|https:\/\/)/);
    expect(brief?.mimeType).toBe("audio/wav");
    expect(brief?.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
