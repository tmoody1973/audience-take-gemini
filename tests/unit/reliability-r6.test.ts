import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as webhookHandler } from "@/app/api/webhooks/parallel/route";
import { dataRepo } from "@/services/firestore-repo";
import { NextRequest } from "next/server";
import type { Project, ScoutCard, ProjectMonitor } from "@/domain";

describe("Scout Agent Reliability R6: Monitors Produce Verified Changes Through Shared Workflow", () => {
  const projectId = "proj-r6-monitored";
  const monitorId = "mon-r6-test";

  const initialProject: Project = {
    id: projectId,
    identity: {
      title: "Solitary Orbit",
      normalizedUrl: "https://example.com/solitary-orbit",
      originalUrl: "https://example.com/solitary-orbit",
      medium: "feature",
      currentStage: "production",
      creators: ["Elena Rostova"],
      logline: "An atmospheric sci-fi thriller set on an abandoned space outpost.",
    },
    publishedCardId: "card-proj-r6-monitored-v1",
    nomination: {} as any,
    creatorClaim: {} as any,
    metrics: {} as any,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  const initialCardV1: ScoutCard = {
    id: "card-proj-r6-monitored-v1",
    projectId,
    version: 1,
    status: "published",
    whatWeKnow: [
      "Elena Rostova is directing Solitary Orbit as an independent feature.",
      "Principal photography completed on soundstages in Riga.",
    ],
    whatWereChecking: ["North American distribution partnership."],
    whyScouted: "Visually ambitious hard sci-fi indie with international co-production funding.",
    sourceMedia: [],
    evidenceLedger: [
      {
        id: "ev-r6-1",
        sourceUrl: "https://variety.com/news/solitary-orbit",
        title: "Variety: Solitary Orbit in Production",
        publisher: "Variety",
        claimType: "reported",
        excerpt: "Elena Rostova is directing Solitary Orbit as an independent feature with principal photography in Riga.",
        verified: true,
        retrievedAt: "2026-08-01T00:00:00Z",
      },
    ],
    pathways: [
      {
        title: "Theatrical & Platform Sci-Fi Windowing",
        mediumFitRationale: "Feature-length runtime suited for international genre festivals.",
        targetAudience: "Hard sci-fi cinema audiences.",
        risksAndUncertainties: ["Securing domestic distribution commitments."],
        nextBoundedExperiment: {
          name: "Festival Rough Cut Screening",
          description: "Screen for sales agents at Sitges.",
          successMetric: "Multiple sales agent offers.",
        },
      },
    ],
    decisionBrief: {
      logline: "An atmospheric sci-fi thriller set on an abandoned space outpost.",
      coreHook: "Tactile practical sets with rigorous scientific accuracy.",
      comparativeTitles: ["Moon", "High Life"],
      primaryRisk: "High post-production VFX completion cost.",
      triageSummary: "Promising sci-fi feature in active production.",
    },
    industryLens: {
      marketContext: "Elevated sci-fi features command strong international pre-sales.",
      comparables: ["Prospect (2018)"],
      realisticConstraints: "Tight visual effects pipeline required.",
    },
    trailerCriticId: null,
    versionProvenance: {
      generatedAt: "2026-08-01T00:00:00Z",
      model: "gemini-3.5-flash",
      changeReason: "Initial card release",
    },
  };

  const testMonitor: ProjectMonitor = {
    id: monitorId,
    projectId,
    queryScope: "Solitary Orbit distribution buyer attachments",
    providerState: "active",
    createdAt: "2026-08-01T00:00:00Z",
    targetUrl: "https://variety.com/news/solitary-orbit",
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    await dataRepo.createProject({ ...initialProject });
    await dataRepo.publishScoutCard({ ...initialCardV1 });
    await dataRepo.saveProjectMonitor({ ...testMonitor });
  });

  it("handles duplicate webhook deliveries idempotently without re-publishing card", async () => {
    const webhookId = "wh-dedup-12345";
    await dataRepo.recordWebhookReceipt({
      webhookId,
      receivedAt: new Date().toISOString(),
      eventType: "monitor.milestone_reached",
      monitorId,
      projectId,
      processed: true,
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      headers: {
        "webhook-id": webhookId,
        "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      body: JSON.stringify({
        event: "monitor.milestone_reached",
        monitor_id: monitorId,
        milestone_text: "Duplicate event text",
      }),
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.message).toContain("idempotent");

    // Project card version was not modified
    const proj = await dataRepo.getProjectById(projectId);
    expect(proj?.publishedCardId).toBe("card-proj-r6-monitored-v1");
  });

  it("handles no-op events and health checks cleanly without creating cosmetic card versions", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      headers: {
        "webhook-id": `wh-noop-${Date.now()}`,
        "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      body: JSON.stringify({
        event: "monitor.diff_detected",
        monitor_id: monitorId,
        diff_summary: "", // Empty change
        citations: [],
      }),
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("noop");

    // Monitor health check timestamp was updated
    const updatedMonitor = await dataRepo.getProjectMonitorById(monitorId);
    expect(updatedMonitor?.lastCheckedAt).toBeDefined();

    // Card was NOT bumped
    const proj = await dataRepo.getProjectById(projectId);
    expect(proj?.publishedCardId).toBe("card-proj-r6-monitored-v1");
  });

  it("publishes immutable v2 on verified material update while keeping v1 completely unchanged", async () => {
    const changeSummary = "Neon acquired North American distribution rights for Solitary Orbit";
    const citationUrl = "https://variety.com/2026/film/news/solitary-orbit-neon-deal";

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      headers: {
        "webhook-id": `wh-verified-${Date.now()}`,
        "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      body: JSON.stringify({
        event: "monitor.milestone_reached",
        monitor_id: monitorId,
        milestone_text: changeSummary,
        citations: [
          {
            url: citationUrl,
            title: "Variety: Neon Acquires Solitary Orbit",
            excerpt: "Neon acquired North American distribution rights for Solitary Orbit in competitive bidding.",
            published_at: "2026-08-25",
          },
        ],
      }),
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cardVersion).toBe(2);

    // Project points to v2
    const proj = await dataRepo.getProjectById(projectId);
    expect(proj?.publishedCardId).toBe("card-proj-r6-monitored-v2");
    expect(proj?.audioStale).toBe(true); // Flagged for audio regeneration

    // Verify v2 exists and contains new verified knowledge
    const cardV2 = await dataRepo.getScoutCardById("card-proj-r6-monitored-v2");
    expect(cardV2).toBeDefined();
    expect(cardV2?.version).toBe(2);
    expect(cardV2?.whatWeKnow.some((k) => k.includes("Neon acquired"))).toBe(true);

    // Verify v1 is strictly IMMUTABLE (not mutated by v2 publication)
    const cardV1 = await dataRepo.getScoutCardById("card-proj-r6-monitored-v1");
    expect(cardV1).toBeDefined();
    expect(cardV1?.version).toBe(1);
    expect(cardV1?.whatWeKnow.length).toBe(2);
    expect(cardV1?.whatWeKnow.some((k) => k.includes("Neon acquired"))).toBe(false);
  });

  it("withholds card publication when monitor summary lacks citation passage support", async () => {
    const ungroundedSummary = "Universal Pictures greenlit a $100M sequel with full commercial guarantee";

    const req = new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      headers: {
        "webhook-id": `wh-ungrounded-${Date.now()}`,
        "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      body: JSON.stringify({
        event: "monitor.event.detected",
        monitor_id: monitorId,
        summary: ungroundedSummary,
        citations: [
          {
            url: "https://blog.example.com/rumor",
            title: "Sci-Fi Fan Rumor Blog",
            excerpt: "Unsubstantiated Reddit chatter about potential future sequels.",
          },
        ],
      }),
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("withheld");
    expect(body.message).toContain("withheld due to unverified claims");

    // Card was NOT updated
    const proj = await dataRepo.getProjectById(projectId);
    expect(proj?.publishedCardId).toBe("card-proj-r6-monitored-v1");
  });
});
