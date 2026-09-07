import { NextRequest, NextResponse } from "next/server";
import { executeScoutResearchRun } from "@/agent/agent-runner";

export async function POST(request: NextRequest) {
  try {
    const queueHeader = request.headers.get("x-cloudtasks-queuename");
    const taskHeader = request.headers.get("x-cloudtasks-taskname");
    const authHeader = request.headers.get("authorization");

    // Check Cloud Tasks authorization when configured or in production
    const expectedAudience = process.env.AGENT_SERVICE_AUDIENCE?.trim();
    const expectedServiceAccount = process.env.CLOUD_TASKS_SERVICE_ACCOUNT?.trim();
    if (expectedAudience || process.env.NODE_ENV === "production") {
      if (!expectedAudience) {
        return NextResponse.json(
          { ok: false, error: "Server configuration error: AGENT_SERVICE_AUDIENCE missing" },
          { status: 500 }
        );
      }
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized worker invocation: missing Bearer token" },
          { status: 401 }
        );
      }
      try {
        const { OAuth2Client } = await import("google-auth-library");
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: expectedAudience,
        });
        const payload = ticket.getPayload();
        if (expectedServiceAccount && (!payload?.email || payload.email !== expectedServiceAccount)) {
          return NextResponse.json(
            { ok: false, error: `Unauthorized worker service account: expected ${expectedServiceAccount}, got ${payload?.email || "none"}` },
            { status: 403 }
          );
        }
      } catch (authErr: any) {
        return NextResponse.json(
          { ok: false, error: `Invalid worker token: ${authErr?.message || "unauthorized"}` },
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

    const { runId, attempt, taskName } = body || {};

    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ ok: false, error: "Missing or invalid runId" }, { status: 400 });
    }

    // Anchor strictly to stored database run state - reject payload project hijacking
    const { dataRepo } = await import("@/services/firestore-repo");
    const existingRun = await dataRepo.getResearchRunById(runId);
    if (!existingRun) {
      return NextResponse.json({ ok: false, error: "Research run not found in storage" }, { status: 404 });
    }

    const workerId = taskName || taskHeader || `cloud-tasks-${runId}-attempt-${attempt || 1}`;

    const run = await executeScoutResearchRun(runId, {
      workerId,
    });

    if (run.currentStep === "failed") {
      // Differentiate terminal domain failures from retryable errors (R5.7)
      const isTerminal =
        run.errorMessage?.includes("Deterministic validation failed") ||
        run.errorMessage?.includes("quarantined") ||
        run.errorMessage?.includes("No relevant content") ||
        run.errorMessage?.includes("invalid") ||
        run.errorMessage?.includes("Project not found");

      if (isTerminal) {
        return NextResponse.json({
          ok: true,
          status: "failed",
          terminal: true,
          runId: run.id,
          error: run.errorMessage,
        });
      }

      return NextResponse.json(
        {
          ok: false,
          status: "retryable_failure",
          runId: run.id,
          error: run.errorMessage,
        },
        { status: 500 }
      );
    }

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
