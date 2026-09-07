import { describe, it, expect, vi } from "vitest";
import { POST, GET } from "@/app/api/tasks/reconcile/route";
import { NextRequest } from "next/server";

describe("POST /api/tasks/reconcile", () => {
  it("executes reconciliation and returns 200 with summary", async () => {
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

  it("handles GET identically to POST for cron ping compatibility", async () => {
    const req = new NextRequest("http://localhost:3000/api/tasks/reconcile", {
      method: "GET",
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
