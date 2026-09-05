import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { computeParallelSignature } from "@/lib/webhooks/parallel-signature";
import { NextRequest } from "next/server";
import type { Project, ScoutCard, ProjectMonitor } from "@/domain";

const mockProject: Project = {
  id: "proj-parallel-hook",
  identity: {
    title: "Monitored Indie Series",
    medium: "series",
    currentStage: "production",
    creators: ["Sam Creator"],
    logline: "A live monitored project.",
  },
  publishedCardId: "card-parallel-hook-v1",
  nomination: {} as any,
  creatorClaim: {} as any,
  metrics: {} as any,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
} as unknown as Project;

const mockCard: ScoutCard = {
  id: "card-parallel-hook-v1",
  projectId: "proj-parallel-hook",
  version: 1,
  status: "published",
  whatWeKnow: ["Original knowledge."],
  whatWereChecking: [],
  whyScouted: "Reason",
  sourceMedia: [],
  evidenceLedger: [],
  pathways: [] as any,
  decisionBrief: {} as any,
  industryLens: {} as any,
  trailerCriticId: null,
  versionProvenance: {} as any,
};

const mockMonitor: ProjectMonitor = {
  id: "mon_123",
  projectId: "proj-parallel-hook",
  queryScope: "Monitored Indie Series financing partners",
  providerState: "active",
  createdAt: "2026-08-01T00:00:00Z",
  targetUrl: "https://variety.com/news/monitored-indie-series",
};

vi.mock("@/services/firestore-repo", () => ({
  dataRepo: {
    getProjectById: vi.fn(),
    getScoutCardById: vi.fn(),
    publishScoutCard: vi.fn(),
    createProject: vi.fn(),
    getProjectMonitorById: vi.fn(),
    saveProjectMonitor: vi.fn(),
    recordWebhookReceipt: vi.fn(),
    hasWebhookReceipt: vi.fn(),
  },
}));

describe("Parallel Webhook Handler (POST /api/webhooks/parallel)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { dataRepo } = await import("@/services/firestore-repo");
    vi.mocked(dataRepo.getProjectById).mockResolvedValue(mockProject);
    vi.mocked(dataRepo.getScoutCardById).mockResolvedValue(mockCard);
    vi.mocked(dataRepo.getProjectMonitorById).mockResolvedValue(mockMonitor);
    vi.mocked(dataRepo.hasWebhookReceipt).mockResolvedValue(false);
  });

  it("acknowledges ping event with 200 OK", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "monitor.ping",
        monitor_id: "mon_123",
        target_url: "https://kickstarter.com",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("updates Scout Card and creates non-destructive new version on monitor.milestone_reached", async () => {
    const { dataRepo } = await import("@/services/firestore-repo");

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "monitor.milestone_reached",
        monitor_id: "mon_123",
        target_url: "https://variety.com/news/monitored-indie-series",
        milestone_text: "Variety announced co-production attachment with Neon",
        citations: [
          {
            url: "https://variety.com/news/monitored-indie-series",
            title: "Variety Exclusive",
            excerpt: "Neon boards North American rights.",
            published_at: "2026-08-15",
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.projectId).toBe("proj-parallel-hook");
    expect(body.cardVersion).toBe(2);

    expect(dataRepo.publishScoutCard).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "card-proj-parallel-hook-v2",
        version: 2,
      })
    );
    expect(dataRepo.createProject).toHaveBeenCalled();
  });

  it("enforces HMAC signature verification when PARALLEL_WEBHOOK_SECRET is set", async () => {
    const originalSecret = process.env.PARALLEL_WEBHOOK_SECRET;
    const testSecret = "whsec_dGVzdC1zZWNyZXQta2V5LTEyMzQ1Njc4OTA=";
    process.env.PARALLEL_WEBHOOK_SECRET = testSecret;

    try {
      const rawPayload = JSON.stringify({
        event: "monitor.ping",
        monitor_id: "mon_123",
      });
      const webhookId = "msg_test_abc123";
      const webhookTimestamp = String(Math.floor(Date.now() / 1000));
      const validSig = computeParallelSignature(testSecret, webhookId, webhookTimestamp, rawPayload);

      // 1. Valid signature succeeds
      const validReq = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
        method: "POST",
        headers: {
          "webhook-id": webhookId,
          "webhook-timestamp": webhookTimestamp,
          "webhook-signature": `v1,${validSig}`,
        },
        body: rawPayload,
      });
      const validRes = await POST(validReq);
      expect(validRes.status).toBe(200);

      // 2. Tampered signature fails with 401
      const invalidReq = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
        method: "POST",
        headers: {
          "webhook-id": webhookId,
          "webhook-timestamp": webhookTimestamp,
          "webhook-signature": "v1,invalid_forged_signature_here",
        },
        body: rawPayload,
      });
      const invalidRes = await POST(invalidReq);
      expect(invalidRes.status).toBe(401);

      // 3. Stale timestamp fails with 401
      const staleTimestamp = String(Math.floor(Date.now() / 1000) - 400); // 400s old
      const staleSig = computeParallelSignature(testSecret, webhookId, staleTimestamp, rawPayload);
      const staleReq = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
        method: "POST",
        headers: {
          "webhook-id": webhookId,
          "webhook-timestamp": staleTimestamp,
          "webhook-signature": `v1,${staleSig}`,
        },
        body: rawPayload,
      });
      const staleRes = await POST(staleReq);
      expect(staleRes.status).toBe(401);
    } finally {
      if (originalSecret !== undefined) {
        process.env.PARALLEL_WEBHOOK_SECRET = originalSecret;
      } else {
        delete process.env.PARALLEL_WEBHOOK_SECRET;
      }
    }
  });

  it("handles duplicate deliveries idempotently without re-publishing card", async () => {
    const { dataRepo } = await import("@/services/firestore-repo");
    vi.mocked(dataRepo.hasWebhookReceipt).mockResolvedValueOnce(true);

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      headers: {
        "webhook-id": "msg_already_processed_123",
      },
      body: JSON.stringify({
        event: "monitor.milestone_reached",
        monitor_id: "mon_123",
        milestone_text: "Old milestone update",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.message).toContain("Duplicate event acknowledged");
    expect(dataRepo.publishScoutCard).not.toHaveBeenCalled();
  });

  it("rejects unknown monitor_id when server mapping cannot resolve project", async () => {
    const { dataRepo } = await import("@/services/firestore-repo");
    vi.mocked(dataRepo.getProjectMonitorById).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "monitor.event.detected",
        monitor_id: "mon_unknown_999",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 for unsupported event type", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "unsupported.event.type",
        monitor_id: "mon_123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty or malformed body", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: "",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
