import { describe, it, expect, vi } from "vitest";
import { dataRepo } from "@/services/firestore-repo";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { parallelClient } from "@/services/parallel-client";
import type { Project, ResearchRunState } from "@/domain";

describe("Autonomous Scout Research Agent Pipeline", () => {
  it("executes a complete research run and publishes a verified Scout Card", async () => {
    const projectId = `proj-test-${Date.now()}`;
    const runId = `run-test-${Date.now()}`;
    const testUrl = "https://www.youtube.com/watch?v=s8G7425lfKs";

    const searchSpy = vi.spyOn(parallelClient, "search").mockResolvedValue({
      providerStatus: "succeeded",
      search_id: "search_mock_agent_run",
      results: [
        {
          url: "https://variety.com/article-indie-animation-jj",
          title: "Chaz Bottoms and French studio TeamTO announce Junichiro Jackson",
          excerpts: [
            "Chaz Bottoms and French animation studio TeamTO are collaborating on an atmospheric neo-noir anime project titled Junichiro Jackson.",
            "Set in near-future Brooklyn, the proof-of-concept animation teaser showcases high-velocity action and urban hip-hop beats.",
          ],
          publish_date: "2026-01-15",
        },
      ],
      warnings: [],
    });

    try {
      // 1. Create a nominated project
      const project: Project = {
        id: projectId,
        identity: {
          title: "Junichiro Jackson Proof of Concept",
          normalizedUrl: testUrl,
          originalUrl: testUrl,
          medium: "proof_of_concept",
          currentStage: "concept",
          logline: "An atmospheric neo-noir anime proof of concept set in near-future Brooklyn.",
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
        expect(card?.pathways.length).toBeGreaterThanOrEqual(1);
        expect(card?.pathways.length).toBeLessThanOrEqual(3);
        expect(card?.decisionBrief).toBeDefined();
        expect(card?.evidenceLedger.length).toBeGreaterThan(0);
      }
    } finally {
      searchSpy.mockRestore();
      // Clean up test records
      try {
        const { getAdminFirestore } = await import("@/lib/firebase/admin");
        const db = getAdminFirestore() as any;
        if (db) {
          await db.collection("projects").doc(projectId).delete();
          const p = await dataRepo.getProjectById(projectId);
          if (p?.publishedCardId) {
            await db.collection("scoutCards").doc(p.publishedCardId).delete();
          }
        }
      } catch {}
    }
  }, 120000);
});
