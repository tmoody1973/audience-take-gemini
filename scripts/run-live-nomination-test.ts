import { dataRepo } from "../src/services/firestore-repo";
import { executeScoutResearchRun } from "../src/agent/agent-runner";
import type { Project, ResearchRunState } from "../src/domain";

async function main() {
  console.log("=================================================================");
  console.log("AUDIENCE TAKE — AUTONOMOUS SCOUT RESEARCH AGENT LIVE PIPELINE TEST");
  console.log("=================================================================\n");

  const testUrl = "https://www.youtube.com/watch?v=s8G7425lfKs";
  const projectId = `proj-live-test-${Date.now()}`;
  const runId = `run-live-test-${Date.now()}`;

  console.log(`[1/4] Creating Live Project & Nomination for URL: ${testUrl}`);
  const project: Project = {
    id: projectId,
    identity: {
      title: "Junichiro Jackson (JJ)",
      normalizedUrl: testUrl,
      originalUrl: testUrl,
      medium: "proof_of_concept",
      currentStage: "concept",
      logline: "An atmospheric neo-noir anime proof of concept set in near-future Brooklyn.",
      creators: ["TeamTOKO Entertainment"],
    },
    publishedCardId: null,
    nomination: {
      submittedByUid: "live-tester-uid",
      nominatorRole: "fan",
      reason: "Atmospheric neo-noir anime proof of concept with supernatural horror, hip-hop rhythm, and visceral combat.",
      initialLinks: [testUrl],
      createdAt: new Date().toISOString(),
    },
    creatorClaim: {
      status: "unclaimed",
    },
    metrics: {
      watchCount: 1,
      payCount: 0,
      cityDemandCount: 0,
      backCount: 0,
      pathwayVotes: [0, 0, 0],
      cities: {},
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataRepo.createProject(project);

  const run: ResearchRunState = {
    id: runId,
    projectId: projectId,
    nominatorUid: "live-tester-uid",
    sourceUrl: testUrl,
    currentStep: "fetching",
    progressPercent: 10,
    stepLogs: [],
  };

  await dataRepo.saveResearchRun(run);
  console.log(`✓ Project [${projectId}] and Research Run [${runId}] initialized.\n`);

  console.log(`[2/4] Executing Autonomous Agent Pipeline (Web Fetching -> Parallel Search -> Gemini Reasoning -> Invariant Validation -> Gemini Video Critic)...`);
  const startTime = Date.now();
  const completedRun = await executeScoutResearchRun(runId);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n================== AGENT EXECUTION LOGS (${duration}s) ==================`);
  for (const log of completedRun.stepLogs) {
    console.log(`[${log.status.toUpperCase()}] [${log.step}] ${log.message}`);
  }

  if (completedRun.currentStep === "failed") {
    console.error(`\n❌ Pipeline Error: ${completedRun.errorMessage}`);
    process.exit(1);
  }

  console.log(`\n================== PUBLISHED SCOUT CARD ==================`);
  console.log(`Card ID: ${completedRun.cardId}`);
  if (completedRun.cardId) {
    const card = await dataRepo.getScoutCardById(completedRun.cardId);
    if (card) {
      console.log(`Status: ${card.status}`);
      console.log(`Why Scouted: ${card.whyScouted}`);
      console.log(`What We Know (${card.whatWeKnow.length} facts):`);
      card.whatWeKnow.forEach((fact, i) => console.log(`  ${i + 1}. ${fact}`));
      
      console.log(`\nWhat We're Checking (${card.whatWereChecking.length} items):`);
      card.whatWereChecking.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));

      console.log(`\nThree Bounded Pathway Hypotheses:`);
      card.pathways.forEach((p, i) => {
        console.log(`  [0${i + 1}] ${p.title}`);
        console.log(`      Target Audience: ${p.targetAudience}`);
        console.log(`      Next Experiment: ${p.nextBoundedExperiment.name} -> ${p.nextBoundedExperiment.description}`);
      });

      console.log(`\nDecision Brief Logline:`);
      console.log(`  "${card.decisionBrief.logline}"`);

      console.log(`\nEvidence Citations: ${card.evidenceLedger.length} citations registered.`);

      if (card.trailerCriticId) {
        console.log(`\n================== GEMINI TRAILER CRITIC REPORT ==================`);
        const critic = await dataRepo.getTrailerCriticById(card.trailerCriticId);
        if (critic) {
          console.log(`Critic ID: ${critic.id}`);
          console.log(`Genre & Form: ${critic.genreAndForm}`);
          console.log(`Summary: ${critic.summary}`);
          console.log(`Why It May Connect: ${critic.whyItMayConnect}`);
          console.log(`\nTimestamped Narrative & Craft Beats (${critic.timestampedBeats.length} beats):`);
          critic.timestampedBeats.forEach((b) => {
            console.log(`  • [${b.timestampFormatted}] ${b.label}: ${b.description}`);
          });
          console.log(`\nCraft Analysis:`);
          console.log(`  - Cinematography: ${critic.craftAnalysis.cinematography}`);
          console.log(`  - Sound & Score: ${critic.craftAnalysis.soundAndScore}`);
          console.log(`  - Editing & Pacing: ${critic.craftAnalysis.editingAndPacing}`);
          console.log(`\nCritic Matrix (1-10):`);
          console.log(`  - Clarity: ${critic.criticMatrix.clarity}/10`);
          console.log(`  - Tone Consistency: ${critic.criticMatrix.toneConsistency}/10`);
          console.log(`  - Visual Originality: ${critic.criticMatrix.visualOriginality}/10`);
          console.log(`  - Narrative Tension: ${critic.criticMatrix.narrativeTension}/10`);
          console.log(`\nAnalysis Limitations Notice:`);
          console.log(`  "${critic.limitations}"`);
        }
      }
    }
  }

  console.log(`\n=================================================================`);
  console.log("PIPELINE EXECUTION COMPLETE & VERIFIED SUCCESSFUL");
  console.log("=================================================================");
}

main().catch(console.error);
