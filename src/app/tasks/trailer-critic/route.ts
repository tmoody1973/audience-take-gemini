import { NextRequest, NextResponse } from "next/server";
import { analyzeTrailerVideo } from "@/critic/trailer-critic-engine";

export async function POST(request: NextRequest) {
  try {
    const queueHeader = request.headers.get("x-cloudtasks-queuename");
    const authHeader = request.headers.get("authorization");

    const expectedAudience = process.env.AGENT_SERVICE_AUDIENCE?.trim();
    if (process.env.NODE_ENV === "production" && expectedAudience) {
      if (!authHeader?.startsWith("Bearer ") && !queueHeader) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized worker invocation" },
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
