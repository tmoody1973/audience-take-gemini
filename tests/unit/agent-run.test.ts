import { describe, it, expect } from "vitest";
import { dataRepo } from "@/services/firestore-repo";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import type { Project, ResearchRunState } from "@/domain";

describe("Autonomous Scout Research Agent Pipeline", () => {
  it("executes a complete research run and publishes a verified Scout Card", async () => {
    const projectId = `proj-test-${Date.now()}`;
    const runId = `run-test-${Date.now()}`;
    const testUrl = "https://www.youtube.com/watch?v=s8G7425lfKs";

    // 1. Create a nominated project
    const project: Project = {
      id: projectId,
      identity: {
        title: "Junichiro Jackson Proof of Concept",
        normalizedUrl: testUrl,
        originalUrl: testUrl,
        medium: "proof_of_concept",
        currentStage: "concept",
        logline: "An atmospheric neo-noir anime proof of concept set in futuristic Chicago.",
        creators: ["Chaz Bottoms", "TeamTO"],
      },
      publishedCardId: null,
      nomination: {
        submittedByUid: "test-user-1",
        nominatorRole: "fan",
        reason: "Atmospheric neo-noir anime proof-of-concept with intense worldbuilding and supernatural horror.",
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

    // 2. Create a research run for this project
    const run: ResearchRunState = {
      id: runId,
      projectId: projectId,
      nominatorUid: "test-user-1",
      sourceUrl: testUrl,
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      cardId: undefined,
    };

    await dataRepo.saveResearchRun(run);

    // 3. Execute the autonomous research agent run
    const completedRun = await executeScoutResearchRun(runId);
    if (completedRun.currentStep === "failed") {
      console.error("AGENT RUN ERROR:", completedRun.errorMessage, JSON.stringify(completedRun.stepLogs, null, 2));
    }

    expect(completedRun.currentStep).toBe("complete");
    expect(completedRun.progressPercent).toBe(100);
    expect(completedRun.cardId).toBeDefined();

    // 4. Verify the published Scout Card
    if (completedRun.cardId) {
      const card = await dataRepo.getScoutCardById(completedRun.cardId);
      expect(card).toBeDefined();
      expect(card?.pathways).toHaveLength(3);
      expect(card?.decisionBrief).toBeDefined();
      expect(card?.evidenceLedger.length).toBeGreaterThan(0);
    }
  }, 60000);
});
