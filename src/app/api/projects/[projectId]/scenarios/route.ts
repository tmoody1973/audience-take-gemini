import { NextRequest, NextResponse } from "next/server";
import { ProductionScenarioSchema } from "@/features/production-scenarios/schema";
import { scenarioStore } from "@/services/production-scenarios/store";
import { calculateScenario } from "@/services/production-scenarios/calculator";
import { create2DAnimationScenarioOption } from "@/services/production-scenarios/adapters/animation-2d";
import type { ProductionScenario } from "@/features/production-scenarios/types";

function resolveUserIdentifier(req: NextRequest): string {
  return (
    req.headers.get("x-user-id") ||
    req.cookies.get("uid")?.value ||
    "session-local-user"
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const ownerId = resolveUserIdentifier(req);

  try {
    const existing = await scenarioStore.getScenarioByProjectAndOwner(projectId, ownerId);

    if (existing) {
      const activeOption =
        existing.options.find((o) => o.id === existing.activeOptionId) ||
        existing.options[0];
      const manifest = calculateScenario(activeOption, existing.id, existing.cardVersionId);

      return NextResponse.json({
        scenario: existing,
        manifest,
      });
    }

    // Return initial default template if user has not yet saved one
    const initialOption = create2DAnimationScenarioOption({
      id: "opt-default-poc",
      label: "Proof of Concept (2m)",
      targetFormat: "proof_of_concept",
      runtimeMinutes: 2,
      episodeCount: 1,
      currency: "USD",
    });

    const defaultScenario: ProductionScenario = {
      id: `scen-${projectId}-${ownerId.slice(0, 8)}`,
      projectId,
      cardVersionId: "initial",
      ownerId,
      isPrivate: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: 1,
      options: [initialOption],
      activeOptionId: initialOption.id,
    };

    const manifest = calculateScenario(initialOption, defaultScenario.id, "initial");

    return NextResponse.json({
      scenario: defaultScenario,
      manifest,
      isTemplate: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load scenario", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const ownerId = resolveUserIdentifier(req);

  try {
    const body = await req.json();
    const parsed = ProductionScenarioSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid scenario payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const candidate = parsed.data;

    if (candidate.projectId !== projectId) {
      return NextResponse.json(
        { error: "Scenario project mismatch" },
        { status: 400 }
      );
    }

    // Enforce user ownership
    if (candidate.ownerId !== ownerId && candidate.ownerId !== "session-local-user") {
      return NextResponse.json(
        { error: "Unauthorized: cannot overwrite another user's scenario" },
        { status: 403 }
      );
    }

    // Persist with server-side recalculation
    const result = await scenarioStore.saveScenario({
      ...candidate,
      ownerId,
    } as ProductionScenario);

    return NextResponse.json({
      scenario: result.scenario,
      manifest: result.manifest,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save scenario", details: err.message },
      { status: 500 }
    );
  }
}
