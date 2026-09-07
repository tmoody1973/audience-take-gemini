import { NextRequest, NextResponse } from "next/server";
import { dataRepo } from "@/services/firestore-repo";
import { verifyParallelWebhookSignature } from "@/lib/webhooks/parallel-signature";
import { verifyPublicationGate, checkCitationCoverage } from "@/agent/deterministic-validator";
import type { EvidenceItem, WebhookReceipt } from "@/domain";

export interface ParallelWebhookPayload {
  event?: string;
  type?: string;
  monitor_id?: string;
  target_url?: string;
  projectId?: string;
  diff_summary?: string;
  milestone_text?: string;
  summary?: string;
  error?: string;
  event_details?: {
    summary?: string;
    facts_found?: string[];
  };
  timestamp?: string;
  citations?: Array<{
    url?: string;
    sourceUrl?: string;
    title?: string;
    excerpt?: string;
    publisher?: string;
    published_at?: string;
  }>;
  data?: {
    monitor_id?: string;
    id?: string;
    event?: {
      type?: string;
      content?: string;
      error?: string;
      id?: string;
      date?: string;
      monitor_ts?: string;
      event_group_id?: string;
      citations?: any[];
    };
    summary?: string;
    citations?: any[];
    metadata?: Record<string, any>;
  };
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

