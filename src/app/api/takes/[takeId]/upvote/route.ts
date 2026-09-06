import { run, limit } from "@/lib/social/route";
import { RATE_LIMITS } from "@/lib/trust/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ takeId: string }> }
) {
  const { takeId } = await params;
  return run(request, async (uid, store) => {
    await limit(uid, RATE_LIMITS.take ?? RATE_LIMITS.reply);
    return store.upvoteTake(takeId, uid, true);
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ takeId: string }> }
) {
  const { takeId } = await params;
  return run(request, async (uid, store) => {
    await limit(uid, RATE_LIMITS.take ?? RATE_LIMITS.reply);
    return store.upvoteTake(takeId, uid, false);
  });
}
