import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const updates: Array<{ path: string; data: Record<string, unknown> }> = [];

const pendingDoc = {
  id: "run-probe-pending",
  data: () => ({
    projectId: "proj-probe",
    nominationId: "nom-probe",
    dispatch: { state: "pending", attempt: 1 },
  }),
};

const fakeDb = {
  collection(name: string) {
    return {
      where() {
        return {
          limit() {
            return { get: async () => ({ docs: [pendingDoc] }) };
          },
        };
      },
      doc(id: string) {
        return {
          update: async (data: Record<string, unknown>) => {
            updates.push({ path: `${name}/${id}`, data });
          },
        };
      },
    };
  },
};

vi.mock("@/lib/firebase/admin", () => ({
  getAdminFirestore: () => fakeDb,
}));

let mockDispatcherShouldThrow = false;
let mockDispatcherCalls: any[] = [];

vi.mock("@/lib/tasks/cloud-tasks", () => ({
  createCloudTasksResearchDispatcher: () => {
    if (mockDispatcherShouldThrow) {
      throw new Error("Cloud Tasks dispatch is not configured");
    }
    return async (input: any) => {
      mockDispatcherCalls.push(input);
    };
  },
}));

describe("Reconciliation Route Security & Dispatch Invariants", () => {
  beforeEach(() => {
    updates.length = 0;
    mockDispatcherCalls = [];
    mockDispatcherShouldThrow = false;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGENT_SERVICE_AUDIENCE", "https://worker.example");
    vi.stubEnv("CRON_SECRET", "real-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects a forged queue header when bearer authorization is missing", async () => {
    const { POST } = await import("@/app/api/tasks/reconcile/route");
    const response = await POST(
      new NextRequest("https://app.example/api/tasks/reconcile", {
        method: "POST",
        headers: { "x-cloudtasks-queuename": "forged-by-client" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(updates).toHaveLength(0);
  });

  it("fails closed in production if auth configuration is missing", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("AGENT_SERVICE_AUDIENCE", "");

    const { POST } = await import("@/app/api/tasks/reconcile/route");
    const response = await POST(
      new NextRequest("https://app.example/api/tasks/reconcile", {
        method: "POST",
        headers: { "x-cloudtasks-queuename": "any-queue" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/configuration missing/i);
    expect(updates).toHaveLength(0);
  });

  it("rejects invalid or mismatched bearer token", async () => {
    const { POST } = await import("@/app/api/tasks/reconcile/route");
    const response = await POST(
      new NextRequest("https://app.example/api/tasks/reconcile", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(updates).toHaveLength(0);
  });

  it("rejects GET requests with 405 Method Not Allowed to prevent accidental mutation", async () => {
    const { GET } = await import("@/app/api/tasks/reconcile/route");
    const response = await GET(
      new NextRequest("https://app.example/api/tasks/reconcile", {
        method: "GET",
        headers: { authorization: "Bearer real-secret" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.ok).toBe(false);
    expect(updates).toHaveLength(0);
  });

  it("fails explicitly and retains pending record when dispatcher construction fails", async () => {
    mockDispatcherShouldThrow = true;

    const { POST } = await import("@/app/api/tasks/reconcile/route");
    const response = await POST(
      new NextRequest("https://app.example/api/tasks/reconcile", {
        method: "POST",
        headers: { authorization: "Bearer real-secret" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/Cloud Tasks dispatch is not configured/i);
    expect(updates).toHaveLength(0);
  });

  it("POSITIVE CONTROL: authenticated caller with working dispatcher successfully dispatches and records state", async () => {
    const { POST } = await import("@/app/api/tasks/reconcile/route");
    const response = await POST(
      new NextRequest("https://app.example/api/tasks/reconcile", {
        method: "POST",
        headers: { authorization: "Bearer real-secret" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.summary.dispatched).toEqual(["run-probe-pending"]);
    expect(mockDispatcherCalls).toHaveLength(1);
    expect(mockDispatcherCalls[0]).toEqual({
      runId: "run-probe-pending",
      projectId: "proj-probe",
      nominationId: "nom-probe",
      attempt: 2,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0].path).toBe("researchRuns/run-probe-pending");
    expect(updates[0].data["dispatch.state"]).toBe("dispatched");
  });
});
