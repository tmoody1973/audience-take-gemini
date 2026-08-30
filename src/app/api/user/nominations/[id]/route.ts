import type { NextRequest } from "next/server";

import { handleDeleteNomination, handlePatchNomination } from "./handler";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return handlePatchNomination(request, id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return handleDeleteNomination(request, id);
}
