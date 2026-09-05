import { NextRequest, NextResponse } from "next/server";
import { BenchmarkService } from "@/services/production-scenarios/benchmark-service";
import type { LineItemCategory, ProductionTechnique } from "@/features/production-scenarios/types";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  try {
    const body = await req.json();
    const { technique, targetFormat, missingCategory, geography } = body;

    if (!technique || !missingCategory) {
      return NextResponse.json(
        { error: "technique and missingCategory are required" },
        { status: 400 }
      );
    }

    const service = new BenchmarkService();
    const snapshots = await service.searchBenchmarks({
      technique: technique as ProductionTechnique,
      targetFormat: targetFormat || "proof_of_concept",
      missingCategory: missingCategory as LineItemCategory,
      geography: geography || "US",
      maxSearches: 2,
    });

    return NextResponse.json({
      projectId,
      snapshots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Benchmark research failed", details: err.message },
      { status: 500 }
    );
  }
}
