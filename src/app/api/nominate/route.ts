import { NextRequest, NextResponse } from "next/server";
import { handleNominationPost } from "@/app/api/nominations/handler";
import { validateSafeUrl } from "@/services/ssrf-guard";
import { dataRepo } from "@/services/firestore-repo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkUrl = searchParams.get("checkUrl");

  if (!checkUrl) {
    return NextResponse.json({ error: "Missing checkUrl parameter" }, { status: 400 });
  }

  const urlCheck = await validateSafeUrl(checkUrl);
  if (!urlCheck.valid || !urlCheck.normalizedUrl) {
    return NextResponse.json({ valid: false, error: urlCheck.error }, { status: 400 });
  }

  const existing = await dataRepo.getProjectByNormalizedUrl(urlCheck.normalizedUrl);
  if (existing) {
    return NextResponse.json({
      exists: true,
      projectId: existing.id,
      title: existing.identity.title,
    });
  }

  return NextResponse.json({ exists: false, normalizedUrl: urlCheck.normalizedUrl });
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.clone().json();
    } catch {
      body = {};
    }

    const headers = new Headers(request.headers);
    if (!headers.get("authorization")) {
      headers.set("authorization", "Bearer demo-scout-token");
    }

    // Adapt legacy nominate fields if provided
    if (body.projectUrl && !body.submittedUrl) {
      const canonicalBody = {
        submittedUrl: body.projectUrl,
        mediaUrl: body.youtubeVideoUrl || undefined,
        whyItShouldGrow: body.reason,
        submissionType: body.nominatorRole || "fan",
        suggestedFormat: body.formatNotes || undefined,
        audienceFit: body.audienceNotes || undefined,
        supportingUrls: body.supportingLinks || [],
      };
      const adaptedRequest = new NextRequest(request.url, {
        method: "POST",
        headers,
        body: JSON.stringify(canonicalBody),
      });
      const result = await handleNominationPost(adaptedRequest);
      if (result.status === 200) {
        const json = await result.json();
        if (json.ok && json.data) {
          return NextResponse.json({
            success: true,
            ok: true,
            projectId: json.data.projectId,
            runId: json.data.runId,
            nominationId: json.data.nominationId,
            researchUrl: json.data.researchUrl,
            canonicalUrl: json.data.canonicalUrl,
            data: json.data,
          });
        }
        return NextResponse.json(json, { status: result.status });
      }
      return result;
    }

    const adaptedRequest = new NextRequest(request.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return handleNominationPost(adaptedRequest);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
