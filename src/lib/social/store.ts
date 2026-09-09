import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const COMMITMENT_TYPES = ["would_watch", "would_pay", "bring_to_city", "back_next_chapter"] as const;
export type CommitmentType = (typeof COMMITMENT_TYPES)[number];
export const followId = (projectId: string, uid: string) => `${projectId}_${uid}`;
export const commitmentId = (projectId: string, uid: string, type: CommitmentType) => `${projectId}_${uid}_${type}`;
export const voteId = (projectId: string, uid: string) => `${projectId}_${uid}`;
export const takeId = (projectId: string, uid: string) => `${projectId}_${uid}`;
export const replyId = (take: string, uid: string) => `${take}_${uid}`;
export const takeUpvoteId = (takeId: string, uid: string) => `${takeId}_${uid}`;
export function normalizeCity(city: string): string {
  const cleaned = city.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  // Check if city has a state/country suffix like "City, ST"
  const parts = cleaned.split(",").map((p) => p.trim());
  const toTitle = (s: string) =>
    s
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (parts.length === 2 && parts[1].length <= 3) {
    return `${toTitle(parts[0])}, ${parts[1].toUpperCase()}`;
  }
  return parts.map(toTitle).join(", ");
}

export function moveCityCommitmentCount(
  counts: Record<string, number>,
  previousCity: string | undefined,
  nextCity: string | undefined,
  active = true
): Record<string, number> {
  const result = { ...counts };
  const prevNorm = previousCity ? normalizeCity(previousCity) : undefined;
  const nextNorm = nextCity ? normalizeCity(nextCity) : undefined;

  if (prevNorm && prevNorm in result) {
    result[prevNorm] = Math.max(0, (result[prevNorm] ?? 0) - 1);
  }
  if (active && nextNorm) {
    result[nextNorm] = (result[nextNorm] ?? 0) + 1;
  }
  return result;
}

export function moveVoteCounts(counts: Record<string, number>, previous: string | undefined, next: string, active = true) {
  const result = { ...counts };
  if (previous && previous !== next) result[previous] = Math.max(0, (result[previous] ?? 0) - 1);
  if (active && previous !== next) result[next] = Math.max(0, (result[next] ?? 0) + 1);
  return result;
}

export class SocialError extends Error { constructor(readonly code: string, message: string, readonly status = 400) { super(message); } }
type Tx = FirebaseFirestore.Transaction;
// Firestore documents are intentionally schemaless at this boundary; route
// payloads are validated before they reach this store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Record<string, any>;

async function projectAndPathway(tx: Tx, db: Firestore, projectId: string, pathwayId?: string) {
  let projectRef = db.collection("projects").doc(projectId);
  let projectSnap = await tx.get(projectRef);
  if (!projectSnap.exists) {
    const slugSnap = await tx.get(db.collection("projects").where("slug", "==", projectId).limit(1));
    if (!slugSnap.empty) {
      projectRef = slugSnap.docs[0].ref;
      projectSnap = slugSnap.docs[0];
    }
  }
  if (!projectSnap.exists) throw new SocialError("project_not_found", "Project was not found.", 404);
  const project = (projectSnap.data() ?? {}) as Data;
  const pubStatus = project.publicationStatus ?? (project.publishedCardId || project.latestCardVersionId ? "published" : "draft");
  if (pubStatus !== "published" || (project.moderationState !== undefined && project.moderationState !== "clear")) throw new SocialError("project_unavailable", "This project is not available.", 404);
  const canonicalProjectId = projectRef.id;
  if (!pathwayId) return { projectRef, project, canonicalProjectId };
  const cardId = project.latestCardVersionId || project.publishedCardId;
  if (typeof cardId !== "string") throw new SocialError("pathway_unavailable", "That pathway is not available.", 400);
  const cardSnap = await tx.get(db.collection("scoutCards").doc(cardId));
  const card = (cardSnap.data() ?? {}) as Data;
  const pathways = Array.isArray(card.pathways) ? card.pathways : [];
  if (!pathways.some((p: Data) => p.id === pathwayId && (card.visibility === undefined || card.visibility === "public"))) throw new SocialError("pathway_unavailable", "That pathway is not available.", 400);
  return { projectRef, project, canonicalProjectId };
}
const inc = (n: unknown, delta: number) => Math.max(0, (typeof n === "number" ? n : 0) + delta);

