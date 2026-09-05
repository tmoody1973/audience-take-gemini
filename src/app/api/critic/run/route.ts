import { NextRequest, NextResponse } from "next/server";
import { analyzeTrailerVideo, analyzeAnyTrailerVideo } from "@/critic/trailer-critic-engine";
import { validateSafeUrl } from "@/services/ssrf-guard";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { videoUrl, projectId, title, medium } = body || {};

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json({ error: "Missing or invalid videoUrl parameter" }, { status: 400 });
    }

    const urlCheck = await validateSafeUrl(videoUrl);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return NextResponse.json(
        { error: urlCheck.error || "The video URL failed security validation" },
        { status: 400 }
      );
    }

    if (projectId && projectId !== "adhoc") {
      const critic = await analyzeTrailerVideo(projectId, urlCheck.normalizedUrl);
      return NextResponse.json({ success: true, critic });
    } else {
      const critic = await analyzeAnyTrailerVideo(
        urlCheck.normalizedUrl,
        title || "Screen Project",
        medium || "short"
      );
      return NextResponse.json({ success: true, critic });
    }
  } catch (err: any) {
    console.error("Trailer Critic API error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze trailer" }, { status: 500 });
  }
}
