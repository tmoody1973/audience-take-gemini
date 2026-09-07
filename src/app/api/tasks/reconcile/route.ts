import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { createFirestoreNominationStore } from "@/lib/nomination/store";
import { createCloudTasksResearchDispatcher } from "@/lib/tasks/cloud-tasks";
import { reconcilePendingDispatches } from "@/lib/nomination/reconciler";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();
    const expectedAudience = process.env.AGENT_SERVICE_AUDIENCE?.trim();

    if (process.env.NODE_ENV === "production" && (cronSecret || expectedAudience)) {
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const queueHeader = request.headers.get("x-cloudtasks-queuename");
      const authorized = (cronSecret && token === cronSecret) || Boolean(queueHeader);
      if (!authorized) {
        return NextResponse.json({ ok: false, error: "Unauthorized reconcile invocation" }, { status: 401 });
      }
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const store = createFirestoreNominationStore(db);
    let dispatcher: any;
    try {
      dispatcher = createCloudTasksResearchDispatcher();
    } catch {
      dispatcher = async () => {};
    }
    const summary = await reconcilePendingDispatches({ store, dispatcher });

    return NextResponse.json({ ok: true, summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
