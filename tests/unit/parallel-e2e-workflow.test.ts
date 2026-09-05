import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { dataRepo } from "@/services/firestore-repo";
import { parallelClient } from "@/services/parallel-client";
import { POST as handleParallelWebhook } from "@/app/api/webhooks/parallel/route";
import { NextRequest } from "next/server";
import type { Project, ResearchRunState } from "@/domain";
import * as genaiClient from "@/lib/google/genai-client";

describe("Parallel End-to-End Autonomous Agent Workflow", () => {
  const projectId = `proj-parallel-e2e-${Date.now()}`;
  const runId = `run-parallel-e2e-${Date.now()}`;
  const nonVideoKickstarterUrl = "https://www.kickstarter.com/projects/creator/neo-tokyo-cyberpunk-pilot";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("executes the complete Parallel Extract -> Parallel Search -> Gemini Synthesis -> Parallel Monitor -> Webhook Live Update pipeline", async () => {
    // 1. Setup nominated non-video project
    const project: Project = {
      id: projectId,
      identity: {
        title: "Neo Tokyo Cyberpunk Pilot",
        normalizedUrl: nonVideoKickstarterUrl,
        originalUrl: nonVideoKickstarterUrl,
        medium: "pilot",
        currentStage: "crowdfunding",
        logline: "An investigative cyber-thriller anime series pilot.",
        creators: ["Elena Rostova", "Studio Neon"],
      },
      publishedCardId: null,
      nomination: {
        submittedByUid: "test-user-e2e",
        nominatorRole: "fan",
        reason: "Groundbreaking 2D animation with immense community backing and international trade accolades.",
        initialLinks: [nonVideoKickstarterUrl],
        createdAt: new Date().toISOString(),
      },
      creatorClaim: {
        status: "unclaimed",
      },
      metrics: {
        watchCount: 120,
        payCount: 45,
        cityDemandCount: 15,
        backCount: 30,
        pathwayVotes: [10, 5, 2],
        cities: { "New York": 8, Chicago: 7 },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dataRepo.createProject(project);

    // 2. Setup research run
    const run: ResearchRunState = {
      id: runId,
      projectId: projectId,
      nominatorUid: "test-user-e2e",
      sourceUrl: nonVideoKickstarterUrl,
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      cardId: undefined,
    };
    await dataRepo.saveResearchRun(run);

    // 3. Spy on Parallel Extract, Search, and Monitor
    const extractSpy = vi.spyOn(parallelClient, "extract").mockImplementation(async (opts) => {
      return {
        extract_id: `ext_e2e_test_${Date.now()}`,
        results: opts.urls.map((u) => ({
          url: u,
          title: u === nonVideoKickstarterUrl ? "Neo Tokyo Pilot Kickstarter Campaign" : "Animation Magazine Slate",
          markdown: u === nonVideoKickstarterUrl
            ? "# Neo Tokyo Cyberpunk Pilot\n\n**Raised €320,000 of €150,000 goal (213% funded)** with 4,100 verified backers.\n\nCreator: Elena Rostova. Co-production with Studio Neon."
            : "Studio Neon and Elena Rostova secure European distribution rights.",
        })),
      };
    });

    const searchSpy = vi.spyOn(parallelClient, "search").mockResolvedValueOnce({
      search_id: "search_e2e_test_456",
      results: [
        {
          url: "https://animationmagazine.net/2026/08/neo-tokyo-breakout",
          title: "Animation Magazine: Neo Tokyo Co-Pro Slate",
          excerpts: ["Studio Neon and Elena Rostova secure European distribution rights."],
        },
        {
          url: "https://c21media.net/news/neo-tokyo-series-development",
          title: "C21Media: International Buyer Interest in Indie Anime",
          excerpts: ["Prime Video and Adult Swim express interest in adult animation slate."],
        },
      ],
    });

    const monitorSpy = vi.spyOn(parallelClient, "createMonitor").mockResolvedValueOnce({
      monitor_id: "mon_e2e_test_789",
      status: "active",
      target_url: nonVideoKickstarterUrl,
      created_at: new Date().toISOString(),
    });

    // Mock Gemini Synthesis with grounded proposal derived from Parallel Extract and Search sources
    vi.spyOn(genaiClient, "getGoogleGenAIClient").mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            projectTitle: "Neo Tokyo Cyberpunk Pilot",
            medium: "pilot",
            stage: "crowdfunding",
            creators: ["Elena Rostova", "Studio Neon"],
            whatWeKnow: [
              "Raised €320,000 of €150,000 goal with 4,100 verified fan backers on Kickstarter.",
              "Studio Neon and Elena Rostova secured European distribution rights.",
              "Prime Video and Adult Swim expressed interest in adult animation series development.",
            ],
            whatWereChecking: [
              "Final co-production contract execution timeline.",
              "Linear broadcast window exclusivity rights.",
            ],
            whyScouted: "Groundbreaking 2D animation with immense community backing and international trade accolades.",
            sourceMedia: [],
            evidenceLedger: [],
            pathways: [
              {
                title: "European Co-Production Series Expansion",
                mediumFitRationale: "The proof-of-concept pilot naturally supports an episodic adult animated series.",
                targetAudience: "Fans of mature cyberpunk and indie anime.",
                risksAndUncertainties: ["High per-episode production cost."],
                nextBoundedExperiment: {
                  name: "Script Table Read",
                  description: "Host private industry reading for distributor feedback.",
                  successMetric: "Secure broadcaster LOI.",
                },
              },
              {
                title: "Direct-to-Backer Digital Premiere",
                mediumFitRationale: "Strong crowdfunding base provides guaranteed launch viewership.",
                targetAudience: "Kickstarter backers and indie animation supporters.",
                risksAndUncertainties: ["Digital piracy risk."],
                nextBoundedExperiment: {
                  name: "Backer Screening Test",
                  description: "Stream private pilot screener to top-tier backers.",
                  successMetric: "90% positive audience survey completion.",
                },
              },
              {
                title: "Curated International Festival Circuit",
                mediumFitRationale: "Festival accolades will validate commercial acquisition appetite.",
                targetAudience: "Festival programmers and acquisitions scouts.",
                risksAndUncertainties: ["Long festival review cycles."],
                nextBoundedExperiment: {
                  name: "Festival Entry Round",
                  description: "Submit completed pilot to official competitive selection.",
                  successMetric: "Official festival selection.",
                },
              },
            ],
            decisionBrief: {
              logline: "An investigative cyber-thriller anime series pilot set in a near-future metropolis.",
              coreHook: "High-craft 2D animation with organic European and global co-production momentum.",
              comparativeTitles: ["Akira", "Ghost in the Shell", "Cyberpunk: Edgerunners"],
              primaryRisk: "Budget scaling and co-production timeline delays.",
            },
            industryLens: {
              marketContext: "Surging buyer appetite for mature, creator-led anime outside traditional production committees.",
              comparables: ["Castlevania", "Arcane"],
              realisticConstraints: "Animation lead time requires robust cash-flow management.",
            },
          }),
        }),
      },
    } as any);

    // 4. Execute the Autonomous Scout Research Agent Engine
    const completedRun = await executeScoutResearchRun(runId);

    // 5. Verify Step 1 & 2: Parallel Extract was called for non-video URL and candidate sources
    expect(extractSpy).toHaveBeenCalled();
    expect(extractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        urls: [nonVideoKickstarterUrl],
        mode: "markdown",
      }),
    );

    // 6. Verify Step 2: Parallel Search was called for trade discovery
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "fast",
      }),
    );

    // 7. Verify Agent Run Completed & Card Published
    expect(completedRun.currentStep).toBe("complete");
    expect(completedRun.progressPercent).toBe(100);
    expect(completedRun.cardId).toBeDefined();

    // 8. Verify Step 3: Parallel Monitor was registered on card publication
    expect(monitorSpy).toHaveBeenCalledTimes(1);
    expect(monitorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUrl: nonVideoKickstarterUrl,
        metadata: { projectId },
      }),
    );

    // 9. Inspect published Scout Card in Firestore
    const publishedCard = await dataRepo.getScoutCardById(completedRun.cardId!);
    expect(publishedCard).toBeDefined();
    expect(publishedCard?.status).toBe("published");
    expect(publishedCard?.evidenceLedger.length).toBeGreaterThanOrEqual(2);

    const hasParallelCitation = publishedCard?.evidenceLedger.some(
      (ev) => ev.sourceUrl.includes("animationmagazine.net") || ev.sourceUrl.includes("c21media.net"),
    );
    expect(hasParallelCitation).toBe(true);

    // 10. Simulate Live Parallel Monitor Webhook Event
    const webhookReq = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "monitor.milestone_reached",
        monitor_id: "mon_e2e_test_789",
        target_url: nonVideoKickstarterUrl,
        projectId: projectId,
        milestone_text: "Stretch Goal $400k Unlocked: 45-minute expanded pilot episode confirmed",
        citations: [
          {
            url: "https://variety.com/2026/film/news/neo-tokyo-expanded",
            title: "Variety: Neo Tokyo Expands Pilot Scope",
            excerpt: "Crowdfunding momentum pushes project into half-hour format.",
          },
        ],
      }),
    });

    const webhookRes = await handleParallelWebhook(webhookReq);
    expect(webhookRes.status).toBe(200);
    const webhookBody = await webhookRes.json();
    expect(webhookBody.success).toBe(true);
    expect(webhookBody.projectId).toBe(projectId);

    // 11. Verify Living Dossier updated in Firestore
    const updatedCard = await dataRepo.getScoutCardById(completedRun.cardId!);
    expect(updatedCard).toBeDefined();
    const hasMonitorUpdate = updatedCard?.whatWeKnow.some((k) => k.includes("Live Monitor Update"));
    expect(hasMonitorUpdate).toBe(true);

    const hasVarietyMonitorCitation = updatedCard?.evidenceLedger.some((ev) =>
      ev.sourceUrl.includes("variety.com"),
    );
    expect(hasVarietyMonitorCitation).toBe(true);
  }, 45000);
});
