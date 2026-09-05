import { describe, it, expect } from "vitest";
import { createFallbackTranscript } from "@/services/scout-brief/gemini-script-generator";
import { validateScoutBriefTranscript, countTranscriptWords } from "@/services/scout-brief/script-builder";
import { wrapPcmToWav, extractPcmFromWav, createWavHeader } from "@/services/scout-brief/audio-processor";
import type { ScoutCard } from "@/features/scout-card/types";

describe("Audio Verification Matrix (AUDIENCE_TAKE_AUDIO_ANTIGRAVITY_HANDOFF)", () => {
  const junichiroCard: ScoutCard = {
    cardVersionId: "card-jj-v1",
    projectId: "proj-junichiro",
    runId: "run-jj",
    researchVersion: 1,
    title: "Junichiro Jackson",
    slug: "junichiro-jackson",
    claimStatus: "unclaimed",
    publishedAt: "2026-08-28T10:00:00Z",
    submissionLabel: "Community Nom",
    completeness: "complete",
    hook: "A kinetic hip-hop anime pilot set in futuristic Chicago.",
    projectType: "series",
    fallbackUsed: false,
    provenance: {
      submissionType: "fan",
      submittedSourceUrl: "https://youtube.com/watch?v=s8G7425lfKs",
      nominationLabel: "Fan nomination",
      nominatedByLabel: "Scout #1",
      researchedAt: "2026-08-28",
    },
    media: {
      state: "authorized_embed",
      title: "TeamTO Proof of Concept",
      sourceUrl: "https://youtube.com/watch?v=s8G7425lfKs",
      attribution: "Chaz Bottoms & TeamTO",
      accessibleFallback: "Animation teaser",
    },
    storyContext: {
      summary: "A courier must clear his name in futuristic Chicago.",
      storyworld: "Futuristic Chicago with hip-hop soundtrack.",
      themes: ["action", "hip-hop", "anime"],
      currentFormat: "Adult Animated Action Proof-of-Concept",
      audienceHooks: ["hip-hop", "anime"],
      claimIds: ["c-1"],
    },
    creatorContext: {
      displayName: "Chaz Bottoms",
      claimStatus: "unclaimed",
      summary: "Director of Junichiro Jackson",
      sourceIds: ["S1"],
      limitations: [],
    },
    sourceIds: ["S1", "S2"],
    claimIds: ["c-1", "c-2"],
    evidenceClaims: [
      {
        id: "c-1",
        statement: "Director partnered with TeamTO animation studio on the pilot.",
        status: "supported",
        sourceIds: ["S1"],
        qualification: null,
      },
      {
        id: "c-2",
        statement: "Raised Kickstarter pledges from 1,200 manga backers.",
        status: "supported",
        sourceIds: ["S2"],
        qualification: null,
      },
    ],
    sourceLedger: [
      {
        id: "S1",
        origin: "parallel",
        title: "Variety: Chaz Bottoms Teams with TeamTO",
        url: "https://variety.com/junichiro",
        publishedAt: "2026-08-28",
        retrievedAt: "2026-08-28",
        availability: "available",
        verificationStatus: "verified",
        supportsClaimIds: ["c-1"],
      },
      {
        id: "S2",
        origin: "parallel",
        title: "Kickstarter Campaign",
        url: "https://kickstarter.com/junichiro",
        publishedAt: "2026-08-28",
        retrievedAt: "2026-08-28",
        availability: "available",
        verificationStatus: "verified",
        supportsClaimIds: ["c-2"],
      },
    ],
    pathwayIds: ["pw-1"],
    pathways: [
      {
        id: "pw-1",
        order: 1,
        label: "Premium Adult Animated Series",
        format: "10-episode series",
        audience: "Anime & Hip-Hop fans",
        rationale: "Episodic format fits character universe",
        supportingClaimIds: ["c-1"],
        comparableSourceIds: [],
        strengths: [],
        risks: ["High budget scale required"],
        openQuestions: [],
        confidence: "high",
        nextExperiment: {
          title: "Animatic Table Read",
          hypothesis: "Live read validates comedic timing",
          method: "Community stream",
          participantAction: "Vote",
          signal: "80% consensus",
          timebox: "2 weeks",
        },
      },
    ],
    missingSections: [],
    limitations: ["Animation production budget and tax credits subject to studio diligence."],
    externalSignals: [],
  };

  const vampairCard: ScoutCard = {
    cardVersionId: "card-vampair-v1",
    projectId: "proj-vampair",
    runId: "run-vampair",
    researchVersion: 1,
    title: "The Vampair Series",
    slug: "vampair-series",
    claimStatus: "unclaimed",
    publishedAt: "2026-08-28T12:00:00Z",
    submissionLabel: "Community Nom",
    completeness: "complete",
    hook: "A gothic musical animated comedy series about eccentric vampires.",
    projectType: "series",
    fallbackUsed: false,
    provenance: {
      submissionType: "fan",
      submittedSourceUrl: "https://youtube.com/watch?v=vampair",
      nominationLabel: "Fan nomination",
      nominatedByLabel: "Scout #2",
      researchedAt: "2026-08-28",
    },
    media: {
      state: "authorized_embed",
      title: "Vampair Teaser",
      sourceUrl: "https://youtube.com/watch?v=vampair",
      attribution: "Daria Cohen",
      accessibleFallback: "Animation video",
    },
    storyContext: {
      summary: "Gothic comedy series following vampire protagonists.",
      storyworld: "Gothic musical comedy.",
      themes: ["vampires", "musical", "comedy"],
      currentFormat: "Independent Digital Animation Series",
      audienceHooks: ["gothic style", "musical"],
      claimIds: ["vc-1"],
    },
    creatorContext: {
      displayName: "Daria Cohen",
      claimStatus: "unclaimed",
      summary: "Independent animator",
      sourceIds: ["VS1"],
      limitations: ["Creator has not formally claimed profile."],
    },
    sourceIds: ["VS1"],
    claimIds: ["vc-1"],
    evidenceClaims: [
      {
        id: "vc-1",
        statement: "Independent YouTube animated shorts generated over 15 million views across episodes.",
        status: "supported",
        sourceIds: ["VS1"],
        qualification: null,
      },
    ],
    sourceLedger: [
      {
        id: "VS1",
        origin: "submitted",
        title: "YouTube Channel: Daria Cohen",
        url: "https://youtube.com/channel/dariacohen",
        publishedAt: "2026-08-28",
        retrievedAt: "2026-08-28",
        availability: "available",
        verificationStatus: "verified",
        supportsClaimIds: ["vc-1"],
      },
    ],
    pathwayIds: ["vpw-1"],
    pathways: [
      {
        id: "vpw-1",
        order: 1,
        label: "Direct-to-Audience Web Series",
        format: "Digital Animation",
        audience: "Animation enthusiasts",
        rationale: "High fandom loyalty",
        supportingClaimIds: ["vc-1"],
        comparableSourceIds: [],
        strengths: [],
        risks: ["Commercial monetization unproven"],
        openQuestions: [],
        confidence: "medium",
        nextExperiment: {
          title: "Creator outreach for series bible review",
          hypothesis: "Creator is open to co-production",
          method: "Direct contact",
          participantAction: "Respond",
          signal: "Meeting agreed",
          timebox: "2 weeks",
        },
      },
    ],
    decisionBrief: {
      whyInvestigate: "Massive digital audience for indie gothic animation.",
      materialUncertainty: "Rights ownership and creator commercial availability remain unverified.",
      nextDiligenceStep: "Confirm creator rights ownership and representation before proposing co-production.",
    },
    missingSections: [],
    limitations: ["No verified production budget exists in public record."],
    externalSignals: [],
  };

  it("generates concise Discovery brief (60-90s, 130-190 words) leading with project and premise", () => {
    const discoverTranscript = createFallbackTranscript(junichiroCard, "discover");
    expect(discoverTranscript.variant).toBe("discover");
    expect(discoverTranscript.segments).toHaveLength(4);

    const spoken = discoverTranscript.segments.map((s) => s.text).join(" ");
    const words = countTranscriptWords(discoverTranscript.segments);

    // No welcome monologue
    expect(spoken).not.toContain("Welcome to Audience Take");
    expect(spoken).not.toContain("That is right, Scout");

    // Leads with project title
    expect(discoverTranscript.segments[0].text).toContain("Junichiro Jackson");
    expect(discoverTranscript.segments[0].text).toContain("Chaz Bottoms");

    // Word count in target range [100, 200]
    expect(words).toBeGreaterThanOrEqual(70);
    expect(words).toBeLessThanOrEqual(220);

    const validation = validateScoutBriefTranscript(discoverTranscript, junichiroCard, 50, 350);
    expect(validation.valid).toBe(true);
  });

  it("generates Professional brief with ONE next diligence action and zero mechanical 3-pathway lists", () => {
    const proTranscript = createFallbackTranscript(junichiroCard, "pro");
    expect(proTranscript.variant).toBe("pro");

    const spoken = proTranscript.segments.map((s) => s.text).join(" ");

    // Must NOT contain mechanical 3-pathway list
    expect(spoken).not.toContain("first, Standard episodic; second, Independent feature; third, Direct-to-audience");
    expect(spoken).not.toContain("three distinct development pathways: first");

    // Mentions real single next diligence action
    expect(spoken).toContain("Animatic Table Read");
    expect(spoken).toContain("TeamTO");

    const words = countTranscriptWords(proTranscript.segments);
    expect(words).toBeGreaterThanOrEqual(130);
    expect(words).toBeLessThanOrEqual(350);
  });

  it("prevents false certainty in Vampair: no 'de-risked' claims, no manufactured unit costs", () => {
    const vampairPro = createFallbackTranscript(vampairCard, "pro");
    const spoken = vampairPro.segments.map((s) => s.text).join(" ");

    expect(spoken).not.toContain("de-risked institutional opportunity");
    expect(spoken).not.toContain("twenty thousand euros per minute");
    expect(spoken).not.toContain("€/min");

    // Preserves material uncertainty
    expect(spoken).toContain("Rights ownership and creator commercial availability remain unverified");
    // Single next diligence step
    expect(spoken).toContain("Confirm creator rights ownership and representation before proposing co-production");
  });

  it("handles unfamiliar evidence-poor project truthfully without hallucinating or cross-contaminating", () => {
    const unfamiliarCard: ScoutCard = {
      cardVersionId: "card-unfamiliar-v1",
      projectId: "proj-unfamiliar",
      runId: "run-unfamiliar",
      researchVersion: 1,
      title: "Unknown Indie Short",
      slug: "unknown-indie-short",
      claimStatus: "unclaimed",
      publishedAt: "2026-08-30T00:00:00Z",
      submissionLabel: "Community Nom",
      completeness: "minimal",
      hook: "A minimalist sci-fi short film filmed in an abandoned grain elevator.",
      projectType: "short",
      fallbackUsed: true,
      provenance: {
        submissionType: "fan",
        submittedSourceUrl: "https://vimeo.com/unknown",
        nominationLabel: "Fan nomination",
        nominatedByLabel: "Anonymous",
        researchedAt: "2026-08-30",
      },
      storyContext: {
        summary: "A lone explorer finds an artifact in a silo.",
        storyworld: "Post-industrial Midwest.",
        themes: ["isolation", "sci-fi"],
        currentFormat: "Live Action Short",
        audienceHooks: ["sci-fi", "minimalism"],
        claimIds: [],
      },
      creatorContext: {
        displayName: "Anonymous Director",
        claimStatus: "unclaimed",
        summary: "Emerging filmmaker",
        sourceIds: [],
        limitations: ["No verified track record available."],
      },
      sourceIds: [],
      claimIds: [],
      evidenceClaims: [],
      sourceLedger: [],
      pathwayIds: [],
      pathways: [],
      decisionBrief: {
        whyInvestigate: "Visual style shows strong cinematography potential.",
        materialUncertainty: "No commercial metrics or proven production capability.",
        nextDiligenceStep: "Request director's reel and pitch deck for review.",
      },
      missingSections: ["creatorContext", "pathways"],
      limitations: ["Minimal public sources available."],
      externalSignals: [],
    };

    const discover = createFallbackTranscript(unfamiliarCard, "discover");
    const discoverSpoken = discover.segments.map((s) => s.text).join(" ");
    expect(discoverSpoken).not.toContain("Junichiro");
    expect(discoverSpoken).not.toContain("TeamTO");
    expect(discoverSpoken).toContain("The project is building early grassroots attention among core genre enthusiasts");
    expect(discoverSpoken).toContain("Unknown Indie Short");

    const pro = createFallbackTranscript(unfamiliarCard, "pro");
    const proSpoken = pro.segments.map((s) => s.text).join(" ");
    expect(proSpoken).not.toContain("Junichiro");
    expect(proSpoken).not.toContain("TeamTO");
    expect(proSpoken).toContain("verified commercial metrics and financing figures remain unconfirmed");
    expect(proSpoken).toContain("Request director's reel and pitch deck for review");
    expect(proSpoken).toContain("No commercial metrics or proven production capability");

    const validation = validateScoutBriefTranscript(discover, unfamiliarCard, 50, 350);
    expect(validation.valid).toBe(true);
  });

  it("audio container unwrap guarantees single RIFF header and eliminates nested headers", () => {
    // Construct fake nested WAV: WAV container inside WAV
    const innerPcm = Buffer.alloc(48000, 0x11); // 1 second mono 24kHz
    const innerHeader = createWavHeader(innerPcm.length, 24000);
    const innerWav = Buffer.concat([innerHeader, innerPcm]);

    // Extract pure PCM
    const cleanPcm = extractPcmFromWav(innerWav);
    expect(cleanPcm.length).toBe(innerPcm.length);
    expect(cleanPcm.subarray(0, 4).toString("ascii")).not.toBe("RIFF");

    // Wrap to single WAV container
    const result = wrapPcmToWav(cleanPcm.toString("base64"), 24000);
    expect(result.wavBuffer.subarray(0, 4).toString("ascii")).toBe("RIFF");

    // Scan for any second RIFF header
    const secondRiffIndex = result.wavBuffer.indexOf(Buffer.from("RIFF"), 4);
    expect(secondRiffIndex).toBe(-1);
  });
});
