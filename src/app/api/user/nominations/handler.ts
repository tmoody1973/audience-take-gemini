import type { Firestore } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { AuthenticationError, verifyAuthenticatedRequest } from "@/lib/auth/verify-request";
import { getAdminFirestore } from "@/lib/firebase/admin";

export type UserNominationItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  submittedUrl: string;
  mediaUrl?: string;
  submissionType: "fan" | "creator";
  whyItShouldGrow: string;
  suggestedFormat?: string;
  audienceFit?: string;
  supportingUrls: string[];
  status: "accepted" | "in_progress" | "published" | "withdrawn" | "failed";
  runId?: string;
  currentStage?: number;
  researchUrl?: string;
  cardUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type RouteDependencies = {
  verifyRequest?: typeof verifyAuthenticatedRequest;
  database?: Firestore;
};

export async function handleGetUserNominations(
  request: NextRequest,
  dependencies: RouteDependencies = {},
) {
  try {
    const { user } = await (dependencies.verifyRequest ?? verifyAuthenticatedRequest)(request);
    const db = dependencies.database ?? getAdminFirestore();

    // Query nominations for this authenticated nominator
    let snapshot;
    try {
      snapshot = await db
        .collection("nominations")
        .where("nominatorUid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    } catch {
      // Fallback if composite index is pending: query without orderBy and sort in memory
      snapshot = await db
        .collection("nominations")
        .where("nominatorUid", "==", user.uid)
        .limit(50)
        .get();
    }

    const nominations: UserNominationItem[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const projectId = String(data.projectId || "");
      
      let projectTitle = "Project under research";
      let projectSlug = `project-${projectId.slice(0, 10).toLowerCase()}`;
      let publicationStatus = "pending";
      let latestRunId = String(data.runId || "");
      let currentStage = 1;
      let runStatus = "queued";

      if (projectId) {
        try {
          const projectDoc = await db.collection("projects").doc(projectId).get();
          if (projectDoc.exists) {
            const pData = projectDoc.data();
            projectTitle = String(pData?.title || projectTitle);
            projectSlug = String(pData?.slug || projectSlug);
            publicationStatus = String(pData?.publicationStatus || publicationStatus);
            if (pData?.latestRunId) {
              latestRunId = String(pData.latestRunId);
            }
          }
        } catch {
          // Gracefully continue with defaults if project fetch fails
        }
      }

      if (latestRunId) {
        try {
          const runDoc = await db.collection("publicResearchRuns").doc(latestRunId).get();
          if (runDoc.exists) {
            const rData = runDoc.data();
            runStatus = String(rData?.status || runStatus);
            currentStage = Number(rData?.currentStage || currentStage);
          }
        } catch {
          // Gracefully continue with defaults if run fetch fails
        }
      }

      // Compute display status
      let displayStatus: UserNominationItem["status"] = "accepted";
      if (data.status === "withdrawn") {
        displayStatus = "withdrawn";
      } else if (publicationStatus === "published" || runStatus === "complete") {
        displayStatus = "published";
      } else if (runStatus === "failed") {
        displayStatus = "failed";
      } else if (runStatus === "in_progress" || currentStage > 1) {
        displayStatus = "in_progress";
      } else {
        displayStatus = "accepted";
      }

      const cardUrl = `/projects/${projectSlug}`;
      const researchUrl = latestRunId ? `/research/${latestRunId}` : undefined;

      nominations.push({
        id: doc.id,
        projectId,
        projectTitle,
        projectSlug,
        submittedUrl: String(data.submittedUrl || ""),
        mediaUrl: data.mediaUrl ? String(data.mediaUrl) : undefined,
        submissionType: (data.submissionType as "fan" | "creator") || "fan",
        whyItShouldGrow: String(data.whyItShouldGrow || ""),
        suggestedFormat: data.suggestedFormat ? String(data.suggestedFormat) : undefined,
        audienceFit: data.audienceFit ? String(data.audienceFit) : undefined,
        supportingUrls: Array.isArray(data.supportingUrls) ? data.supportingUrls.map(String) : [],
        status: displayStatus,
        runId: latestRunId || undefined,
        currentStage,
        researchUrl,
        cardUrl,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || new Date().toISOString()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || new Date().toISOString()),
      });
    }

    // Sort descending by createdAt
    nominations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ok({ nominations });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return fail({ code: "UNAUTHORIZED", message: "Sign in is required to view your nominations." }, 401);
    }
    return fail(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to load nominations.",
      },
      500,
    );
  }
}
