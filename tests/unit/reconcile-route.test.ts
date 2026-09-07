import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/tasks/reconcile/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase/admin", () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      where: () => ({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
      doc: () => ({
        update: async () => {},
      }),
    }),
  }),
}));

vi.mock("@/lib/tasks/cloud-tasks", () => ({
  createCloudTasksResearchDispatcher: () => async () => {},
}));

describe("/api/tasks/reconcile Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes reconciliation on POST and returns 200 with summary", async () => {
    const req = new NextRequest("http://localhost:3000/api/tasks/reconcile", {
      method: "POST",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.summary).toBeDefined();
    expect(typeof data.summary.scanned).toBe("number");
    expect(Array.isArray(data.summary.dispatched)).toBe(true);
    expect(Array.isArray(data.summary.failedTerminal)).toBe(true);
    expect(Array.isArray(data.summary.retriedLater)).toBe(true);
  });

  it("rejects GET with 405 Method Not Allowed to protect against mutating GET pings", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/Method Not Allowed/i);
  });
});
