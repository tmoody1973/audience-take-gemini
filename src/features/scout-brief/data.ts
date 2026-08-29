import type { ScoutCard } from "@/features/scout-card/types";
import type { ScoutBrief } from "./types";
import { ScoutBriefSchema } from "./schema";
import { scoutBriefStore } from "@/services/scout-brief/store";
import { generateAndPublishScoutBrief } from "@/services/scout-brief/service";

/**
 * Server-side loader for the Scout Brief attached to a specific Scout Card version.
 */
export async function loadScoutBriefForCard(card: ScoutCard): Promise<ScoutBrief | null> {
  if (!card || !card.cardVersionId) return null;

  try {
    // 1. Query Firestore / Store for existing ready artifact
    const existing = await scoutBriefStore.getScoutBriefByCardVersion(card.cardVersionId);
    if (existing) {
      const parsed = ScoutBriefSchema.safeParse(existing);
      if (parsed.success) {
        return parsed.data as ScoutBrief;
      }
    }

    // 2. Generate on-demand if missing (deterministic generation)
    const generated = await generateAndPublishScoutBrief(card);
    const parsed = ScoutBriefSchema.safeParse(generated);
    if (parsed.success) {
      return parsed.data as ScoutBrief;
    }
  } catch (err) {
    console.warn(`[ScoutBrief] Failed to load or generate brief for card ${card.cardVersionId}:`, err);
  }

  return null;
}
