import { NextResponse } from "next/server";
import { CreatorClaimInputSchema, CreatorUpdateInputSchema } from "@/domain/schemas";
import { dataRepo } from "@/services/firestore-repo";
import type { CreatorClaim, CreatorUpdate } from "@/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const updates = await dataRepo.getCreatorUpdates(projectId);
  return NextResponse.json({ updates });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const type = json.type; // "claim" | "update"

    if (type === "claim") {
      const parsed = CreatorClaimInputSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

      const claimId = `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const claim: CreatorClaim = {
        id: claimId,
        projectId: parsed.data.projectId,
        claimedByUid: "creator-uid",
        creatorName: parsed.data.creatorName,
        contactEmail: parsed.data.contactEmail,
        proofUrl: parsed.data.proofUrl,
        statement: parsed.data.statement,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };

      await dataRepo.createCreatorClaim(claim);
      return NextResponse.json({ success: true, claim });
    }

    if (type === "update") {
      const parsed = CreatorUpdateInputSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

      const updateId = `update-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const update: CreatorUpdate = {
        id: updateId,
        projectId: parsed.data.projectId,
        creatorUid: "creator-uid",
        creatorName: "Verified Creator",
        title: parsed.data.title,
        body: parsed.data.body,
        mediaUrl: parsed.data.mediaUrl || undefined,
        publishedAt: new Date().toISOString(),
      };

      await dataRepo.createCreatorUpdate(update);
      return NextResponse.json({ success: true, update });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
