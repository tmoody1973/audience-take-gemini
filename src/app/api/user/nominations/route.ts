import type { NextRequest } from "next/server";

import { handleGetUserNominations } from "./handler";

export async function GET(request: NextRequest) {
  return handleGetUserNominations(request);
}
