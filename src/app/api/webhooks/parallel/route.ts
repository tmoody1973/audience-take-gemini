import { NextRequest, NextResponse } from "next/server";
import { dataRepo } from "@/services/firestore-repo";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { verifyParallelWebhookSignature } from "@/lib/webhooks/parallel-signature";
import { verifyPublicationGate, checkCitationCoverage } from "@/agent/deterministic-validator";
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

    // Strict server-side monitor-to-project mapping (never trust client-selected projectId fallback)
    const monitor = await dataRepo.getProjectMonitorById(payload.monitor_id);
    if (!monitor) {
      return NextResponse.json({ error: "Unknown monitor ID. Server-side project mapping required." }, { status: 404 });
    }
    const projectId = monitor.projectId;

    if (monitor && monitor.providerState === "disabled") {
      return NextResponse.json({ ok: true, message: "Monitor is disabled, event ignored" }, { status: 200 });
    }

    const project = await dataRepo.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found for monitor event" }, { status: 404 });
    }

    const changeSummary =
      payload.summary ||
      payload.milestone_text ||
      payload.diff_summary ||
      payload.event_details?.summary ||
      "";

    // Detect no-op health checks or events without material changes (R6.6)
    const hasCitations = Array.isArray(payload.citations) && payload.citations.length > 0;
    if (!changeSummary || changeSummary.trim() === "" || (!hasCitations && payload.event === "monitor.diff_detected")) {
      if (monitor) {
        monitor.lastCheckedAt = new Date().toISOString();
        await dataRepo.saveProjectMonitor(monitor);
      }
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
      return NextResponse.json({ ok: true, status: "noop", message: "Health check recorded without card mutation" });
    }

    // Targeted reassessment: Material facts create a candidate update and a new card version
    let newVersion = 1;
    if (project.publishedCardId) {
      const currentCard = await dataRepo.getScoutCardById(project.publishedCardId);
      if (currentCard) {
        newVersion = (currentCard.version || 1) + 1;
        const newCardId = `card-${projectId}-v${newVersion}`;

        const newCitations: EvidenceItem[] = (payload.citations || []).map((c: any, idx: number) => ({
          id: `ev-mon-${Date.now()}-${idx}`,
          sourceUrl: c.url || c.sourceUrl || "https://parallel.ai",
          title: c.title || "Live Monitor Observation",
          publisher: c.publisher || "Parallel Monitor",
          claimType: "observation",
          excerpt: c.excerpt || c.title || "Monitor observation passage.",
          verified: true,
          retrievedAt: new Date().toISOString(),
        }));

        // Verify that the candidate change summary is genuinely grounded by the new citations (R6.5 & R6.6)
        const coverage = checkCitationCoverage(newCitations, [changeSummary]);
        if (!coverage.sufficientCoverage) {
          console.warn("[Parallel Webhook] Monitor update withheld: changeSummary lacks citation passage support:", changeSummary);
          return NextResponse.json({
            ok: true,
            status: "withheld",
            message: "Event processed but card update withheld due to unverified claims or contradictions.",
            errors: [`changeSummary lacks passage grounding in provided citations: ${changeSummary}`],
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
            generatedAt: new Date().toISOString(),
            model: currentCard.versionProvenance?.model || "parallel-monitor",
            changeReason: `Live Parallel Monitor update: ${changeSummary.slice(0, 100)}`,
          },
        };

        const gateResult = verifyPublicationGate(candidateCard);
        if (!gateResult.passed || !gateResult.sanitizedCard) {
          console.warn("[Parallel Webhook] Monitor update failed publication gate:", gateResult.errors);
          return NextResponse.json({
            ok: true,
            status: "withheld",
            message: "Event processed but card update withheld due to unverified claims or contradictions.",
            errors: gateResult.errors,
          });
        }

        // Publish ONLY the new version; keep historical versions immutable (R6.7)
        await dataRepo.publishScoutCard(gateResult.sanitizedCard);

        project.publishedCardId = newCardId;
        project.audioStale = true;
      }
    }

    project.updatedAt = new Date().toISOString();
    await dataRepo.createProject(project);

    // Update monitor timestamps
    if (monitor) {
      monitor.lastCheckedAt = new Date().toISOString();
      monitor.lastEventAt = new Date().toISOString();
      monitor.lastSuccessfulResearchAt = new Date().toISOString();
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
