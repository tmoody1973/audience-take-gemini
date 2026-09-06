import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as runHandler } from "@/app/api/agent/run/route";
import { POST as taskResearchHandler } from "@/app/tasks/research/route";
import { POST as webhookHandler } from "@/app/api/webhooks/parallel/route";
import { dataRepo } from "@/services/firestore-repo";
import type { Project, ResearchRunState } from "@/domain";

describe("Scout Agent Reliability R2: Securing Execution & Write Boundaries", () => {
  it("rejects unauthorized research retry on POST /api/agent/run for a different user", async () => {
    const runId = `run-auth-test-${Date.now()}`;
    const testRun: ResearchRunState = {
      id: runId,
      projectId: "proj-123",
      nominatorUid: "legitimate-owner-uid",
      sourceUrl: "https://example.com/project",
      currentStep: "failed",
      progressPercent: 10,
      stepLogs: [],
      errorMessage: "Initial failure",
    };
    await dataRepo.saveResearchRun(testRun);

    try {
      const authModule = await import("@/lib/auth/verify-request");
      const authSpy = vi.spyOn(authModule, "verifyAuthenticatedRequest").mockResolvedValue({
        user: { uid: "attacker-user-uid", email: "attacker@example.com" } as any,
      });

      const req = new NextRequest("http://localhost:3000/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, forceRetry: true }),
      });

      const res = await runHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized: You may only retry your own runs");

      authSpy.mockRestore();
    } finally {
      try {
        const { getAdminFirestore } = await import("@/lib/firebase/admin");
        const db = getAdminFirestore() as any;
        if (db) await db.collection("researchRuns").doc(runId).delete();
      } catch {}
    }
  });

  it("rejects worker POST /tasks/research in production when bearer token is missing", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAud = process.env.AGENT_SERVICE_AUDIENCE;
    (process.env as any).NODE_ENV = "production";
    process.env.AGENT_SERVICE_AUDIENCE = "https://audience-take-web.run.app";

    try {
      const req = new Request("http://localhost:3000/tasks/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: "test-run" }),
      });

      const res = await taskResearchHandler(req as any);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized worker invocation");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      process.env.AGENT_SERVICE_AUDIENCE = originalAud;
    }
  });

  it("fails closed in production if AGENT_SERVICE_AUDIENCE is not configured on worker route", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAud = process.env.AGENT_SERVICE_AUDIENCE;
    (process.env as any).NODE_ENV = "production";
    delete process.env.AGENT_SERVICE_AUDIENCE;

    try {
      const req = new Request("http://localhost:3000/tasks/research", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: "Bearer some-token" },
        body: JSON.stringify({ runId: "test-run" }),
      });

      const res = await taskResearchHandler(req as any);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("AGENT_SERVICE_AUDIENCE missing");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      process.env.AGENT_SERVICE_AUDIENCE = originalAud;
    }
  });

  it("rejects webhook intake when monitor is unknown without trusting payload projectId override", async () => {
    const originalSecret = process.env.PARALLEL_WEBHOOK_SECRET;
    delete process.env.PARALLEL_WEBHOOK_SECRET;

    try {
      const req = new Request("http://localhost:3000/api/webhooks/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "monitor.event.detected",
          monitor_id: "unknown-monitor-999",
          projectId: "victim-project-id", // Malicious attempted project hijacking
          summary: "Fake milestone update",
        }),
      });

      const res = await webhookHandler(req as any);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("Unknown monitor ID. Server-side project mapping required.");
    } finally {
      process.env.PARALLEL_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("rejects webhook intake in production when PARALLEL_WEBHOOK_SECRET is unconfigured", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.PARALLEL_WEBHOOK_SECRET;
    (process.env as any).NODE_ENV = "production";
    delete process.env.PARALLEL_WEBHOOK_SECRET;

    try {
      const req = new Request("http://localhost:3000/api/webhooks/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "monitor.event.detected",
          monitor_id: "mon-123",
        }),
      });

      const res = await webhookHandler(req as any);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("PARALLEL_WEBHOOK_SECRET not configured on server");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      process.env.PARALLEL_WEBHOOK_SECRET = originalSecret;
    }
  });
});
