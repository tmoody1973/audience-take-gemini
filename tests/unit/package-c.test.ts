import { describe, it, expect, beforeEach } from "vitest";
import { acquireExecutionLease, executeScoutResearchRun } from "@/agent/agent-runner";
import { dataRepo } from "@/services/firestore-repo";
import { POST as researchTaskHandler } from "@/app/tasks/research/route";
import { POST as criticTaskHandler } from "@/app/tasks/trailer-critic/route";
import { POST as criticRunHandler } from "@/app/api/critic/run/route";
import { NextRequest } from "next/server";
import type { ResearchRunState, Project } from "@/domain";

describe("Package C: Nomination, Execution Lease & Persistence", () => {
  const testRunId = "run-test-c-1";
  const testProjectId = "proj-test-c-1";

  beforeEach(async () => {
    const project: Project = {
      id: testProjectId,
      identity: {
        title: "Lease Test Project",
        normalizedUrl: "https://example.com/project",
        originalUrl: "https://example.com/project",
        medium: "short",
        currentStage: "concept",
      },
      publishedCardId: null,
      nomination: {
        submittedByUid: "test-user",
        nominatorRole: "fan",
        reason: "Testing execution lease mechanics.",
        initialLinks: ["https://example.com/project"],
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
      id: testRunId,
      projectId: testProjectId,
      nominatorUid: "test-user",
      sourceUrl: "https://example.com/project",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      attempt: 0,
      lease: null,
    };
    await dataRepo.saveResearchRun(run);
  });

  it("acquires an execution lease and blocks concurrent workers until expiration", async () => {
    // 1. Worker 1 acquires lease
    const lease1 = await acquireExecutionLease(testRunId, "worker-alpha", {
      leaseDurationMs: 60 * 1000,
    });
    expect(lease1.acquired).toBe(true);
    expect(lease1.run?.lease?.workerId).toBe("worker-alpha");
    expect(lease1.run?.attempt).toBe(1);

    // 2. Worker 2 attempts concurrent acquisition while lease is active
    const lease2 = await acquireExecutionLease(testRunId, "worker-beta");
    expect(lease2.acquired).toBe(false);
    expect(lease2.reason).toBe("already_running");
    expect(lease2.run?.lease?.workerId).toBe("worker-alpha");

    // 3. Worker 2 with forceRetry can override
    const leaseRetry = await acquireExecutionLease(testRunId, "worker-beta", {
      forceRetry: true,
    });
    expect(leaseRetry.acquired).toBe(true);
    expect(leaseRetry.run?.lease?.workerId).toBe("worker-beta");
    expect(leaseRetry.run?.attempt).toBe(2);
  });

  it("treats completed runs as idempotent and avoids re-execution", async () => {
    const run = (await dataRepo.getResearchRunById(testRunId))!;
    run.currentStep = "complete";
    run.cardId = "card-test-c-1";
    run.lease = null;
    await dataRepo.saveResearchRun(run);

    const leaseAttempt = await acquireExecutionLease(testRunId, "worker-gamma");
    expect(leaseAttempt.acquired).toBe(false);
    expect(leaseAttempt.reason).toBe("already_completed");
  });

  it("POST /tasks/research executes and validates Cloud Tasks worker contracts", async () => {
    const req = new NextRequest("http://localhost/tasks/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: testRunId,
        projectId: testProjectId,
        attempt: 1,
        taskName: "research-task-c-1",
      }),
    });

    const res = await researchTaskHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.runId).toBe(testRunId);
  });

  it("POST /tasks/trailer-critic rejects missing parameters", async () => {
    const req = new NextRequest("http://localhost/tasks/trailer-critic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "",
      }),
    });

    const res = await criticTaskHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it("POST /api/critic/run rejects SSRF and loopback targets", async () => {
    const req = new NextRequest("http://localhost/api/critic/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl: "http://127.0.0.1:8080/private",
      }),
    });

    const res = await criticRunHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("forbidden");
  });
});
