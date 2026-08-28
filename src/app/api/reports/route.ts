import { NextResponse } from "next/server";
import { ReportInputSchema } from "@/domain/schemas";
import { dataRepo } from "@/services/firestore-repo";
import type { Report } from "@/domain";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ReportInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const { targetType, targetId, reason, details } = parsed.data;
    const reportId = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    const report: Report = {
      id: reportId,
      targetType,
      targetId,
      reportedByUid: "anonymous-scout",
      reason,
      details,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await dataRepo.createReport(report);
    return NextResponse.json({ success: true, reportId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
