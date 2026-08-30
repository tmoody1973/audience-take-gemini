import type { Firestore } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { AuthenticationError, verifyAuthenticatedRequest } from "@/lib/auth/verify-request";
import { getAdminFirestore } from "@/lib/firebase/admin";

const updateNominationSchema = z
  .object({
    whyItShouldGrow: z.string().trim().min(10).max(1_200).optional(),
    suggestedFormat: z.string().trim().max(240).optional(),
    audienceFit: z.string().trim().max(500).optional(),
    supportingUrls: z.array(z.string().trim().url()).max(5).optional(),
  })
  .strict();

type RouteDependencies = {
  verifyRequest?: typeof verifyAuthenticatedRequest;
  database?: Firestore;
};

export async function handlePatchNomination(
  request: NextRequest,
  nominationId: string,
  dependencies: RouteDependencies = {},
) {
  try {
    const { user } = await (dependencies.verifyRequest ?? verifyAuthenticatedRequest)(request);
    const db = dependencies.database ?? getAdminFirestore();

    const nominationRef = db.collection("nominations").doc(nominationId);
    const nominationDoc = await nominationRef.get();

    if (!nominationDoc.exists) {
      return fail({ code: "NOT_FOUND", message: "Nomination not found." }, 404);
    }

    const data = nominationDoc.data();
    if (data?.nominatorUid !== user.uid) {
      return fail({ code: "FORBIDDEN", message: "You do not own this nomination." }, 403);
    }

    if (data?.status === "withdrawn") {
      return fail({ code: "INVALID_STATE", message: "Cannot edit a withdrawn nomination." }, 400);
    }

    const body = await request.json();
    const parsed = updateNominationSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid nomination update payload.",
          fields: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (parsed.data.whyItShouldGrow !== undefined) {
      updates.whyItShouldGrow = parsed.data.whyItShouldGrow;
    }
    if (parsed.data.suggestedFormat !== undefined) {
      updates.suggestedFormat = parsed.data.suggestedFormat;
    }
    if (parsed.data.audienceFit !== undefined) {
      updates.audienceFit = parsed.data.audienceFit;
    }
    if (parsed.data.supportingUrls !== undefined) {
      updates.supportingUrls = parsed.data.supportingUrls;
    }

    await nominationRef.update(updates);

    return ok({ updated: true, nominationId });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return fail({ code: "UNAUTHORIZED", message: "Sign in is required." }, 401);
    }
    return fail(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update nomination.",
      },
      500,
    );
  }
}

export async function handleDeleteNomination(
  request: NextRequest,
  nominationId: string,
  dependencies: RouteDependencies = {},
) {
  try {
    const { user } = await (dependencies.verifyRequest ?? verifyAuthenticatedRequest)(request);
    const db = dependencies.database ?? getAdminFirestore();

    const nominationRef = db.collection("nominations").doc(nominationId);
    const nominationDoc = await nominationRef.get();

    if (!nominationDoc.exists) {
      return fail({ code: "NOT_FOUND", message: "Nomination not found." }, 404);
    }

    const data = nominationDoc.data();
    if (data?.nominatorUid !== user.uid) {
      return fail({ code: "FORBIDDEN", message: "You do not own this nomination." }, 403);
    }

    // Mark as withdrawn rather than hard deleting to keep audit ledger
    await nominationRef.update({
      status: "withdrawn",
      withdrawnAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return ok({ withdrawn: true, nominationId });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return fail({ code: "UNAUTHORIZED", message: "Sign in is required." }, 401);
    }
    return fail(
      {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to withdraw nomination.",
      },
      500,
    );
  }
}
