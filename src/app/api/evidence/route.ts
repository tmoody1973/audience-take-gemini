import { NextResponse } from "next/server";
import { SuggestEvidenceInputSchema } from "@/domain/schemas";
import { validateSafeUrl } from "@/services/ssrf-guard";
import { dataRepo } from "@/services/firestore-repo";
import type { EvidenceLead } from "@/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const leads = await dataRepo.getEvidenceLeads(projectId);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = SuggestEvidenceInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const { projectId, url, note, proposedAsMedia } = parsed.data;

    // SSRF Check
    const urlCheck = await validateSafeUrl(url);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return NextResponse.json({ error: urlCheck.error || "Invalid URL" }, { status: 400 });
    }

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const lead: EvidenceLead = {
      id: leadId,
      projectId,
      submittedByUid: "guest-fan",
      url: urlCheck.normalizedUrl,
      note,
      proposedAsMedia,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };

    await dataRepo.createEvidenceLead(lead);
    return NextResponse.json({ success: true, lead });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
