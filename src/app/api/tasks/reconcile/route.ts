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
    const expectedServiceAccount = process.env.CLOUD_TASKS_SERVICE_ACCOUNT?.trim();

    // In production, authentication is strictly required. Fail closed if not configured.
    if (process.env.NODE_ENV === "production") {
      if (!cronSecret && !expectedAudience) {
        return NextResponse.json(
          { ok: false, error: "Server authentication configuration missing (CRON_SECRET or AGENT_SERVICE_AUDIENCE required)" },
          { status: 500 }
        );
      }
      if (!cronSecret && expectedAudience && !expectedServiceAccount) {
        return NextResponse.json(
          { ok: false, error: "Server authentication configuration missing (CLOUD_TASKS_SERVICE_ACCOUNT required in production for OIDC mode)" },
          { status: 500 }
        );
      }
    }

    // Authenticate caller when configuration is present
    if (cronSecret || expectedAudience) {
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized reconcile invocation: missing or invalid Bearer token" },
          { status: 401 }
        );
      }

      let authorized = false;

      // 1. Static CRON_SECRET authorization
      if (cronSecret && token === cronSecret) {
        authorized = true;
      }

      // 2. Google Cloud OIDC token verification (only if configured with service account or in non-production)
      if (!authorized && expectedAudience && (expectedServiceAccount || process.env.NODE_ENV !== "production")) {
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
              { ok: false, error: `Unauthorized service account: expected ${expectedServiceAccount}, got ${payload?.email || "none"}` },
              { status: 403 }
            );
          }
          if (expectedServiceAccount && payload?.email === expectedServiceAccount) {
            authorized = true;
          } else if (!expectedServiceAccount && process.env.NODE_ENV !== "production") {
            authorized = true;
          }
        } catch {
          // Token verification failed
        }
      }

      if (!authorized) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized reconcile invocation" },
          { status: 401 }
        );
      }
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const store = createFirestoreNominationStore(db);

    // Fail closed: dispatcher construction failure MUST return an error and NOT mark pending runs as dispatched
    let dispatcher;
    try {
      dispatcher = createCloudTasksResearchDispatcher();
    } catch (dispatcherErr: unknown) {
      const msg = dispatcherErr instanceof Error ? dispatcherErr.message : String(dispatcherErr);
      return NextResponse.json(
        { ok: false, error: `Cloud Tasks dispatch is not configured: ${msg}` },
        { status: 503 }
      );
    }

    const summary = await reconcilePendingDispatches({ store, dispatcher });

    return NextResponse.json({ ok: true, summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<Response>;
export async function GET(): Promise<Response>;
export async function GET(_request?: Request): Promise<Response> {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed. Use POST to trigger reconciliation." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

