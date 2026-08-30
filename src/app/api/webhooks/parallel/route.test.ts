import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import type { Project, ScoutCard } from "@/domain";

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

vi.mock("@/services/firestore-repo", () => ({
  dataRepo: {
    getProjectById: vi.fn(),
    getScoutCardById: vi.fn(),
    publishScoutCard: vi.fn(),
    createProject: vi.fn(),
  },
}));

describe("Parallel Webhook Handler (POST /api/webhooks/parallel)", () => {
  beforeEach(async () => {
    const { dataRepo } = await import("@/services/firestore-repo");
    vi.mocked(dataRepo.getProjectById).mockResolvedValue(mockProject);
    vi.mocked(dataRepo.getScoutCardById).mockResolvedValue(mockCard);
  });

  it("acknowledges ping event with 200 OK", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "monitor.ping",
        monitor_id: "mon_test",
        target_url: "https://kickstarter.com",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("updates Scout Card and appends evidence on monitor.milestone_reached", async () => {
    const { dataRepo } = await import("@/services/firestore-repo");

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({
        event: "monitor.milestone_reached",
        monitor_id: "mon_123",
        target_url: "https://variety.com/news/monitored-indie-series",
        projectId: "proj-parallel-hook",
        milestone_text: "Variety announced co-production attachment with Neon",
        citations: [
          {
            url: "https://variety.com/news/monitored-indie-series",
            title: "Variety Exclusive",
            excerpt: "Neon boards North American rights.",
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.projectId).toBe("proj-parallel-hook");

    expect(dataRepo.publishScoutCard).toHaveBeenCalled();
    expect(dataRepo.createProject).toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
