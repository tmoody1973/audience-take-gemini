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
      const doc = await db.collection("scoutBriefs").doc(artifactId).get();
      if (doc.exists) {
        const data = doc.data() as ScoutBrief;
        memoryBriefs.set(artifactId, data);
        return data;
      }
    } catch {
      // In-memory fallback
    }

    return null;
  },

  async getScoutBriefByCardVersion(cardVersionId: string): Promise<ScoutBrief | null> {
    for (const brief of memoryBriefs.values()) {
      if (brief.cardVersionId === cardVersionId && brief.status === "ready") {
        return brief;
      }
    }

    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection("scoutBriefs")
        .where("cardVersionId", "==", cardVersionId)
        .where("status", "==", "ready")
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as ScoutBrief;
        memoryBriefs.set(data.artifactId, data);
        return data;
      }

      // Fallback 1: Direct doc lookup
      const directDoc = await db.collection("scoutBriefs").doc(`scout-brief-${cardVersionId}-g1`).get();
      if (directDoc.exists) {
        const data = directDoc.data() as ScoutBrief;
        memoryBriefs.set(data.artifactId, data);
        return data;
      }
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
