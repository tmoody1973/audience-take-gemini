import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ScoutBrief, ScoutBriefJob } from "@/features/scout-brief/types";

// In-memory sidecar cache
const memoryBriefs = new Map<string, ScoutBrief>();
const memoryJobs = new Map<string, ScoutBriefJob>();
const memoryAudio = new Map<string, Buffer>();

export const scoutBriefStore = {
  getAudioBuffer(artifactId: string): Buffer | null {
    return memoryAudio.get(artifactId) || null;
  },

  saveAudioBuffer(artifactId: string, buffer: Buffer): void {
    memoryAudio.set(artifactId, buffer);
  },

  async getScoutBrief(artifactId: string): Promise<ScoutBrief | null> {
    const mem = memoryBriefs.get(artifactId);
    if (mem) return mem;

    try {
      const db = getAdminFirestore();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const docPromise = db.collection("scoutBriefs").doc(artifactId).get().then((doc) => {
        if (doc.exists) {
          const data = doc.data() as ScoutBrief;
          memoryBriefs.set(artifactId, data);
          return data;
        }
        return null;
      }).catch(() => null);

      const result = await Promise.race([docPromise, timeoutPromise]);
      if (result) return result;
    } catch {
      // In-memory fallback
    }

    return null;
  },

  async getScoutBriefByCardVersion(
    cardVersionId: string,
    variant?: "discover" | "pro"
  ): Promise<ScoutBrief | null> {
    // 1. Check in-memory briefs
    for (const brief of memoryBriefs.values()) {
      if (brief.cardVersionId === cardVersionId && brief.status === "ready") {
        if (!variant || brief.variant === variant) {
          return brief;
        }
      }
    }

    try {
      const db = getAdminFirestore();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const lookupPromise = (async () => {
        // Direct doc lookups first (fast & requires no composite index)
        if (variant) {
          const variantDoc = await db.collection("scoutBriefs").doc(`scout-brief-${cardVersionId}-${variant}-g1`).get();
          if (variantDoc.exists) {
            const data = variantDoc.data() as ScoutBrief;
            memoryBriefs.set(data.artifactId, data);
            return data;
          }
        }

        const directDoc = await db.collection("scoutBriefs").doc(`scout-brief-${cardVersionId}-g1`).get();
        if (directDoc.exists) {
          const data = directDoc.data() as ScoutBrief;
          if (!data.variant) data.variant = "pro";
          if (!variant || data.variant === variant) {
            memoryBriefs.set(data.artifactId, data);
            return data;
          }
        }

        const snapshot = await db
          .collection("scoutBriefs")
          .where("cardVersionId", "==", cardVersionId)
          .limit(4)
          .get();

        if (!snapshot.empty) {
          for (const doc of snapshot.docs) {
            const data = doc.data() as ScoutBrief;
            if (!data.variant) data.variant = "pro";
            memoryBriefs.set(data.artifactId, data);
            if (!variant || data.variant === variant) {
              return data;
            }
          }
          if (!variant) {
            const first = snapshot.docs[0].data() as ScoutBrief;
            if (!first.variant) first.variant = "pro";
            return first;
          }
        }
        return null;
      })().catch(() => null);

      const result = await Promise.race([lookupPromise, timeoutPromise]);
      if (result) return result;
    } catch {}

    return null;
  },

  async saveScoutBrief(brief: ScoutBrief): Promise<void> {
    memoryBriefs.set(brief.artifactId, brief);

    try {
      const db = getAdminFirestore();
      await db.collection("scoutBriefs").doc(brief.artifactId).set(brief);
    } catch {}
  },

  async saveJob(job: ScoutBriefJob): Promise<void> {
    memoryJobs.set(job.artifactId, job);

    try {
      const db = getAdminFirestore();
      await db.collection("scoutBriefJobs").doc(job.artifactId).set(job);
    } catch {}
  },

  async getJob(artifactId: string): Promise<ScoutBriefJob | null> {
    const mem = memoryJobs.get(artifactId);
    if (mem) return mem;

    try {
      const db = getAdminFirestore();
      const doc = await db.collection("scoutBriefJobs").doc(artifactId).get();
      if (doc.exists) {
        return doc.data() as ScoutBriefJob;
      }
    } catch {}

    return null;
  },
};
