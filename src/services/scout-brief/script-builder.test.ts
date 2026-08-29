import { describe, it, expect } from "vitest";
import {
  buildClosedWorldScriptInput,
  countTranscriptWords,
  validateScoutBriefTranscript,
} from "./script-builder";
import type { ScoutCard } from "@/features/scout-card/types";
import type { ScoutBriefTranscript } from "@/features/scout-brief/types";

const mockCard = {
  cardVersionId: "card-test-01",
  projectId: "proj-test",
  runId: "run-01",
  researchVersion: 1,
  title: "Test Project",
  slug: "test-project",
  claimStatus: "approved",
  publishedAt: "2026-08-29T12:00:00Z",
  submissionLabel: "Direct Submission",
  completeness: "complete",
  hook: "A revolutionary animated pilot.",
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
  sourceIds: ["S1", "S2"],
  claimIds: ["claim-1", "claim-2"],
  evidenceClaims: [
    {
      id: "claim-1",
      statement: "Raised 200k on Kickstarter",
      status: "supported",
      sourceIds: ["S1"],
      qualification: null,
    },
    {
      id: "claim-2",
      statement: "Coproduction attached",
      status: "qualified",
      sourceIds: ["S2"],
      qualification: "Subject to tax credits",
    },
  ],
  sourceLedger: [
    {
      id: "S1",
      origin: "submitted",
      title: "Kickstarter",
      url: "https://kickstarter.com",
      publishedAt: "2026-08-29",
      retrievedAt: "2026-08-29",
      availability: "available",
      verificationStatus: "verified",
      supportsClaimIds: ["claim-1"],
      externalCommentary: false,
    },
    {
      id: "S2",
      origin: "parallel",
      title: "Trade Press",
      url: "https://animationmagazine.net",
      publishedAt: "2026-08-29",
      retrievedAt: "2026-08-29",
      availability: "available",
      verificationStatus: "verified",
      supportsClaimIds: ["claim-2"],
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
      rationale: "Great for streaming",
      supportingClaimIds: ["claim-1"],
      comparableSourceIds: [],
      strengths: [],
      risks: ["Budget scaling"],
      openQuestions: [],
      confidence: "high",
      nextExperiment: {
        title: "8-page bible",
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
      rationale: "Great for theatrical",
      supportingClaimIds: ["claim-2"],
      comparableSourceIds: [],
      strengths: [],
      risks: ["Scale"],
      openQuestions: [],
      confidence: "medium",
      nextExperiment: {
        title: "First draft",
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
      rationale: "Direct to fan",
      supportingClaimIds: [],
      comparableSourceIds: [],
      strengths: [],
      risks: ["Monetization"],
      openQuestions: [],
      confidence: "high",
      nextExperiment: {
        title: "Launch issue",
        hypothesis: "Hypothesis",
        method: "Method",
        participantAction: "Action",
        signal: "Signal",
        timebox: "2 weeks",
      },
    },
  ],
  missingSections: [],
  limitations: ["Test limitation"],
  externalSignals: [],
  industryLens: {
    pathwayIds: ["p1"],
    comparables: [],
    marketContext: "Context",
    realisticConstraints: "Constraints",
  },
} as unknown as ScoutCard;

describe("Scout Brief Script Builder & Validator", () => {
  it("builds a closed-world input strictly from the ScoutCard", () => {
    const input = buildClosedWorldScriptInput(mockCard);
    expect(input.projectId).toBe("proj-test");
    expect(input.title).toBe("Test Project");
    expect(input.pathways.length).toBe(3);
    expect(input.sources.length).toBe(2);
  });

  it("validates a complete, compliant 6-section transcript", () => {
    const validTranscript: ScoutBriefTranscript = {
      segments: [
        { order: 1, section: "hook", speaker: "Scout", text: "Welcome to the Scout Brief hook.", claimIds: ["claim-1"], sourceIds: ["S1"] },
        { order: 2, section: "project", speaker: "Analyst", text: "Here is the project overview and details.", claimIds: ["claim-1"], sourceIds: ["S1"] },
        { order: 3, section: "evidence", speaker: "Scout", text: "The evidence shows strong numbers and fans.", claimIds: ["claim-2"], sourceIds: ["S2"] },
        { order: 4, section: "uncertainty", speaker: "Analyst", text: "Here are the production uncertainties and risks.", claimIds: ["claim-2"], sourceIds: ["S2"] },
        { order: 5, section: "pathways", speaker: "Scout", text: "We have three distinct pathways mapped out.", claimIds: ["claim-1"], sourceIds: ["S1"] },
        { order: 6, section: "next_move", speaker: "Analyst", text: "The recommended next experiment is to test.", claimIds: ["claim-2"], sourceIds: ["S2"] },
      ],
      limitations: ["Testing risk 1"],
      disclosure: "AI-generated Scout Brief based on verified public evidence.",
    };

    const wordCount = countTranscriptWords(validTranscript.segments);
    expect(wordCount).toBeGreaterThan(20);

    const validation = validateScoutBriefTranscript(validTranscript, mockCard, 20, 1000);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("rejects transcript missing required sections or speaker balance", () => {
    const invalidTranscript: ScoutBriefTranscript = {
      segments: [
        { order: 1, section: "hook", speaker: "Scout", text: "Hook text", claimIds: [], sourceIds: [] },
        { order: 2, section: "evidence", speaker: "Scout", text: "Evidence text", claimIds: [], sourceIds: [] },
      ],
      limitations: [],
      disclosure: "Short",
    };

    const validation = validateScoutBriefTranscript(invalidTranscript, mockCard);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