export function moveCommitmentCount(
  counts: Record<string, number>,
  type: CommitmentType,
  wasActive: boolean,
  active: boolean,
) {
  const result = { ...counts };
  if (wasActive !== active) result[type] = inc(result[type], active ? 1 : -1);
  return { counts: result, count: inc(result[type], 0) };
}

export function socialCounterFields(demoOnly: boolean) {
  return {
    follower: demoOnly ? "demoFollowerCount" : "followerCount",
    commitments: demoOnly ? "demoCommitmentCounts" : "commitmentCounts",
    votes: demoOnly ? "demoPathwayVoteCounts" : "pathwayVoteCounts",
    takes: demoOnly ? "demoTakeCount" : "takeCount",
    replies: demoOnly ? "demoReplyCount" : "replyCount",
    cities: demoOnly ? "demoCityCounts" : "cityCounts",
  } as const;
}

export function createSocialStore(db: Firestore, options: { demoOnly?: boolean } = {}) {
  const demoOnly = options.demoOnly === true;
  const demoFields = socialCounterFields(demoOnly);
  const activityLabel = demoOnly ? { demoOnly: true, demoLabel: "Demo activity" } : { demoOnly: false };
  return {
    follow(projectId: string, uid: string, active: boolean) {
      return db.runTransaction(async tx => {
        const { projectRef, project, canonicalProjectId } = await projectAndPathway(tx, db, projectId);
        const ref = db.collection("follows").doc(followId(canonicalProjectId, uid));
        const old = (await tx.get(ref)).data() as Data | undefined;
        const was = old?.active === true;
        if (was !== active) {
          tx.set(projectRef, { [demoFields.follower]: inc(project[demoFields.follower], active ? 1 : -1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        tx.set(ref, { projectId: canonicalProjectId, uid, active, ...activityLabel, updatedAt: FieldValue.serverTimestamp(), ...(active ? { createdAt: old?.createdAt ?? FieldValue.serverTimestamp() } : {}) }, { merge: true });
        return { active };
      });
    },
    commitment(projectId: string, uid: string, type: CommitmentType, active: boolean, city?: string) {
      return db.runTransaction(async tx => {
        const { projectRef, project, canonicalProjectId } = await projectAndPathway(tx, db, projectId);
        if (type === "bring_to_city" && active && !city?.trim()) throw new SocialError("city_required", "A city is required for this commitment.");
        const ref = db.collection("commitments").doc(commitmentId(canonicalProjectId, uid, type));
        const old = (await tx.get(ref)).data() as Data | undefined;
        const was = old?.active === true;
        const { counts, count } = moveCommitmentCount(project[demoFields.commitments] ?? {}, type, was, active);
        const updates: Data = { updatedAt: FieldValue.serverTimestamp() };
        if (was !== active) {
          updates[demoFields.commitments] = counts;
        }
        if (type === "bring_to_city") {
          const currentCityCounts = (project[demoFields.cities] ?? {}) as Record<string, number>;
          const nextCityCounts = moveCityCommitmentCount(
            currentCityCounts,
            was ? (old?.city as string | undefined) : undefined,
            active ? city?.trim() : undefined,
            active
          );
          updates[demoFields.cities] = nextCityCounts;
        }
        tx.set(projectRef, updates, { merge: true });
        const normalized = city?.trim() ? normalizeCity(city.trim()) : undefined;
        tx.set(ref, { projectId: canonicalProjectId, uid, type, active, ...activityLabel, ...(normalized ? { city: normalized } : {}), updatedAt: FieldValue.serverTimestamp(), ...(old?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
        return { active, type, count, counterKind: demoOnly ? "demo" : "organic", ...(normalized ? { city: normalized } : {}) };
      });
    },
    vote(projectId: string, uid: string, pathwayId: string | undefined, active: boolean) {
      return db.runTransaction(async tx => {
        if (active && !pathwayId) throw new SocialError("invalid_vote", "A pathway is required.");
        const { projectRef, project, canonicalProjectId } = await projectAndPathway(tx, db, projectId, active ? pathwayId : undefined);
        const ref = db.collection("pathwayVotes").doc(voteId(canonicalProjectId, uid));
        const old = (await tx.get(ref)).data() as Data | undefined;
        const previous = old?.active === true ? old.pathwayId as string : undefined;
        const target = pathwayId ?? previous;
        if (active && target && previous !== target) {
          const counts = { ...(project[demoFields.votes] ?? {}) };
          if (previous) counts[previous] = inc(counts[previous], -1);
          counts[target] = inc(counts[target], 1);
          tx.set(projectRef, { [demoFields.votes]: counts }, { merge: true });
        } else if (active && target && old?.active !== true) {
          const counts = { ...(project[demoFields.votes] ?? {}) };
          counts[target] = inc(counts[target], 1);
          tx.set(projectRef, { [demoFields.votes]: counts }, { merge: true });
        } else if (!active && previous) {
          const counts = { ...(project[demoFields.votes] ?? {}) };
          counts[previous] = inc(counts[previous], -1);
          tx.set(projectRef, { [demoFields.votes]: counts }, { merge: true });
        }
        tx.set(ref, { projectId: canonicalProjectId, uid, ...(target ? { pathwayId: target } : {}), active, visibility: "public", ...activityLabel, updatedAt: FieldValue.serverTimestamp(), ...(old?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
        return { active, pathwayId: target };
      });
    },
    take(projectId: string, uid: string, input: { whyItShouldGrow: string; preferredPathwayId: string; audienceNote?: string }, active: boolean, edit = false) {
      return db.runTransaction(async tx => {
        const { projectRef, project, canonicalProjectId } = await projectAndPathway(tx, db, projectId, active ? input.preferredPathwayId : undefined);
        const ref = db.collection("takes").doc(takeId(canonicalProjectId, uid));
        const voteRef = db.collection("pathwayVotes").doc(voteId(canonicalProjectId, uid));
        const old = (await tx.get(ref)).data() as Data | undefined;
        const priorVote = (await tx.get(voteRef)).data() as Data | undefined;
        const was = old?.active === true;
        const previous = priorVote?.active === true ? priorVote.pathwayId as string : undefined;
        if (was !== active) {
          const replySnap = await tx.get(db.collection("replies").where("takeId", "==", ref.id).where("active", "==", true));
          const organicReplies = replySnap.docs.filter((item) => item.data().demoOnly !== true).length;
          const demoReplies = replySnap.docs.length - organicReplies;
          tx.set(projectRef, { [demoFields.takes]: inc(project[demoFields.takes], active ? 1 : -1), replyCount: inc(project.replyCount, active ? organicReplies : -organicReplies), demoReplyCount: inc(project.demoReplyCount, active ? demoReplies : -demoReplies), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        if (active && previous !== input.preferredPathwayId) {
          const counts = { ...(project[demoFields.votes] ?? {}) };
          if (previous) counts[previous] = inc(counts[previous], -1);
          counts[input.preferredPathwayId] = inc(counts[input.preferredPathwayId], 1);
          tx.set(projectRef, { [demoFields.votes]: counts }, { merge: true });
          tx.set(voteRef, { projectId: canonicalProjectId, uid, pathwayId: input.preferredPathwayId, active: true, visibility: "public", ...activityLabel, updatedAt: FieldValue.serverTimestamp(), ...(priorVote?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
        } else if (!active && previous) {
          const counts = { ...(project[demoFields.votes] ?? {}) };
          counts[previous] = inc(counts[previous], -1);
          tx.set(projectRef, { [demoFields.votes]: counts }, { merge: true });
          tx.set(voteRef, { active: false, ...activityLabel, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        tx.set(ref, { ...(active ? input : {}), projectId: canonicalProjectId, uid, active, status: active ? "published" : "withdrawn", ...activityLabel, ...(edit ? { edited: true } : {}), updatedAt: FieldValue.serverTimestamp(), ...(old?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
        return { takeId: ref.id, active };
      });
    },
    reply(takeId: string, uid: string, body: string, mode: "create" | "edit" | "withdraw") { return db.runTransaction(async tx => { const takeRef = db.collection("takes").doc(takeId); const takeSnap = await tx.get(takeRef); if (!takeSnap.exists || (takeSnap.data() as Data)?.active !== true) throw new SocialError("take_unavailable", "That Take is not available.", 404); const take = takeSnap.data() as Data; const projectRef = db.collection("projects").doc(String(take.projectId)); const projectSnap = await tx.get(projectRef); const project = (projectSnap.data() ?? {}) as Data; const pubStatus = project.publicationStatus ?? (project.publishedCardId || project.latestCardVersionId ? "published" : "draft"); if (!projectSnap.exists || pubStatus !== "published" || (project.moderationState !== undefined && project.moderationState !== "clear")) throw new SocialError("project_unavailable", "This project is not available.", 404); const ref = db.collection("replies").doc(replyId(takeId, uid)); const old = (await tx.get(ref)).data() as Data | undefined; if (mode === "create" && old?.active === true) throw new SocialError("reply_exists", "You already replied to this Take.", 409); if (mode === "edit" && old?.active !== true) throw new SocialError("reply_not_found", "Reply was not found.", 404); const was = old?.active === true; const active = mode !== "withdraw"; if (was !== active) { tx.update(takeRef, { [demoFields.replies]: inc(take[demoFields.replies], active ? 1 : -1), updatedAt: FieldValue.serverTimestamp() }); tx.update(projectRef, { [demoFields.replies]: inc(project[demoFields.replies], active ? 1 : -1), updatedAt: FieldValue.serverTimestamp() }); } tx.set(ref, { takeId, projectId: take.projectId, uid, ...(active ? { body, edited: mode === "edit" } : {}), active, status: active ? "published" : "withdrawn", visibility: "public", ...activityLabel, updatedAt: FieldValue.serverTimestamp(), ...(old?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true }); return { replyId: ref.id, active }; }); },
    upvoteTake(takeId: string, uid: string, active: boolean) {
      return db.runTransaction(async (tx) => {
        const takeRef = db.collection("takes").doc(takeId);
        const takeSnap = await tx.get(takeRef);
        const take = (takeSnap.data() ?? {}) as Data;
        if (!takeSnap.exists || take.active !== true) throw new SocialError("take_unavailable", "That Take is not available.", 404);
        await projectAndPathway(tx, db, String(take.projectId));
        const upvoteRef = db.collection("takeUpvotes").doc(takeUpvoteId(takeId, uid));
        const old = (await tx.get(upvoteRef)).data() as Data | undefined;
        const was = old?.active === true;
        const nextUpvotes = inc(take.upvoteCount ?? 0, was === active ? 0 : (active ? 1 : -1));
        if (was !== active) {
          tx.set(takeRef, { upvoteCount: nextUpvotes, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          tx.set(upvoteRef, { takeId, projectId: take.projectId, uid, active, ...activityLabel, updatedAt: FieldValue.serverTimestamp(), ...(was ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
        }
        return { active, upvoteCount: nextUpvotes };
      });
    },
  };
}
