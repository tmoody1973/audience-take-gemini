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
    const json = await request.json();
    const { runId, forceRetry } = json;

    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ error: "Missing or invalid runId" }, { status: 400 });
    }

    const updatedRun = await executeScoutResearchRun(runId, {
      forceRetry: Boolean(forceRetry),
    });
    return NextResponse.json({ success: true, run: updatedRun });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
