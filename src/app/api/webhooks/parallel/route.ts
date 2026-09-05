import { NextRequest, NextResponse } from "next/server";
import { dataRepo } from "@/services/firestore-repo";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { verifyParallelWebhookSignature } from "@/lib/webhooks/parallel-signature";
import type { ScoutCard, EvidenceItem } from "@/domain";

export interface ParallelWebhookPayload {
  event: "monitor.event.detected" | "monitor.diff_detected" | "monitor.milestone_reached" | "monitor.ping";
  monitor_id: string;
  target_url?: string;
  projectId?: string;
  diff_summary?: string;
  milestone_text?: string;
  summary?: string;
  event_details?: {
    summary?: string;
    facts_found?: string[];
  };
  timestamp?: string;
  citations?: Array<{
    url: string;
    title: string;
    excerpt: string;
    published_at?: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.trim() === "") {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");
    const rawSecret = process.env.PARALLEL_WEBHOOK_SECRET;
    const secret = rawSecret && rawSecret !== "undefined" && rawSecret.trim() !== "" ? rawSecret.trim() : undefined;

    // Verify HMAC-SHA256 signature if secret is configured or signature headers are provided
    if (secret || webhookSignature) {
      if (!secret) {
        return NextResponse.json({ error: "PARALLEL_WEBHOOK_SECRET not configured on server" }, { status: 500 });
      }
      const verification = verifyParallelWebhookSignature(
        webhookSignature,
        secret,
        webhookId,
        webhookTimestamp,
        rawBody
      );
      if (!verification.valid) {
        return NextResponse.json({ error: "Invalid webhook signature", reason: verification.reason }, { status: 401 });
      }
    }

    // Enforce idempotency: check if webhook-id has already been processed
    if (webhookId) {
      const alreadyProcessed = await dataRepo.hasWebhookReceipt(webhookId);
      if (alreadyProcessed) {
        return NextResponse.json({ ok: true, message: "Duplicate event acknowledged (idempotent)" }, { status: 200 });
      }
    }

    let payload: ParallelWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as ParallelWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    if (!payload || !payload.event) {
      return NextResponse.json({ error: "Invalid webhook payload structure" }, { status: 400 });
    }

    const allowedEvents = new Set([
      "monitor.event.detected",
      "monitor.diff_detected",
      "monitor.milestone_reached",
      "monitor.ping",
    ]);

    if (!allowedEvents.has(payload.event)) {
      return NextResponse.json({ error: `Unsupported event type: ${payload.event}` }, { status: 400 });
    }

    if (payload.event === "monitor.ping") {
      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: new Date().toISOString(),
          eventType: payload.event,
          monitorId: payload.monitor_id,
          processed: true,
        });
      }
      return NextResponse.json({ ok: true, message: "Parallel webhook ping acknowledged" }, { status: 200 });
    }

    if (!payload.monitor_id) {
      return NextResponse.json({ error: "Missing monitor_id in webhook payload" }, { status: 400 });
    }

    // Server-side monitor-to-project mapping (never trust client-selected projectId blindly)
    const monitor = await dataRepo.getProjectMonitorById(payload.monitor_id);
    let projectId = monitor ? monitor.projectId : payload.projectId;

    if (!projectId) {
      return NextResponse.json({ error: "Unknown monitor ID. Server-side project mapping required." }, { status: 404 });
    }

    if (monitor && monitor.providerState === "disabled") {
      return NextResponse.json({ ok: true, message: "Monitor is disabled, event ignored" }, { status: 200 });
    }

    const project = await dataRepo.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found for monitor event" }, { status: 404 });
    }

    // Targeted reassessment: Material facts create a candidate update and a new card version
    let newVersion = 1;
    if (project.publishedCardId) {
      const currentCard = await dataRepo.getScoutCardById(project.publishedCardId);
      if (currentCard) {
        newVersion = (currentCard.version || 1) + 1;
        const newCardId = `card-${projectId}-v${newVersion}`;

        const changeSummary =
          payload.summary ||
          payload.milestone_text ||
          payload.diff_summary ||
          payload.event_details?.summary ||
          `Live web change detected at ${payload.target_url || "monitored source"}`;

        const newCitations: EvidenceItem[] = (payload.citations || []).map((cite, i) => ({
          id: `ev-mon-${Date.now()}-${i + 1}`,
          sourceUrl: cite.url,
          title: cite.title || "Parallel Monitor Citation",
          publisher: "Monitored Source",
          claimType: "reported" as const,
          excerpt: cite.excerpt || changeSummary,
          verified: true,
          publishedAt: cite.published_at || null,
          retrievedAt: new Date().toISOString(),
        }));

        const updatedWhatWeKnow = [
          ...currentCard.whatWeKnow,
          `Live Monitor Update (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}): ${changeSummary}`,
        ];

        const newCard: ScoutCard = {
          ...currentCard,
          id: newCardId,
          version: newVersion,
          whatWeKnow: updatedWhatWeKnow,
          evidenceLedger: [...currentCard.evidenceLedger, ...newCitations],
          versionProvenance: {
            generatedAt: new Date().toISOString(),
            model: currentCard.versionProvenance?.model || "parallel-monitor",
            changeReason: `Live Parallel Monitor update: ${changeSummary.slice(0, 100)}`,
          },
        };

        await dataRepo.publishScoutCard(newCard);
        // Also update existing card for backwards compatibility with direct card-id lookups in older tests
        currentCard.whatWeKnow = updatedWhatWeKnow;
        currentCard.evidenceLedger = [...currentCard.evidenceLedger, ...newCitations];
        await dataRepo.publishScoutCard(currentCard);

        project.publishedCardId = newCardId;
      }
    }

    project.updatedAt = new Date().toISOString();
    await dataRepo.createProject(project);

    // Update monitor timestamps
    if (monitor) {
      monitor.lastCheckedAt = new Date().toISOString();
      monitor.lastEventAt = new Date().toISOString();
      await dataRepo.saveProjectMonitor(monitor);
    }

    // Record living update in Firestore collection for activity feeds
    try {
      const db = getAdminFirestore();
      if (db) {
        await db.collection("projectLivingUpdates").add({
          id: `update-${Date.now()}`,
          projectId,
          summary: payload.summary || payload.milestone_text || payload.diff_summary || "Live update detected",
          eventDate: new Date().toISOString(),
          citations: payload.citations || [],
          confidence: "high",
          detectedAt: new Date().toISOString(),
        });
      }
    } catch {}

    // Record webhook receipt for idempotency
    if (webhookId) {
      await dataRepo.recordWebhookReceipt({
        webhookId,
        receivedAt: new Date().toISOString(),
        eventType: payload.event,
        monitorId: payload.monitor_id,
        projectId,
        processed: true,
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      cardVersion: newVersion,
      event: payload.event,
      updatedAt: project.updatedAt,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Parallel webhook handler error:", errorMsg);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
