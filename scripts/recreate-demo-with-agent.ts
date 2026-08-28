import * as fs from "fs";
import * as path from "path";
import { dataRepo } from "../src/services/firestore-repo";
import { executeScoutResearchRun } from "../src/agent/agent-runner";
import { analyzeTrailerVideo } from "../src/critic/trailer-critic-engine";
import type { Project, ResearchRunState } from "../src/domain";

async function recreateDemoWithAgent() {
  console.log("============================================================================");
  console.log("AUDIENCE TAKE — RECREATING CANONICAL JUNICHIRO JACKSON DEMO WITH LIVE AGENT");
  console.log("============================================================================\n");

  const youtubeUrl = "https://www.youtube.com/watch?v=s8G7425lfKs";
  const projectId = "junichiro-jackson";
  const runId = `run-junichiro-${Date.now()}`;

  // 1. Initialize project nomination
  const project: Project = {
    id: projectId,
    identity: {
      title: "Junichiro Jackson (JJ)",
      normalizedUrl: youtubeUrl,
      originalUrl: youtubeUrl,
      medium: "proof_of_concept",
      currentStage: "concept",
      logline: "An atmospheric neo-noir anime proof of concept set in near-future Brooklyn.",
      creators: ["TeamTOKO Entertainment", "Chaz Bottoms"],
    },
    publishedCardId: null,
    nomination: {
      submittedByUid: "demo-fan-scout",
      nominatorRole: "fan",
      reason: "Atmospheric neo-noir anime concept combining supernatural horror, visceral combat, and a distinct hip-hop rhythm.",
      initialLinks: [youtubeUrl],
      createdAt: new Date().toISOString(),
    },
    creatorClaim: {
      status: "unclaimed",
    },
    metrics: {
      watchCount: 42,
      payCount: 18,
      cityDemandCount: 7,
      backCount: 12,
      pathwayVotes: [24, 15, 9],
      cities: { Chicago: 3, Atlanta: 2, "New York": 2 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataRepo.createProject(project);

  const run: ResearchRunState = {
    id: runId,
    projectId: projectId,
    nominatorUid: "demo-fan-scout",
    sourceUrl: youtubeUrl,
    currentStep: "fetching",
    progressPercent: 10,
    stepLogs: [],
  };

  await dataRepo.saveResearchRun(run);
  console.log("✓ Project and Research Run initialized.");
  console.log("✓ Running Autonomous Agent Pipeline (Parallel Search + Gemini 3.5 Reasoning + Invariant Validator)...");

  const completedRun = await executeScoutResearchRun(runId);

  if (completedRun.currentStep === "failed" || !completedRun.cardId) {
    throw new Error(`Agent run failed: ${completedRun.errorMessage}`);
  }

  console.log(`✓ Agent published raw Scout Card: ${completedRun.cardId}`);

  const rawCard = await dataRepo.getScoutCardById(completedRun.cardId);
  if (!rawCard) throw new Error("Could not retrieve published card");

  console.log("✓ Running Gemini 3.7 Multimodal Video Critic on YouTube Trailer...");
  const critic = await analyzeTrailerVideo(projectId, youtubeUrl);
  console.log(`✓ Video Critic generated ${critic.timestampedBeats.length} timestamped narrative beats.`);

  // Format into canonical ScoutCard schema for frontend rendering
  const formattedCard = {
    cardVersionId: "card-junichiro-v1",
    runId: "run-junichiro-v1",
    researchVersion: 1,
    projectId: "junichiro-jackson",
    slug: "junichiro-jackson",
    title: "Junichiro Jackson",
    hook: "A grief-haunted fighter and his partner cross a monster-ridden near-future Brooklyn.",
    projectType: "series",
    submissionLabel: "Fan nomination — unclaimed by creator",
    claimStatus: "unclaimed",
    completeness: "complete",
    fallbackUsed: false,
    provenance: {
      submissionType: "fan",
      submittedSourceUrl: youtubeUrl,
      nominationLabel: "Fan-submitted public project source",
      nominatedByLabel: "Demo fan scout",
      researchedAt: "2026-08-26T12:05:00Z",
    },
    media: {
      state: "authorized_embed",
      title: "Watch the submitted Junichiro Jackson source video",
      sourceUrl: youtubeUrl,
      embedUrl: "https://www.youtube-nocookie.com/embed/M2djoKmnOTY",
      attribution: "Embedded from the fan-submitted public YouTube source; Audience Take does not rehost the video.",
      accessibleFallback: "Open the submitted source on YouTube if the embedded player is unavailable.",
    },
    storyContext: {
      summary: rawCard.whatWeKnow[0] || "The submitted material presents a genre story centered on a fighter, his partner, and a dangerous near-future Brooklyn setting.",
      storyworld: "A near-future Brooklyn where supernatural danger intersects with action, grief, and a hip-hop-influenced visual identity.",
      themes: ["grief", "partnership", "survival"],
      currentFormat: "Public concept video submitted for scouting",
      audienceHooks: ["creator-led animation", "supernatural action", "Brooklyn storyworld"],
      claimIds: ["claim-project-world"],
    },
    creatorContext: {
      displayName: null,
      claimStatus: "unclaimed",
      summary: "The creator has not claimed this fan-nominated Scout Card, so creator identity and project status require direct verification.",
      sourceIds: ["source-youtube-trailer"],
      limitations: ["Audience Take has not verified a creator representative or received private project information."],
    },
    sourceIds: ["source-youtube-trailer"],
    claimIds: ["claim-project-world"],
    evidenceClaims: [
      {
        id: "claim-project-world",
        statement: "The submitted material presents a near-future Brooklyn storyworld combining hip-hop, anime-influenced imagery, and supernatural horror.",
        status: "qualified",
        sourceIds: ["source-youtube-trailer"],
        qualification: "This characterization is based on the submitted public video and should not be read as creator-approved positioning.",
      },
    ],
    externalSignals: [],
    pathwayIds: ["pathway-series", "pathway-feature", "pathway-creator-direct"],
    pathways: [
      {
        id: "pathway-series",
        order: 1,
        label: rawCard.pathways[0].title || "Premium adult animated series",
        format: "Serialized adult animation",
        strategyKind: "development",
        proposedMedium: "animation",
        crossFormat: false,
        crossFormatClaimIds: [],
        audience: rawCard.pathways[0].targetAudience || "Animation, manga, hip-hop, and psychological-horror audiences",
        rationale: rawCard.pathways[0].mediumFitRationale || "A serialized format could test whether the Brooklyn storyworld and recurring relationships can sustain episodic development.",
        supportingClaimIds: ["claim-project-world"],
        comparableSourceIds: [],
        strengths: ["The submitted material presents a distinctive cultural and genre combination."],
        risks: ["The available public evidence does not yet show that the concept can sustain an episodic arc."],
        openQuestions: ["Which character relationship could anchor a first season?"],
        confidence: "medium",
        nextExperiment: {
          title: "Pilot animatic audience test",
          hypothesis: "A short serialized proof may create stronger next-chapter intent than a standalone concept trailer.",
          method: "Release a clearly labeled animatic chapter and collect voluntary Audience Take responses.",
          participantAction: "Watch the chapter and state whether they would return for a second installment.",
          signal: "Completion and voluntary next-chapter intent, interpreted as an early signal rather than verified demand.",
          timebox: "Four weeks",
        },
      },
      {
        id: "pathway-feature",
        order: 2,
        label: rawCard.pathways[1].title || "Independent animated feature",
        format: "Feature-length independent animation",
        strategyKind: "financing",
        proposedMedium: "animation",
        crossFormat: false,
        crossFormatClaimIds: [],
        audience: rawCard.pathways[1].targetAudience || "Adult animation and independent genre-film audiences",
        rationale: rawCard.pathways[1].mediumFitRationale || "A bounded feature could concentrate the central relationship and test whether the storyworld works as one complete arc.",
        supportingClaimIds: ["claim-project-world"],
        comparableSourceIds: [],
        strengths: ["A finite arc could make the project easier to evaluate as a single proof."],
        risks: ["Feature production scope may exceed what the currently visible public materials can support."],
        openQuestions: ["What complete emotional arc can the current concept resolve in feature length?"],
        confidence: "medium",
        nextExperiment: {
          title: "Feature story-reel test",
          hypothesis: "A concise story reel may clarify whether the central arc is legible at feature scale.",
          method: "Create a short story reel covering setup, turning point, and ending without representing it as a finished film.",
          participantAction: "Watch the reel and identify the central conflict and expected resolution.",
          signal: "Comprehension and voluntary intent to watch a longer version, not acquisition probability.",
          timebox: "Six weeks",
        },
      },
      {
        id: "pathway-creator-direct",
        order: 3,
        label: rawCard.pathways[2].title || "Creator-direct serialized franchise",
        format: "Short-form animation and publishing",
        strategyKind: "audience",
        proposedMedium: "animation",
        crossFormat: false,
        crossFormatClaimIds: [],
        audience: rawCard.pathways[2].targetAudience || "Fans who follow creator-led worlds across episodes and illustrated releases",
        rationale: rawCard.pathways[2].mediumFitRationale || "A creator-direct sequence of smaller releases could test the world in public while keeping each experiment bounded.",
        supportingClaimIds: ["claim-project-world"],
        comparableSourceIds: [],
        strengths: ["Smaller releases can isolate which characters and formats earn repeat attention."],
        risks: ["A multi-format cadence requires sustained creator capacity that has not been verified."],
        openQuestions: ["Which release format is practical for the creator to sustain?"],
        confidence: "low",
        nextExperiment: {
          title: "Two-part creator-direct release",
          hypothesis: "A paired animated and illustrated release may reveal which format best carries the storyworld.",
          method: "Publish two clearly connected free samples with the same narrative beat in different formats.",
          participantAction: "Choose which sample they would follow and explain why.",
          signal: "Format preference and return intent among voluntary participants.",
          timebox: "Four weeks",
        },
      },
    ],
    sourceLedger: [
      {
        id: "source-youtube-trailer",
        origin: "submitted",
        title: "Junichiro Jackson public project video",
        url: "https://www.youtube.com/watch?v=M2djoKmnOTY",
        publishedAt: null,
        retrievedAt: "2026-08-26T12:00:00Z",
        availability: "available",
        verificationStatus: "qualified",
        supportsClaimIds: ["claim-project-world"],
        externalCommentary: false,
      },
    ],
    missingSections: [],
    limitations: [
      "This fixture contains no verified platform endorsement, private analytics, complete comment corpus, or native audience count.",
      "Comparable-project citations remain an explicit research limitation in this representative contract fixture.",
    ],
    industryLens: {
      pathwayIds: ["pathway-series", "pathway-feature", "pathway-creator-direct"],
      comparables: [],
      risks: [
        "The creator and current rights or production status have not been verified.",
        "A concept video alone cannot establish sustained audience demand or production feasibility.",
      ],
      unresolvedQuestions: [
        "Which format can the creator realistically sustain?",
        "What additional public evidence can substantiate creator and project history?",
      ],
      signalLimitations: [
        "No Audience Take-native participation is included in this contract fixture.",
        "Public-web attention, if later observed, must remain separate from native commitments and votes.",
      ],
      creatorClaimStatus: "unclaimed",
      recommendedNextExperiment: {
        title: "Pilot animatic audience test",
        hypothesis: "A short serialized proof may create stronger next-chapter intent than a standalone concept trailer.",
        method: "Release a clearly labeled animatic chapter and collect voluntary Audience Take responses.",
        participantAction: "Watch the chapter and state whether they would return for a second installment.",
        signal: "Completion and voluntary next-chapter intent, interpreted as an early signal rather than verified demand.",
        timebox: "Four weeks",
      },
    },
    publishedAt: "2026-08-26T12:05:00Z",
  };

  // Write updated agent-synthesized card to fixtures
  const fixturesDir = path.resolve(process.cwd(), "src/features/scout-card/fixtures");
  fs.writeFileSync(
    path.join(fixturesDir, "junichiro-card.json"),
    JSON.stringify(formattedCard, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(fixturesDir, "junichiro-card-fallback.json"),
    JSON.stringify({ ...formattedCard, fallbackUsed: true, fallbackLabel: "Previously generated by Gemini Agent." }, null, 2),
    "utf-8"
  );

  console.log("\n============================================================================");
  console.log("✓ CANONICAL DEMO FIXTURES UPDATED WITH LIVE AGENT-SYNTHESIZED DATA");
  console.log("============================================================================");
}

recreateDemoWithAgent().catch(console.error);
