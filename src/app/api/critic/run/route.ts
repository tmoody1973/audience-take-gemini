import { NextRequest, NextResponse } from "next/server";
import { analyzeTrailerVideo, analyzeAnyTrailerVideo } from "@/critic/trailer-critic-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, projectId, title, medium } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl parameter" }, { status: 400 });
    }

    if (projectId && projectId !== "adhoc") {
      const critic = await analyzeTrailerVideo(projectId, videoUrl);
      return NextResponse.json({ success: true, critic });
    } else {
      const critic = await analyzeAnyTrailerVideo(videoUrl, title || "Screen Project", medium || "short");
      return NextResponse.json({ success: true, critic });
    }
  } catch (err: any) {
    console.error("Trailer Critic API error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze trailer" }, { status: 500 });
  }
}
