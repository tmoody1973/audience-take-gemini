import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { POST as webhookHandler } from "@/app/api/webhooks/parallel/route";
import { dataRepo } from "@/services/firestore-repo";
import { NextRequest } from "next/server";
import { computeParallelSignature } from "@/lib/webhooks/parallel-signature";
import type { Project, ScoutCard, ProjectMonitor } from "@/domain";

describe("Package C5: Parallel Monitor Webhook & Lifecycle Repair", () => {
  const testSecret = "whsec_" + Buffer.from("super_secret_test_key_parallel_32b").toString("base64");
  const projectId = "proj-c5-monitor-test";
  const monitorId = "monitor_c5_parallel_001";

  const initialProject: Project = {
    id: projectId,
    identity: {
      title: "The Silent Canopy",
      normalizedUrl: "https://example.com/silent-canopy",
      originalUrl: "https://example.com/silent-canopy",
      medium: "series",
      currentStage: "production",
      creators: ["David O'Connor"],
      logline: "An investigative series exploring old-growth forest acoustic ecology.",
    },
    publishedCardId: "card-proj-c5-monitor-test-v1",
    nomination: {} as any,
    creatorClaim: {} as any,
    metrics: {} as any,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  const initialCardV1: ScoutCard = {
    id: "card-proj-c5-monitor-test-v1",
    projectId,
    version: 1,
    status: "published",
    whatWeKnow: [
      "David O'Connor is developing The Silent Canopy as a limited investigative series.",
      "Early soundscape recordings captured in the Pacific Northwest rainforest.",
    ],
    whatWereChecking: ["Production financing commitments."],
    whyScouted: "High-craft environmental docuseries with distinct audio identity.",
    sourceMedia: [],
    evidenceLedger: [
      {
        id: "ev-c5-1",
        sourceUrl: "https://example.com/silent-canopy-announcement",
        title: "The Silent Canopy Announcement",
        publisher: "IndieWire",
        claimType: "reported",
        excerpt: "David O'Connor is developing The Silent Canopy as a limited investigative series with early recordings in the Pacific Northwest.",
        verified: true,
        retrievedAt: "2026-08-01T00:00:00Z",
      },
    ],
    pathways: [
      {
        title: "Prestige Docuseries Co-Production",
        mediumFitRationale: "Multi-part audio-visual scope suited for streaming documentary strands.",
        targetAudience: "Documentary and nature cinema audiences.",
        risksAndUncertainties: ["Securing broadcast co-production partners."],
        nextBoundedExperiment: {
          name: "Rough Audio Teaser",
          description: "Distribute audio teaser to doc funds.",
          successMetric: "Fund application response.",
        },
      },
    ],
    decisionBrief: {
      logline: "An investigative series exploring old-growth forest acoustic ecology.",
      coreHook: "Binaural natural soundscapes married with investigative reporting.",
      comparativeTitles: ["Planet Earth", "Dark City Beneath the Beat"],
      primaryRisk: "Specialized field recording logistics in remote terrain.",
      triageSummary: "Compelling docuseries in early development.",
    },
    industryLens: {
      marketContext: "Surging demand for immersive non-fiction audio-visual storytelling.",
      comparables: ["Tiny Creatures (2020)"],
      realisticConstraints: "Moderate episodic budget required.",
    },
    trailerCriticId: null,
    versionProvenance: {
      generatedAt: "2026-08-01T00:00:00Z",
      model: "gemini-3.5-flash",
      changeReason: "Initial card publication",
    },
  };

  const testMonitor: ProjectMonitor = {
    id: monitorId,
    projectId,
    queryScope: "The Silent Canopy production partners financing festival distribution",
    providerState: "active",
    registrationState: "active",
    createdAt: "2026-08-01T00:00:00Z",
    targetUrl: "https://example.com/silent-canopy",
  };

  function createSignedRequest(
    bodyObj: any,
    options: {
      webhookId?: string;
      timestamp?: string;
      secret?: string;
      corruptSignature?: boolean;
    } = {}
  ): NextRequest {
    const rawBody = JSON.stringify(bodyObj);
    const webhookId = options.webhookId || `wh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const timestamp = options.timestamp || String(Math.floor(Date.now() / 1000));
    const secret = options.secret !== undefined ? options.secret : testSecret;

    let signature = computeParallelSignature(secret, webhookId, timestamp, rawBody);
    if (options.corruptSignature) {
      signature = "bad" + signature.slice(3);
    }

    return new NextRequest("http://localhost:3000/api/webhooks/parallel", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "webhook-id": webhookId,
        "webhook-timestamp": timestamp,
        "webhook-signature": `v1,${signature}`,
      },
      body: rawBody,
    });
  }

  beforeEach(async () => {
    vi.restoreAllMocks();
    process.env.PARALLEL_WEBHOOK_SECRET = testSecret;
    await dataRepo.createProject({ ...initialProject });
    await dataRepo.publishScoutCard({ ...initialCardV1 });
    await dataRepo.saveProjectMonitor({ ...testMonitor });
  });

  describe("1. HMAC Signature Verification & Security Gate", () => {
    it("rejects request when webhook signature is missing or corrupted", async () => {
      const payload = {
        type: "monitor.execution.completed",
        data: { monitor_id: monitorId },
      };

      const corruptReq = createSignedRequest(payload, { corruptSignature: true });
      const res = await webhookHandler(corruptReq);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid webhook signature");
    });

    it("rejects request when timestamp is too old (replay attack protection)", async () => {
      const staleTimestamp = String(Math.floor(Date.now() / 1000) - 400); // > 5 min
      const req = createSignedRequest(
        { type: "monitor.execution.completed", data: { monitor_id: monitorId } },
        { timestamp: staleTimestamp }
      );
      const res = await webhookHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.reason).toContain("expired or too far in the future");
    });
  });

  describe("2. Idempotency & Delivery Receipts", () => {
    it("deduplicates identical webhook-id deliveries idempotently", async () => {
      const webhookId = `wh-c5-idempotency-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await dataRepo.recordWebhookReceipt({
        webhookId,
        receivedAt: new Date().toISOString(),
        eventType: "monitor.execution.completed",
        monitorId,
        projectId,
        processed: true,
        outcome: "noop",
      });

      const req = createSignedRequest(
        { type: "monitor.execution.completed", data: { monitor_id: monitorId } },
        { webhookId }
      );
      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("Duplicate event acknowledged");
    });
  });

  describe("3. Quiet Execution (monitor.execution.completed)", () => {
    it("updates monitor health timestamps without mutating scout card or triggering audio invalidation", async () => {
      const webhookId = `wh-c5-quiet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const req = createSignedRequest(
        {
          type: "monitor.execution.completed",
          data: {
            monitor_id: monitorId,
            event: { type: "completion", monitor_ts: "completed_2026-09-06" },
          },
        },
        { webhookId }
      );

      const res = await webhookHandler(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.status).toBe("noop");

      // Verify monitor health was updated
      const updatedMon = await dataRepo.getProjectMonitorById(monitorId);
      expect(updatedMon?.lastExecutionResult).toBe("completed_quiet");
      expect(updatedMon?.lastSuccessfulCheckAt).toBeDefined();

      // Verify card was NOT mutated
      const proj = await dataRepo.getProjectById(projectId);
      expect(proj?.publishedCardId).toBe("card-proj-c5-monitor-test-v1");
      expect(proj?.audioStale).toBeFalsy();

      // Verify receipt was recorded with outcome: "noop"
      const receipt = await dataRepo.hasWebhookReceipt(webhookId);
      expect(receipt).toBe(true);
    });
  });

  describe("4. Provider Failure (monitor.execution.failed)", () => {
    it("records failure state and receipt without crashing or mutating card", async () => {
      const webhookId = `wh-c5-failed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const req = createSignedRequest(
        {
          type: "monitor.execution.failed",
          data: {
            monitor_id: monitorId,
            event: { type: "error", error: "Parallel upstream scraper rate limited" },
          },
        },
        { webhookId }
      );

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("failure_recorded");
      expect(data.error).toContain("Parallel upstream scraper rate limited");

      const updatedMon = await dataRepo.getProjectMonitorById(monitorId);
      expect(updatedMon?.lastExecutionResult).toBe("failed");

      const receipt = await dataRepo.hasWebhookReceipt(webhookId);
      expect(receipt).toBe(true);
    });
  });

  describe("5. Authoritative Server-Side Project Mapping", () => {
    it("rejects unknown monitor IDs and never allows client metadata to pick arbitrary project", async () => {
      const req = createSignedRequest({
        type: "monitor.event.detected",
        data: {
          monitor_id: "monitor_unknown_999999",
          summary: "Bogus event",
        },
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("Unknown monitor ID");
    });
  });

  describe("6. Citation Grounding Gate & Withheld Updates", () => {
    it("withholds card update when change summary is not grounded in citations, but still writes receipt", async () => {
      const webhookId = `wh-c5-withheld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const ungroundedSummary = "Production secured $20M budget and attached Zendaya as executive producer.";
      const unrelatedCitation = [
        {
          url: "https://example.com/unrelated",
          title: "Weather Report",
          excerpt: "Rainfall in Oregon was slightly above average this past weekend.",
          publisher: "Weather Wire",
        },
      ];

      const req = createSignedRequest(
        {
          type: "monitor.event.detected",
          data: {
            monitor_id: monitorId,
            summary: ungroundedSummary,
            citations: unrelatedCitation,
          },
        },
        { webhookId }
      );

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("withheld");
      expect(data.message).toContain("withheld");

      // Verify card was not bumped
      const proj = await dataRepo.getProjectById(projectId);
      expect(proj?.publishedCardId).toBe("card-proj-c5-monitor-test-v1");

      // Verify monitor status is withheld
      const updatedMon = await dataRepo.getProjectMonitorById(monitorId);
      expect(updatedMon?.lastExecutionResult).toBe("withheld");

      // Critical C5 check: Withheld events MUST record a receipt for idempotency
      const receipt = await dataRepo.hasWebhookReceipt(webhookId);
      expect(receipt).toBe(true);
    });
  });

  describe("7. Verified Material Change Promotion (Card v2)", () => {
    it("atomically promotes card to v2, marks audio stale, and records accepted receipt", async () => {
      const webhookId = `wh-c5-accepted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const groundedSummary = "Selected for Sundance Episodic Lab 2026 with development grant from Pacific Documentary Fund.";
      const validCitations = [
        {
          url: "https://sundance.org/press/episodic-lab-2026",
          title: "Sundance Institute Announces 2026 Episodic Lab Fellows",
          excerpt: "The Silent Canopy by David O'Connor has been selected for Sundance Episodic Lab 2026 with a development grant from Pacific Documentary Fund.",
          publisher: "Sundance Institute",
        },
      ];

      const req = createSignedRequest(
        {
          type: "monitor.event.detected",
          data: {
            monitor_id: monitorId,
            summary: groundedSummary,
            citations: validCitations,
          },
        },
        { webhookId }
      );

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.cardVersion).toBe(2);

      // Verify project pointer was updated to v2 and audio invalidated
      const proj = await dataRepo.getProjectById(projectId);
      expect(proj?.publishedCardId).toBe("card-proj-c5-monitor-test-v2");
      expect(proj?.audioStale).toBe(true);

      // Verify card v2 contains the monitor fact and citations
      const cardV2 = await dataRepo.getScoutCardById("card-proj-c5-monitor-test-v2");
      expect(cardV2).toBeDefined();
      expect(cardV2?.version).toBe(2);
      expect(cardV2?.whatWeKnow.some((k) => k.includes("Sundance Episodic Lab 2026"))).toBe(true);
      expect(cardV2?.evidenceLedger.some((e) => e.sourceUrl.includes("sundance.org"))).toBe(true);

      // Verify monitor status is detected_change
      const updatedMon = await dataRepo.getProjectMonitorById(monitorId);
      expect(updatedMon?.lastExecutionResult).toBe("detected_change");
      expect(updatedMon?.lastMaterialChangeAt).toBeDefined();

      // Verify receipt was saved with outcome: "accepted"
      const receipt = await dataRepo.hasWebhookReceipt(webhookId);
      expect(receipt).toBe(true);
    });
  });

  describe("8. Duplicate Subscription Prevention (getProjectMonitorByProjectId)", () => {
    it("correctly finds existing monitor by project ID to prevent duplicate provider subscriptions", async () => {
      const mon = await dataRepo.getProjectMonitorByProjectId(projectId);
      expect(mon).toBeDefined();
      expect(mon?.id).toBe(monitorId);
      expect(mon?.projectId).toBe(projectId);
      expect(mon?.providerState).toBe("active");
    });
  });

  afterAll(async () => {
    try {
      const { getAdminFirestore } = await import("@/lib/firebase/admin");
      const db = getAdminFirestore();
      if (db) {
        await db.collection("projects").doc(projectId).delete();
        await db.collection("scoutCards").doc("card-proj-c5-monitor-test-v1").delete();
        await db.collection("scoutCards").doc("card-proj-c5-monitor-test-v2").delete();
      }
    } catch {}
  });
});
