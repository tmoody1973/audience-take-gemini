import { NextResponse } from "next/server";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { dataRepo } from "@/services/firestore-repo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "Missing runId parameter" }, { status: 400 });
  }

  const run = await dataRepo.getResearchRunById(runId);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const sanitizedRun = {
    id: run.id,
    projectId: run.projectId,
    sourceUrl: run.sourceUrl,
    currentStep: run.currentStep,
    progressPercent: run.progressPercent,
    stepLogs: run.stepLogs.map((l) => ({
      timestamp: l.timestamp,
      step: l.step,
      message: l.message,
      status: l.status,
    })),
    cardId: run.cardId,
    completedAt: run.completedAt,
    errorMessage: run.errorMessage,
    attempt: run.attempt,
  };

  return NextResponse.json({ run: sanitizedRun });
}

export async function POST(request: Request) {
  try {
    const { verifyAuthenticatedRequest } = await import("@/lib/auth/verify-request");
    let authUser: { uid: string } | null = null;

    try {
      const auth = await verifyAuthenticatedRequest(request as any);
      if (auth && auth.user) {
        authUser = auth.user;
      }
    } catch {
      authUser = null;
    }

    if (!authUser && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Authentication required to retry research" }, { status: 401 });
    }

    let json: any;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { runId, forceRetry } = json || {};
    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ error: "Missing or invalid runId" }, { status: 400 });
    }

    const existingRun = await dataRepo.getResearchRunById(runId);
    if (!existingRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Only original nominator or authenticated user may retry
    if (authUser && existingRun.nominatorUid && existingRun.nominatorUid !== authUser.uid) {
      return NextResponse.json({ error: "Unauthorized: You may only retry your own runs" }, { status: 403 });
    }

    const updatedRun = await executeScoutResearchRun(runId, {
      forceRetry: Boolean(forceRetry),
    });
    return NextResponse.json({ success: true, run: updatedRun });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Sanitize error message so internal provider secrets are not exposed
    const safeMessage = message.includes("API key") ? "Research provider error" : message;
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