    // In production, signature verification is strictly required and fails closed if secret is missing
    const isProd = process.env.NODE_ENV === "production";
    if (isProd || secret || webhookSignature) {
      if (!secret) {
        return NextResponse.json({ error: "PARALLEL_WEBHOOK_SECRET not configured on server" }, { status: 500 });
      }
      if (!webhookSignature) {
        return NextResponse.json({ error: "Missing webhook signature header" }, { status: 401 });
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

    // Normalize event type and monitor ID from standard Parallel structure or legacy flat format
    const eventType =
      payload.type ||
      payload.event ||
      payload.data?.event?.type ||
      "";

    const monitorId =
      payload.monitor_id ||
      payload.data?.monitor_id ||
      payload.data?.id ||
      "";

    if (!eventType) {
      return NextResponse.json({ error: "Invalid webhook payload structure: missing event type" }, { status: 400 });
    }

    const allowedEvents = new Set([
      "monitor.event.detected",
      "monitor.execution.completed",
      "monitor.execution.failed",
      "monitor.diff_detected",
      "monitor.milestone_reached",
      "monitor.ping",
    ]);

    if (!allowedEvents.has(eventType)) {
      return NextResponse.json({ error: `Unsupported event type: ${eventType}` }, { status: 400 });
    }

    if (eventType === "monitor.ping") {
      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: new Date().toISOString(),
          eventType,
          monitorId: monitorId || undefined,
          processed: true,
          outcome: "noop",
          reason: "Parallel ping acknowledged",
        });
      }
      return NextResponse.json({ ok: true, message: "Parallel webhook ping acknowledged" }, { status: 200 });
    }

    if (!monitorId) {
      return NextResponse.json({ error: "Missing monitor_id in webhook payload" }, { status: 400 });
    }

    // Strict server-side monitor-to-project mapping (never trust client-selected projectId fallback)
    const monitor = await dataRepo.getProjectMonitorById(monitorId);
    if (!monitor) {
      return NextResponse.json({ error: "Unknown monitor ID. Server-side project mapping required." }, { status: 404 });
    }
    const projectId = monitor.projectId;

    if (monitor.providerState === "disabled" || monitor.providerState === "canceled") {
      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: new Date().toISOString(),
          eventType,
          monitorId,
          projectId,
          processed: true,
          outcome: "noop",
          reason: `Monitor is ${monitor.providerState}`,
        });
      }
      return NextResponse.json({ ok: true, message: `Monitor is ${monitor.providerState}, event ignored` }, { status: 200 });
    }

    const project = await dataRepo.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found for monitor event" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Handle monitor.execution.completed (quiet check with no new material events)
    if (eventType === "monitor.execution.completed") {
      monitor.lastCheckedAt = now;
      monitor.lastSuccessfulCheckAt = now;
      monitor.lastExecutionResult = "completed_quiet";
      await dataRepo.saveProjectMonitor(monitor);

      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: now,
          eventType,
          monitorId,
          projectId,
          processed: true,
          outcome: "noop",
          reason: "Quiet execution with no material changes",
        });
      }

      return NextResponse.json({
        ok: true,
        status: "noop",
        message: "Quiet execution recorded without card mutation",
      });
    }

    // Handle monitor.execution.failed (execution error on provider side)
    if (eventType === "monitor.execution.failed") {
      const errorDetail =
        payload.data?.event?.error ||
        payload.error ||
        "Monitor execution failed on provider";

      monitor.lastCheckedAt = now;
      monitor.lastExecutionResult = "failed";
      await dataRepo.saveProjectMonitor(monitor);

      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: now,
          eventType,
          monitorId,
          projectId,
          processed: true,
          outcome: "failed",
          reason: errorDetail,
        });
      }

      return NextResponse.json({
        ok: true,
        status: "failure_recorded",
        message: "Monitor execution failure recorded",
        error: errorDetail,
      });
    }

    // Handle monitor.event.detected (and diff/milestone variations)
    const changeSummary =
      payload.summary ||
      payload.milestone_text ||
      payload.diff_summary ||
      payload.data?.summary ||
      payload.data?.event?.content ||
      payload.event_details?.summary ||
      "";

    const rawCitations =
      payload.citations ||
      payload.data?.citations ||
      payload.data?.event?.citations ||
      [];

    const hasCitations = Array.isArray(rawCitations) && rawCitations.length > 0;

    // Detect no-op health checks or events without material changes
    if (!changeSummary || changeSummary.trim() === "" || (!hasCitations && eventType === "monitor.diff_detected")) {
      monitor.lastCheckedAt = now;
      monitor.lastSuccessfulCheckAt = now;
      monitor.lastExecutionResult = "completed_quiet";
      await dataRepo.saveProjectMonitor(monitor);

      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: now,
          eventType,
          monitorId,
          projectId,
          processed: true,
          outcome: "noop",
          reason: "Health check or empty change summary recorded without card mutation",
        });
      }
      return NextResponse.json({ ok: true, status: "noop", message: "Health check recorded without card mutation" });
    }

    // Targeted reassessment: Material facts create a candidate update and a new card version
    if (!project.publishedCardId) {
      return NextResponse.json({ error: "No published card found for project" }, { status: 404 });
    }

    const currentCard = await dataRepo.getScoutCardById(project.publishedCardId);
    if (!currentCard) {
      return NextResponse.json({ error: "Published scout card record not found" }, { status: 404 });
    }

    const currentVersion = currentCard.version || 1;
    const newVersion = currentVersion + 1;
    const newCardId = `card-${projectId}-v${newVersion}`;

    const newCitations: EvidenceItem[] = rawCitations.map((c: any, idx: number) => ({
      id: `ev-mon-${Date.now()}-${idx}`,
      sourceUrl: c.url || c.sourceUrl || "https://parallel.ai",
      title: c.title || "Live Monitor Observation",
      publisher: c.publisher || "Parallel Monitor",
      claimType: "observation",
      excerpt: c.excerpt || c.title || "Monitor observation passage.",
      verified: true,
      retrievedAt: now,
    }));

    // Citation coverage gate: verify candidate change summary is genuinely supported by source passages
    const coverage = checkCitationCoverage(newCitations, [changeSummary]);
    if (!coverage.sufficientCoverage) {
      console.warn("[Parallel Webhook] Monitor update withheld: changeSummary lacks citation passage support:", changeSummary);
      const reasonMsg = `changeSummary lacks passage grounding in provided citations: ${changeSummary}`;

      monitor.lastCheckedAt = now;
      monitor.lastExecutionResult = "withheld";
      await dataRepo.saveProjectMonitor(monitor);

      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: now,
          eventType,
          monitorId,
          projectId,
          processed: true,
          outcome: "withheld",
          reason: reasonMsg,
        });
      }

      return NextResponse.json({
        ok: true,
        status: "withheld",
        message: "Event processed but card update withheld due to unverified claims or contradictions.",
        errors: [reasonMsg],
      });
    }

    const updatedWhatWeKnow = [
      ...currentCard.whatWeKnow,
      `Live Monitor Update (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}): ${changeSummary}`,
    ];

    const candidateCard: any = {
      ...currentCard,
      projectTitle: project.identity.title,
      medium: project.identity.medium,
      stage: project.identity.currentStage,
      creators: project.identity.creators,
      id: newCardId,
      version: newVersion,
      whatWeKnow: updatedWhatWeKnow,
      evidenceLedger: [...currentCard.evidenceLedger, ...newCitations],
      versionProvenance: {
        generatedAt: now,
        model: currentCard.versionProvenance?.model || "parallel-monitor",
        changeReason: `Live Parallel Monitor update: ${changeSummary.slice(0, 100)}`,
      },
    };

    const gateResult = verifyPublicationGate(candidateCard);
    if (!gateResult.passed || !gateResult.sanitizedCard) {
      console.warn("[Parallel Webhook] Monitor update failed publication gate:", gateResult.errors);
      const reasonMsg = `Publication gate failed: ${gateResult.errors.join("; ")}`;

      monitor.lastCheckedAt = now;
      monitor.lastExecutionResult = "withheld";
      await dataRepo.saveProjectMonitor(monitor);

      if (webhookId) {
        await dataRepo.recordWebhookReceipt({
          webhookId,
          receivedAt: now,
          eventType,
          monitorId,
          projectId,
          processed: true,
          outcome: "withheld",
          reason: reasonMsg,
        });
      }

      return NextResponse.json({
        ok: true,
        status: "withheld",
        message: "Event processed but card update withheld due to unverified claims or contradictions.",
        errors: gateResult.errors,
      });
    }

    const receipt: WebhookReceipt = {
      webhookId: webhookId || `wh-mon-${Date.now()}`,
      receivedAt: now,
      eventType,
      monitorId,
      projectId,
      processed: true,
      outcome: "accepted",
      reason: `Published v${newVersion} from live monitor observation`,
    };

    // Atomically publish card update, update project pointer, set audioStale, and write receipt
    const atomicResult = await dataRepo.atomicPublishMonitorCardUpdate({
      projectId,
      expectedBaseVersion: currentVersion,
      newCard: gateResult.sanitizedCard,
      monitorId,
      receipt,
      monitorUpdates: {
        lastExecutionResult: "detected_change",
        lastMaterialChangeAt: now,
      },
      livingUpdate: {
        summary: changeSummary,
        citations: rawCitations,
        category: "production",
      },
    });

    return NextResponse.json({
      success: true,
      projectId,
      cardVersion: newVersion,
      event: eventType,
      updatedAt: atomicResult.project.updatedAt,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Parallel webhook handler error:", errorMsg);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}

