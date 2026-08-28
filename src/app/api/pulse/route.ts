import { NextResponse } from "next/server";
import { PulseEngagementInputSchema, TakeInputSchema, ReplyInputSchema } from "@/domain/schemas";
import { dataRepo } from "@/services/firestore-repo";
import type { Take, Reply } from "@/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const uid = searchParams.get("uid") || "guest-fan";

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const project = await dataRepo.getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const userRecord = await dataRepo.getUserEngagement(projectId, uid);
  const takes = await dataRepo.getTakesByProject(projectId);

  return NextResponse.json({
    metrics: project.metrics,
    userRecord,
    takes,
  });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = PulseEngagementInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { projectId, action, city, pathwayIndex } = parsed.data;
    const uid = "guest-fan"; // In production, resolved from verified Firebase Auth session

    const result = await dataRepo.updatePulseEngagement(projectId, uid, action, city, pathwayIndex);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const type = json.type; // "take" | "reply"

    if (type === "take") {
      const parsed = TakeInputSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

      const takeId = `take-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const take: Take = {
        id: takeId,
        projectId: parsed.data.projectId,
        authorUid: "guest-fan",
        authorDisplayName: "Anonymous Scout",
        body: parsed.data.body,
        pathwayAlignment: parsed.data.pathwayAlignment ?? null,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dataRepo.createTake(take);
      return NextResponse.json({ success: true, take });
    }

    if (type === "reply") {
      const parsed = ReplyInputSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

      const replyId = `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const reply: Reply = {
        id: replyId,
        takeId: parsed.data.takeId,
        projectId: parsed.data.projectId,
        authorUid: "guest-fan",
        authorDisplayName: "Anonymous Scout",
        body: parsed.data.body,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      await dataRepo.createReply(reply);
      return NextResponse.json({ success: true, reply });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
