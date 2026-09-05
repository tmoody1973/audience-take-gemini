import { NextRequest, NextResponse } from "next/server";
import { executeScoutResearchRun } from "@/agent/agent-runner";

export async function POST(request: NextRequest) {
  try {
    const queueHeader = request.headers.get("x-cloudtasks-queuename");
    const taskHeader = request.headers.get("x-cloudtasks-taskname");
    const authHeader = request.headers.get("authorization");

    // Check Cloud Tasks authorization when configured
    const expectedAudience = process.env.AGENT_SERVICE_AUDIENCE?.trim();
    if (process.env.NODE_ENV === "production" && expectedAudience) {
      if (!authHeader?.startsWith("Bearer ") && !queueHeader) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized worker invocation: missing Cloud Tasks credentials" },
          { status: 401 }
        );
      }
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const { runId, projectId, attempt, taskName } = body || {};

    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ ok: false, error: "Missing or invalid runId" }, { status: 400 });
    }

    const workerId = taskName || taskHeader || `cloud-tasks-${runId}-attempt-${attempt || 1}`;

    const run = await executeScoutResearchRun(runId, {
      workerId,
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      projectId: run.projectId,
      status: run.currentStep,
      cardId: run.cardId || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cloud Tasks research worker error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
