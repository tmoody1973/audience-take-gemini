import { NextRequest, NextResponse } from "next/server";
import { dataRepo } from "@/services/firestore-repo";

export interface ParallelWebhookPayload {
  event: "monitor.diff_detected" | "monitor.milestone_reached" | "monitor.ping";
  monitor_id: string;
  target_url: string;
  projectId?: string;
  diff_summary?: string;
  milestone_text?: string;
  timestamp?: string;
  citations?: Array<{
    url: string;
    title: string;
    excerpt: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ParallelWebhookPayload;

    if (!payload || !payload.event) {
      return NextResponse.json({ error: "Invalid webhook payload structure" }, { status: 400 });
    }

    if (payload.event === "monitor.ping") {
      return NextResponse.json({ ok: true, message: "Parallel webhook ping acknowledged" }, { status: 200 });
    }

    const projectId = payload.projectId;
    if (!projectId) {
      return NextResponse.json(
        { ok: true, message: "Webhook acknowledged without associated projectId", received: payload },
        { status: 200 }
      );
    }

    const project = await dataRepo.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found for monitor event" }, { status: 404 });
    }

    // If there is an associated published card, append a fresh milestone lead
    if (project.publishedCardId) {
      const card = await dataRepo.getScoutCardById(project.publishedCardId);
      if (card) {
        const milestoneDesc = payload.milestone_text || payload.diff_summary || `Live web change detected at ${payload.target_url}`;
        
        card.whatWeKnow.push(`Live Monitor Update (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}): ${milestoneDesc}`);
        
        if (payload.citations && payload.citations.length > 0) {
          for (const cite of payload.citations) {
            card.evidenceLedger.push({
              id: `ev_monitor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sourceUrl: cite.url,
              title: cite.title || "Parallel Monitor Citation",
              publisher: "Parallel Web Intelligence",
              claimType: "reported",
              excerpt: cite.excerpt || "",
              verified: true,
              timestamp: new Date().toISOString(),
            });
          }
        }

        await dataRepo.publishScoutCard(card);
      }
    }

    project.updatedAt = new Date().toISOString();
    await dataRepo.createProject(project);

    return NextResponse.json({
      success: true,
      projectId,
      event: payload.event,
      updatedAt: project.updatedAt,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Parallel webhook handler error:", errorMsg);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
