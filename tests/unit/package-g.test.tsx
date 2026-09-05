import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { createFallbackTranscript } from "@/services/scout-brief/gemini-script-generator";
import { validateScoutBriefTranscript, countTranscriptWords } from "@/services/scout-brief/script-builder";
import { TrailerCritic } from "@/features/scout-card/trailer-critic";
import { analyzeAudienceComments } from "@/critic/audience-comment-analyzer";
import type { ScoutCard } from "@/features/scout-card/types";

describe("Package G: Honest Media, Video Critic & Audio Status", () => {
  const mockIndieDocCard: ScoutCard = {
    cardVersionId: "card-doc-01",
    projectId: "proj-indie-doc",
    runId: "run-doc-01",
    researchVersion: 1,
    title: "Deep Sea Echoes",
    slug: "deep-sea-echoes",
    claimStatus: "approved",
    publishedAt: "2026-08-30T12:00:00Z",
    submissionLabel: "Direct Creator Submission",
    completeness: "complete",
    hook: "An intimate documentary investigating acoustic pollution in ocean trenches.",
    projectType: "film",
    fallbackUsed: false,
    provenance: {
      submissionType: "creator",
      submittedSourceUrl: "https://vimeo.com/123456",
      nominationLabel: "Creator Submission",
      nominatedByLabel: "Lead Director",
      researchedAt: "2026-08-30",
    },
    media: {
      state: "authorized_embed",
      title: "Ocean Audio Teaser",
      sourceUrl: "https://vimeo.com/123456",
      embedUrl: "https://vimeo.com/123456",
      attribution: "Marine Media Lab",
      accessibleFallback: "Audio teaser description",
    },
    storyContext: {
      summary: "Exploring soundscapes of the Mariana trench.",
      storyworld: "Ocean deep",
      themes: ["environmental science", "oceanography"],
      currentFormat: "Feature Documentary",
      audienceHooks: ["marine life", "sound design"],
      claimIds: ["claim-doc-1"],
    },
    creatorContext: {
      displayName: "Dr. Elena Rostova",
      claimStatus: "approved",
      summary: "Marine biologist and sound artist",
      sourceIds: ["source-1"],
      limitations: ["Based on verified director interview and submitted work."],
    },
    sourceIds: ["source-1"],
    claimIds: ["claim-doc-1"],
    evidenceClaims: [
      {
        id: "claim-doc-1",
        statement: "Official selection at Sundance 2026 New Frontier exhibition.",
        status: "supported",
        sourceIds: ["source-1"],
        qualification: null,
      },
    ],
    sourceLedger: [
      {
        id: "source-1",
        origin: "submitted",
        title: "Sundance Film Festival Listing",
        url: "https://sundance.org/projects/deep-sea-echoes",
        publishedAt: "2026-01-15",
        retrievedAt: "2026-08-30",
        availability: "available",
        verificationStatus: "verified",
        sourceRole: "festival_selection",
        sourceTier: "primary",
        supportsClaimIds: ["claim-doc-1"],
      },
    ],
    pathwayIds: ["pw-doc-1", "pw-doc-2", "pw-doc-3"],
    pathways: [
      {
        id: "pw-doc-1",
        order: 1,
        label: "Impact Documentary Theatrical Roadshow",
        format: "Feature Documentary",
        audience: "Science & Environmental Cinephiles",
        rationale: "High spatial audio appeal in premium auditoriums",
        supportingClaimIds: ["claim-doc-1"],
        comparableSourceIds: [],
        strengths: ["Unique hydrophone audio capture"],
        risks: ["Niche commercial distribution window"],
        openQuestions: ["Spatial audio playback compatibility in mid-tier venues"],
        confidence: "high",
        nextExperiment: {
          title: "Hold 3-city museum spatial audio preview",
          hypothesis: "Audiences will travel for immersive sound exhibition",
          method: "Ticketed museum gallery soundings",
          participantAction: "Purchase ticket & attend",
          signal: "85% capacity across 3 events",
          timebox: "4 weeks",
        },
      },
      {
        id: "pw-doc-2",
        order: 2,
        label: "Educational Public Broadcast & Streaming Acquisition",
        format: "Broadcast Hour",
        audience: "PBS Nature / BBC Natural History viewers",
        rationale: "Broad institutional education appeal",
        supportingClaimIds: [],
        comparableSourceIds: [],
        strengths: ["Curricular integration"],
        risks: ["Lower upfront license fee"],
        openQuestions: ["Non-exclusive educational windowing"],
        confidence: "medium",
        nextExperiment: {
          title: "Educational screener test with 10 universities",
          hypothesis: "Department heads will request campus license",
          method: "Digital screener package with study guide",
          participantAction: "Request license quote",
          signal: "5+ quotes requested",
          timebox: "3 weeks",
        },
      },
      {
        id: "pw-doc-3",
        order: 3,
        label: "Immersive VR & Spatial Audio Installation",
        format: "Location-Based Experience",
        audience: "Immersive Art & Science Centers",
        rationale: "Direct monetization of ambisonic audio recordings",
        supportingClaimIds: [],
        comparableSourceIds: [],
        strengths: ["Long tail exhibition"],
        risks: ["Hardware dependency"],
        openQuestions: ["Touring exhibition licensing costs"],
        confidence: "medium",
        nextExperiment: {
          title: "Gallery audio installation pilot",
          hypothesis: "Science center visitors will pay admission upgrade",
          method: "Headphone-based dark room pilot",
          participantAction: "Upgrade admission",
          signal: "30% upgrade take rate",
          timebox: "2 weeks",
        },
      },
    ],
    missingSections: [],
    limitations: ["Documentary impact metrics subject to broadcast window."],
    externalSignals: [],
  };

  it("generates truthful audio brief transcript strictly grounded in card without Junichiro or animation fabrications", () => {
    const transcript = createFallbackTranscript(mockIndieDocCard);

    expect(transcript).toBeDefined();
    expect(transcript.segments.length).toBe(6);

    const fullSpokenText = transcript.segments.map((s) => s.text).join(" ");

    // Must NOT contain Junichiro Jackson or 2D animation mock figures
    expect(fullSpokenText).not.toContain("Junichiro");
    expect(fullSpokenText).not.toContain("two hundred and twenty thousand euros");
    expect(fullSpokenText).not.toContain("Kickstarter");
    expect(fullSpokenText).not.toContain("eighteen to twenty-five thousand euros");
    expect(fullSpokenText).not.toContain("European animation tax credits");
    expect(fullSpokenText).not.toContain("vinyl original soundtrack");
    expect(fullSpokenText).not.toContain("2D animation");

    // MUST mention the actual project title and real pathways
    expect(fullSpokenText).toContain("Deep Sea Echoes");
    expect(fullSpokenText).toContain("Impact Documentary Theatrical Roadshow");
    expect(fullSpokenText).toContain("Hold 3-city museum spatial audio preview");
    expect(fullSpokenText).toContain("Sundance 2026");

    // Must pass closed-world transcript validator
    const wordCount = countTranscriptWords(transcript.segments);
    expect(wordCount).toBeGreaterThanOrEqual(100);
    expect(wordCount).toBeLessThanOrEqual(1500);

    const validation = validateScoutBriefTranscript(transcript, mockIndieDocCard, 100, 1500);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("renders honest empty state when trailer critic has no timestamped beats", () => {
    const emptyAnalysis = {
      artifactId: "critic-test-empty",
      projectId: "proj-test",
      sourceId: "source-1",
      youtubeUrl: "https://youtube.com/watch?v=123",
      youtubeVideoId: "123",
      modelId: "gemini-3.7-flash",
      analysisVersion: 1,
      cardVersionId: "card-1",
      structuralNarrative: {
        genreSignaling: "Documentary",
        narrativeDelivery: "Audiovisual scene development",
        trailerType: "Teaser Preview",
        beats: [], // Empty beats!
      },
      technicalCraft: {
        editingAndPace: "Unavailable",
        cinematographyAndFraming: "Unavailable",
        soundAndScore: "Unavailable",
        graphicsAndTitles: "Unavailable",
      },
      marketingPersuasion: {
        uniqueSellingProposition: "Documentary inquiry",
        targetAudienceHypothesis: "Cinephiles",
        conceptVsStarEmphasis: "Concept led",
        representationCaveat: "Unverified",
      },
      emotionalRhetorical: {
        emotionalHook: "Curiosity",
        toneAndMoodBalance: "Solemn",
        persuasiveArgument: "Watch film",
      },
      matrix: [
        { category: "genre" as const, analysis: "Documentary" },
        { category: "narrative_stance" as const, analysis: "Observational" },
        { category: "usp" as const, analysis: "Unique access" },
        { category: "target_audience" as const, analysis: "Audience" },
        { category: "sound_music" as const, analysis: "Diegetic" },
        { category: "camera_editing" as const, analysis: "Paced" },
      ],
      sourceIds: ["source-1"],
      limitations: ["No audiovisual stream parsed."],
      analyzedAt: "2026-08-30",
      visibility: "public" as const,
    };

    render(
      <TrailerCritic
        analyses={[emptyAnalysis]}
        sourceLabels={new Map([["source-1", "[S1]"]])}
      />
    );

    expect(screen.getByText("No audiovisual timestamped beats available for this media source.")).toBeDefined();
  });

  it("records sampleSize and samplingLimitations in audience comment analysis", async () => {
    // 1. Empty comments
    const emptyResult = await analyzeAudienceComments([]);
    expect(emptyResult.sampleSize).toBe(0);
    expect(emptyResult.samplingLimitations).toContain("No public comments available to sample");
    expect(emptyResult.organicVsBrigadedFlag).toBe("insufficient_sample");
    expect(emptyResult.sentimentScore).toBe(0);
  });
});
