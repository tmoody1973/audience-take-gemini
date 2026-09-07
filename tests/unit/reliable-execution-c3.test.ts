import { describe, it, expect, vi, beforeEach } from "vitest";
import { dataRepo } from "@/services/firestore-repo";
import { reconcilePendingDispatches } from "@/lib/nomination/reconciler";
import type { NominationStore, PendingDispatchRun } from "@/lib/nomination/store";
import { POST as researchTaskHandler } from "@/app/tasks/research/route";
import { NextRequest } from "next/server";
import type { Project, ResearchRunState, ScoutCard } from "@/domain";

describe("Package C3: Reliable, Authenticated Execution & Ownership Invariants", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renews unexpired lease successfully and updates expiresAt", async () => {
    const runId = `run-renew-${Date.now()}`;
    const projectId = `proj-renew-${Date.now()}`;

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-1",
      sourceUrl: "https://example.com/indie",
      currentStep: "fetching",
      progressPercent: 20,
      stepLogs: [],
      attempt: 1,
    };
    await dataRepo.saveResearchRun(run);

    const leaseAcquired = await dataRepo.acquireResearchRunLease(runId, "worker-primary", {
      leaseDurationMs: 60_000,
    });
    expect(leaseAcquired.acquired).toBe(true);
    const token = leaseAcquired.leaseToken!;

    const renewal = await dataRepo.renewResearchRunLease(runId, token, 120_000);
    expect(renewal.renewed).toBe(true);
    expect(renewal.expiresAt).toBeDefined();

    // Verify rejection if token does not match
    const badRenewal = await dataRepo.renewResearchRunLease(runId, "tok_fake", 120_000);
    expect(badRenewal.renewed).toBe(false);
    expect(badRenewal.reason).toBe("lease_token_mismatch_or_taken_over");
  });

  it("rejects lease renewal if lease has already expired", async () => {
    const runId = `run-renew-exp-${Date.now()}`;
    const projectId = `proj-renew-exp-${Date.now()}`;

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-1",
      sourceUrl: "https://example.com/indie",
      currentStep: "fetching",
      progressPercent: 20,
      stepLogs: [],
      attempt: 1,
      lease: {
        workerId: "stale-worker",
        acquiredAt: new Date(Date.now() - 100_000).toISOString(),
        expiresAt: new Date(Date.now() - 10_000).toISOString(), // Expired 10s ago
        attempt: 1,
        leaseToken: "tok_expired_1",
        executionGeneration: 1,
      },
    };
    await dataRepo.saveResearchRun(run);

    const renewal = await dataRepo.renewResearchRunLease(runId, "tok_expired_1", 60_000);
    expect(renewal.renewed).toBe(false);
    expect(renewal.reason).toBe("lease_expired");
  });

  it("saveResearchRun fails closed when caller presents expired or mismatched lease token", async () => {
    const runId = `run-save-lease-${Date.now()}`;
    const projectId = `proj-save-lease-${Date.now()}`;

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-1",
      sourceUrl: "https://example.com/indie",
      currentStep: "fetching",
      progressPercent: 20,
      stepLogs: [],
      attempt: 1,
      lease: {
        workerId: "active-worker",
        acquiredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        attempt: 1,
        leaseToken: "tok_active_valid",
        executionGeneration: 1,
      },
    };
    await dataRepo.saveResearchRun(run);

    // Stale worker tries to save with bad token
    const staleUpdate: ResearchRunState = {
      ...run,
      progressPercent: 50,
    };
    await expect(
      dataRepo.saveResearchRun(staleUpdate, "tok_stale_wrong")
    ).rejects.toThrow(/Execution lease lost/);
  });

  it("atomicPublishScoutCard rejects publication if lease expired before commit", async () => {
    const projectId = `proj-pub-exp-${Date.now()}`;
    const runId = `run-pub-exp-${Date.now()}`;

    const project: Project = {
      id: projectId,
      identity: {
        title: "Lease Test Film",
        normalizedUrl: "https://example.com/film",
        originalUrl: "https://example.com/film",
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

    const run: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "user-1",
      sourceUrl: "https://example.com/film",
      currentStep: "synthesizing_pathways",
      progressPercent: 80,
      stepLogs: [],
      attempt: 1,
      lease: {
        workerId: "worker-timeout",
        acquiredAt: new Date(Date.now() - 100_000).toISOString(),
        expiresAt: new Date(Date.now() - 5_000).toISOString(), // Expired 5 seconds ago
        attempt: 1,
        leaseToken: "tok_timeout",
        executionGeneration: 1,
      },
    };
    await dataRepo.saveResearchRun(run);

    const dummyCard: ScoutCard = {
      id: `card-${projectId}-v1`,
      projectId,
      version: 1,
      status: "published",
      whatWeKnow: ["Valid fact"],
      whatWereChecking: [],
      whyScouted: "Valid hook",
      sourceMedia: [],
      evidenceLedger: [],
      pathways: [],
      decisionBrief: {
        logline: "Logline",
        coreHook: "Hook",
        comparativeTitles: [],
        primaryRisk: "Risk",
        triageSummary: "Summary",
      },
      industryLens: {
        marketContext: "Context",
        comparables: [],
        realisticConstraints: "Constraints",
      },
      trailerCriticId: null,
      versionProvenance: {
        generatedAt: new Date().toISOString(),
        model: "gemini-2.5-flash",
        changeReason: "Initial publication",
      },
    };

    await expect(
      dataRepo.atomicPublishScoutCard({
        card: dummyCard,
        project,
        run,
        leaseToken: "tok_timeout",
      })
    ).rejects.toThrow(/Execution lease invalid: lease_expired/);
  });

  it("reconcilePendingDispatches successfully recovers retryable_failed intents", async () => {
    const mockRuns: PendingDispatchRun[] = [
      {
        runId: "run-retry-1",
        projectId: "proj-1",
        nominationId: "nom-1",
        attempt: 1,
        dispatchState: "retryable_failed",
      },
      {
        runId: "run-retry-2",
        projectId: "proj-2",
        nominationId: "nom-2",
        attempt: 1,
        dispatchState: "retryable_failed",
      },
    ];

    const dispatchedRuns: string[] = [];
    const retriedRuns: string[] = [];
    const terminatedRuns: string[] = [];

    const mockStore: NominationStore = {
      accept: vi.fn(),
      markDispatched: vi.fn(async (runId) => {
        dispatchedRuns.push(runId);
      }),
      markDispatchFailed: vi.fn(),
      getPendingOrRetryableRuns: vi.fn(async () => mockRuns),
      markTerminalDispatchFailure: vi.fn(async (runId) => {
        terminatedRuns.push(runId);
      }),
      recordDispatchRetry: vi.fn(async (runId) => {
        retriedRuns.push(runId);
      }),
    };

    // Dispatcher succeeds for run-1, fails for run-2
    const dispatcher = vi.fn(async ({ runId }: { runId: string }) => {
      if (runId === "run-retry-2") {
        throw new Error("Temporary queue service unavailable");
      }
    });

    const summary = await reconcilePendingDispatches(
      { store: mockStore, dispatcher },
      { maxAttempts: 3 }
    );

    expect(summary.scanned).toBe(2);
    expect(summary.dispatched).toContain("run-retry-1");
    expect(summary.retriedLater).toContain("run-retry-2");
    expect(dispatchedRuns).toContain("run-retry-1");
    expect(retriedRuns).toContain("run-retry-2");
  });

  it("reconcilePendingDispatches marks terminal failure when max retry attempts are reached", async () => {
    const mockRuns: PendingDispatchRun[] = [
      {
        runId: "run-exhausted",
        projectId: "proj-exhausted",
        nominationId: "nom-exhausted",
        attempt: 3, // Already at max attempts
        dispatchState: "retryable_failed",
      },
    ];

    const terminatedRuns: string[] = [];
    const mockStore: NominationStore = {
      accept: vi.fn(),
      markDispatched: vi.fn(),
      markDispatchFailed: vi.fn(),
      getPendingOrRetryableRuns: vi.fn(async () => mockRuns),
      markTerminalDispatchFailure: vi.fn(async (runId) => {
        terminatedRuns.push(runId);
      }),
    };

    const dispatcher = vi.fn();

    const summary = await reconcilePendingDispatches(
      { store: mockStore, dispatcher },
      { maxAttempts: 3 }
    );

    expect(summary.scanned).toBe(1);
    expect(summary.failedTerminal).toContain("run-exhausted");
    expect(dispatcher).not.toHaveBeenCalled();
    expect(terminatedRuns).toContain("run-exhausted");
  });

  it("research task route rejects unauthorized worker invocation when AGENT_SERVICE_AUDIENCE is configured", async () => {
    const prevAudience = process.env.AGENT_SERVICE_AUDIENCE;
    process.env.AGENT_SERVICE_AUDIENCE = "https://audience-take-worker.run.app";

    try {
      const req = new NextRequest("http://localhost:3000/tasks/research", {
        method: "POST",
        headers: {
          "x-cloudtasks-queuename": "research-queue",
        },
        body: JSON.stringify({ runId: "run-unauth" }),
      });

      const res = await researchTaskHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/Unauthorized worker invocation: missing Bearer token/);
    } finally {
      process.env.AGENT_SERVICE_AUDIENCE = prevAudience;
    }
  });
});
