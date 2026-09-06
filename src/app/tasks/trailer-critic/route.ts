import { NextRequest, NextResponse } from "next/server";
import { analyzeTrailerVideo } from "@/critic/trailer-critic-engine";

export async function POST(request: NextRequest) {
  try {
    const queueHeader = request.headers.get("x-cloudtasks-queuename");
    const authHeader = request.headers.get("authorization");

    const expectedAudience = process.env.AGENT_SERVICE_AUDIENCE?.trim();
    if (process.env.NODE_ENV === "production") {
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
        await client.verifyIdToken({
          idToken: token,
          audience: expectedAudience,
        });
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

    const { projectId, youtubeVideoId, youtubeUrl } = body || {};

    const url = youtubeUrl || (youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : null);
    if (!url || !projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId or videoUrl in trailer-critic task payload" },
        { status: 400 }
      );
    }

    const { dataRepo } = await import("@/services/firestore-repo");
    const existingProject = await dataRepo.getProjectById(projectId);
    if (!existingProject) {
      return NextResponse.json({ ok: false, error: "Project not found in storage" }, { status: 404 });
    }

    const critic = await analyzeTrailerVideo(projectId, url);

    return NextResponse.json({
      ok: true,
      projectId,
      criticId: critic.id,
      criticMatrix: critic.criticMatrix,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cloud Tasks trailer-critic worker error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
