import { NextRequest } from "next/server";
import { handleProjectMediaPost } from "./handler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  return handleProjectMediaPost(request, projectId);
}
