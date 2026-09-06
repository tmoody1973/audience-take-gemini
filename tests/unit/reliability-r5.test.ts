import { describe, it, expect, vi, beforeEach } from "vitest";
import { dataRepo } from "@/services/firestore-repo";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { POST as researchTaskHandler } from "@/app/tasks/research/route";
import { parallelClient } from "@/services/parallel-client";
import { NextRequest } from "next/server";
import type { Project, ResearchRunState, ScoutCard } from "@/domain";

describe("Scout Agent Reliability R5: Durable Execution, Retries, and Atomic Publication", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("enforces mutual exclusion: concurrent worker cannot acquire active lease", async () => {
    const runId = `run-lease-mutex-${Date.now()}`;
    const projectId = `proj-mutex-${Date.now()}`;

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-123",
      sourceUrl: "https://example.com/indie-film",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      attempt: 1,
    };
    await dataRepo.saveResearchRun(run);

    // Worker A acquires lease
    const leaseA = await dataRepo.acquireResearchRunLease(runId, "worker-A", {
      leaseDurationMs: 60_000,
    });
    expect(leaseA.acquired).toBe(true);
    expect(leaseA.leaseToken).toBeDefined();
    expect(leaseA.run?.lease?.workerId).toBe("worker-A");

    // Worker B attempts to acquire lease concurrently
    const leaseB = await dataRepo.acquireResearchRunLease(runId, "worker-B", {
      leaseDurationMs: 60_000,
    });
    expect(leaseB.acquired).toBe(false);
    expect(leaseB.reason).toBe("already_running");
  });

  it("permits takeover after lease expiration with incremented generation and distinct token", async () => {
    const runId = `run-lease-expire-${Date.now()}`;
    const projectId = `proj-expire-${Date.now()}`;

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-123",
      sourceUrl: "https://example.com/indie-film",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      attempt: 1,
      lease: {
        workerId: "crashed-worker",
        acquiredAt: new Date(Date.now() - 120_000).toISOString(),
        expiresAt: new Date(Date.now() - 30_000).toISOString(), // Expired 30s ago
        attempt: 1,
        leaseToken: "tok_old_crashed",
        executionGeneration: 1,
      },
    };
    await dataRepo.saveResearchRun(run);

    // New worker takes over expired lease
    const takeover = await dataRepo.acquireResearchRunLease(runId, "recovering-worker", {
      leaseDurationMs: 60_000,
    });
    expect(takeover.acquired).toBe(true);
    expect(takeover.run?.lease?.workerId).toBe("recovering-worker");
    expect(takeover.leaseToken).toBeDefined();
    expect(takeover.leaseToken).not.toBe("tok_old_crashed");
    expect(takeover.run?.attempt).toBe(2);
    expect(takeover.run?.lease?.executionGeneration).toBe(2);
  });

  it("rejects publication from a stale worker whose lease expired or was taken over", async () => {
    const projectId = `proj-stale-${Date.now()}`;
    const runId = `run-stale-${Date.now()}`;

    const project: Project = {
      id: projectId,
      identity: {
        title: "Test Indie Short",
        normalizedUrl: "https://example.com/short",
        originalUrl: "https://example.com/short",
        medium: "short",
        currentStage: "post_production",
      },
      publishedCardId: null,
      nomination: {} as any,
      creatorClaim: {} as any,
      metrics: {} as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dataRepo.createProject(project);

    // Initial lease held by Worker 1
    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-123",
      sourceUrl: "https://example.com/short",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      attempt: 1,
      lease: {
        workerId: "worker-2", // Overwritten by worker 2!
        acquiredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        attempt: 2,
        leaseToken: "tok_worker_2_valid",
      },
    };
    await dataRepo.saveResearchRun(run);

    const dummyCard: ScoutCard = {
      id: `card-${projectId}-v1`,
      projectId,
      version: 1,
      status: "published",
      whatWeKnow: ["Valid fact 1", "Valid fact 2"],
      whatWereChecking: ["Unknown 1"],
      whyScouted: "Visually striking short.",
      sourceMedia: [],
      evidenceLedger: [
        {
          id: "ev-1",
          sourceUrl: "https://example.com/short",
          title: "Short coverage",
          publisher: "Trade",
          claimType: "reported",
          excerpt: "Valid fact 1 and Valid fact 2.",
          verified: true,
          retrievedAt: new Date().toISOString(),
        },
      ],
      pathways: [
        {
          title: "Festival Tour",
          mediumFitRationale: "Festival fit",
          targetAudience: "Audience",
          risksAndUncertainties: ["Competition"],
          nextBoundedExperiment: {
            name: "Submission",
            description: "Submit to festival",
            successMetric: "Selected",
          },
        },
      ],
      decisionBrief: {
        logline: "Logline",
        coreHook: "Hook",
        comparativeTitles: ["Title A"],
        primaryRisk: "Risk",
        triageSummary: "Summary",
      },
      industryLens: {
        marketContext: "Context",
        comparables: ["Comp A"],
        realisticConstraints: "Constraints",
      },
      trailerCriticId: null,
    };

    // Worker 1 attempts to publish with its stale leaseToken
    await expect(
      dataRepo.atomicPublishScoutCard({
        card: dummyCard,
        project,
        run,
        leaseToken: "tok_worker_1_STALE",
      })
    ).rejects.toThrow(/Execution lease invalid/);
  });

  it("dynamically resolves and increments card version upon subsequent publications", async () => {
    const projectId = `proj-version-inc-${Date.now()}`;
    const runId1 = `run-v1-${Date.now()}`;
    const runId2 = `run-v2-${Date.now()}`;

    const project: Project = {
      id: projectId,
      identity: {
        title: "Versioned Indie Film",
        normalizedUrl: "https://example.com/film",
        originalUrl: "https://example.com/film",
        medium: "feature",
        currentStage: "production",
      },
      publishedCardId: null,
      nomination: {} as any,
      creatorClaim: {} as any,
      metrics: {} as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dataRepo.createProject(project);

    const run1: ResearchRunState = {
      id: runId1,
      projectId,
      nominatorUid: "user-1",
      sourceUrl: "https://example.com/film",
      currentStep: "validating",
      progressPercent: 90,
      stepLogs: [],
      attempt: 1,
    };
    await dataRepo.saveResearchRun(run1);

    const baseCard: ScoutCard = {
      id: `card-${projectId}-v1`,
      projectId,
      version: 1,
      status: "published",
      whatWeKnow: ["Grounded claim 1", "Grounded claim 2"],
      whatWereChecking: ["Financing details"],
      whyScouted: "Groundbreaking feature project.",
      sourceMedia: [],
      evidenceLedger: [
        {
          id: "ev-1",
          sourceUrl: "https://example.com/film",
          title: "Feature trade news",
          publisher: "Trade Journal",
          claimType: "reported",
          excerpt: "Grounded claim 1 and Grounded claim 2.",
          verified: true,
          retrievedAt: new Date().toISOString(),
        },
      ],
      pathways: [
        {
          title: "Theatrical Release",
          mediumFitRationale: "Feature fit",
          targetAudience: "Indie cinema fans",
          risksAndUncertainties: ["Theatrical market pressure"],
          nextBoundedExperiment: {
            name: "Festival Premiere",
            description: "Submit to festivals",
            successMetric: "Selection",
          },
        },
      ],
      decisionBrief: {
        logline: "Logline",
        coreHook: "Hook",
        comparativeTitles: ["Comp"],
        primaryRisk: "Risk",
        triageSummary: "Summary",
      },
      industryLens: {
        marketContext: "Context",
        comparables: ["Comp"],
        realisticConstraints: "Constraints",
      },
      trailerCriticId: null,
    };

    // First publication: publishes version 1
    const res1 = await dataRepo.atomicPublishScoutCard({
      card: { ...baseCard },
      project,
      run: run1,
    });

    expect(res1.publishedCard.version).toBe(1);
    expect(res1.publishedCard.id).toBe(`card-${projectId}-v1`);
    expect(res1.project.publishedCardId).toBe(`card-${projectId}-v1`);

    // Second publication for the same project: publishes version 2
    const run2: ResearchRunState = {
      id: runId2,
      projectId,
      nominatorUid: "user-2",
      sourceUrl: "https://example.com/film",
      currentStep: "validating",
      progressPercent: 90,
      stepLogs: [],
      attempt: 1,
    };
    await dataRepo.saveResearchRun(run2);

    const res2 = await dataRepo.atomicPublishScoutCard({
      card: { ...baseCard },
      project: res1.project,
      run: run2,
    });

    expect(res2.publishedCard.version).toBe(2);
    expect(res2.publishedCard.id).toBe(`card-${projectId}-v2`);
    expect(res2.project.publishedCardId).toBe(`card-${projectId}-v2`);

    // Both cards exist in repository
    const cardV1 = await dataRepo.getScoutCardById(`card-${projectId}-v1`);
    const cardV2 = await dataRepo.getScoutCardById(`card-${projectId}-v2`);
    expect(cardV1?.version).toBe(1);
    expect(cardV2?.version).toBe(2);
  });

  it("decouples monitor registration: monitor creation failure does not fail core research run", async () => {
    const projectId = `proj-monitor-decouple-${Date.now()}`;
    const runId = `run-monitor-decouple-${Date.now()}`;

    const project: Project = {
      id: projectId,
      identity: {
        title: "Neon Echoes",
        normalizedUrl: "https://example.com/neon-echoes",
        originalUrl: "https://example.com/neon-echoes",
        medium: "short",
        currentStage: "festival_circuit",
        creators: ["Jordan Chen"],
        logline: "A futuristic short set in night-time Tokyo.",
      },
      publishedCardId: null,
      nomination: {
        submittedByUid: "fan-1",
        nominatorRole: "fan",
        reason: "Innovative atmospheric short.",
        initialLinks: ["https://example.com/neon-echoes"],
        createdAt: new Date().toISOString(),
      },
      creatorClaim: { status: "unclaimed" },
      metrics: {
        watchCount: 0,
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
      projectId,
      nominatorUid: "fan-1",
      sourceUrl: "https://example.com/neon-echoes",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
    };
    await dataRepo.saveResearchRun(run);

    // Mock Parallel Monitor creation to throw a network error
    vi.spyOn(parallelClient, "createMonitor").mockRejectedValue(
      new Error("Parallel Monitor API down or rate limited")
    );

    // Mock Parallel Extract API
    vi.spyOn(parallelClient, "extract").mockResolvedValue({
      providerStatus: "succeeded",
      results: [
        {
          url: "https://example.com/neon-echoes",
          title: "Neon Echoes Festival Review",
          markdown: "Director Jordan Chen wrapped Neon Echoes, a 12-minute short screening at Tokyo Cine.",
        },
      ],
    });

    const googleGenAIModule = await import("@/lib/google/genai-client");
    vi.spyOn(googleGenAIModule, "getGoogleGenAIClient").mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            projectTitle: "Neon Echoes",
            medium: "short",
            stage: "festival_circuit",
            creators: ["Jordan Chen"],
            whyScouted: "Innovative atmospheric short film with verified festival screening.",
            whatWeKnow: [
              "Director Jordan Chen directed Neon Echoes as a 12-minute short.",
              "The film completed post-production and is screening at Tokyo Cine.",
            ],
            whatWereChecking: ["International distribution rights confirmation."],
            evidenceLedger: [
              {
                id: "ev-neon-1",
                sourceUrl: "https://example.com/neon-echoes",
                title: "Neon Echoes Festival Review",
                publisher: "Tokyo Cine",
                claimType: "reported",
                excerpt: "Director Jordan Chen directed Neon Echoes, screening at Tokyo Cine.",
                verified: true,
                retrievedAt: new Date().toISOString(),
              },
            ],
            pathways: [
              {
                title: "International Short Showcase",
                mediumFitRationale: "12-minute format tailored for festival circuits.",
                targetAudience: "Global short cinema enthusiasts.",
                risksAndUncertainties: ["Platform distribution competition."],
                nextBoundedExperiment: {
                  name: "Tokyo Premiere Screening",
                  description: "Screen at festival",
                  successMetric: "Audience acclaim",
                },
              },
            ],
            decisionBrief: {
              logline: "A futuristic short set in night-time Tokyo.",
              coreHook: "Textural cyberpunk visual style with indigenous soundtrack.",
              comparativeTitles: ["Akira", "Blade Runner"],
              primaryRisk: "Monetization pathway for short formats.",
              triageSummary: "Finished festival short with verified screening.",
            },
            industryLens: {
              marketContext: "Short form cinema gaining traction in digital curations.",
              comparables: ["World of Tomorrow"],
              realisticConstraints: "Cultural grant reliance.",
            },
          }),
        }),
      },
    } as any);

    // Execute run: should succeed despite monitor API failure
    const completedRun = await executeScoutResearchRun(runId);
    expect(completedRun.currentStep).toBe("complete");
    expect(completedRun.cardId).toBeDefined();

    const publishedCard = await dataRepo.getScoutCardById(completedRun.cardId!);
    expect(publishedCard).toBeDefined();
    expect(publishedCard?.whatWeKnow.length).toBeGreaterThanOrEqual(2);
  });

  it("differentiates terminal failures and acknowledges them with 200 OK to prevent endless task retries", async () => {
    const runId = `run-terminal-${Date.now()}`;
    const projectId = `proj-terminal-${Date.now()}`;

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-test",
      sourceUrl: "https://example.com/doomed",
      currentStep: "failed",
      progressPercent: 100,
      errorMessage: "Deterministic validation failed: Insufficient passage grounding: whatWeKnow contains ungrounded claims",
      stepLogs: [],
    };
    await dataRepo.saveResearchRun(run);

    const project: Project = {
      id: projectId,
      identity: {
        title: "Doomed Film",
        normalizedUrl: "https://example.com/doomed",
        originalUrl: "https://example.com/doomed",
        medium: "short",
        currentStage: "concept",
      },
      publishedCardId: null,
      nomination: {} as any,
      creatorClaim: {} as any,
      metrics: {} as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dataRepo.createProject(project);

    // Call research task endpoint directly
    const req = new NextRequest("http://localhost:3000/tasks/research", {
      method: "POST",
      body: JSON.stringify({ runId }),
    });

    const res = await researchTaskHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("failed");
    expect(body.terminal).toBe(true);
  });
});
