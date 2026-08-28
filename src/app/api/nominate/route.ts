import { NextResponse } from "next/server";
import { NominationInputSchema } from "@/domain/schemas";
import { validateSafeUrl } from "@/services/ssrf-guard";
import { dataRepo } from "@/services/firestore-repo";
import type { Project, ResearchRunState } from "@/domain";

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

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = NominationInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { projectUrl, youtubeVideoUrl, reason, nominatorRole, audienceNotes, formatNotes, supportingLinks } = parsed.data;

    // 1. SSRF URL Security Validation
    const urlCheck = await validateSafeUrl(projectUrl);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return NextResponse.json(
        { error: urlCheck.error || "The project URL failed security validation" },
        { status: 400 }
      );
    }

    // 2. Duplicate Check
    const existing = await dataRepo.getProjectByNormalizedUrl(urlCheck.normalizedUrl);
    if (existing) {
      return NextResponse.json(
        {
          error: "This project has already been scouted!",
          existingProjectId: existing.id,
          existingTitle: existing.identity.title,
        },
        { status: 409 }
      );
    }

    // 3. Create Project & Research Run
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Create Initial Project Entity
    const newProject: Project = {
      id: projectId,
      identity: {
        title: "Investigating Project...",
        normalizedUrl: urlCheck.normalizedUrl,
        originalUrl: projectUrl,
        medium: "short", // default initial, updated by research agent
        currentStage: "concept",
        logline: reason.slice(0, 140),
      },
      publishedCardId: null,
      nomination: {
        submittedByUid: "anonymous-scout", // default or auth uid
        nominatorRole,
        reason,
        initialLinks: [projectUrl, ...(youtubeVideoUrl ? [youtubeVideoUrl] : []), ...supportingLinks],
        audienceNotes,
        formatNotes,
        createdAt: new Date().toISOString(),
      },
      creatorClaim: {
        status: nominatorRole === "creator" ? "pending" : "unclaimed",
        claimedByUid: nominatorRole === "creator" ? "anonymous-scout" : undefined,
      },
      metrics: {
        watchCount: 0,
        payCount: 0,
        cityDemandCount: 0,
        backCount: 0,
        pathwayVotes: [0, 0, 0],
        cities: {},
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initialize Research Run State
    const newRun: ResearchRunState = {
      id: runId,
      projectId,
      nominatorUid: "anonymous-scout",
      sourceUrl: urlCheck.normalizedUrl,
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [
        {
          timestamp: new Date().toISOString(),
          step: "intake",
          message: "Nomination received and validated against SSRF security boundary.",
          status: "done",
        },
        {
          timestamp: new Date().toISOString(),
          step: "fetching",
          message: `Fetching public webpage text from ${urlCheck.normalizedUrl}...`,
          status: "in_progress",
        },
      ],
    };

    await dataRepo.createProject(newProject);
    await dataRepo.saveResearchRun(newRun);

    return NextResponse.json({
      success: true,
      projectId,
      runId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
