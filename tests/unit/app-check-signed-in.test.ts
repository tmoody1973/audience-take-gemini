import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { FIREBASE_APP_CHECK_DEFAULT_SITE_KEY } from "@/lib/firebase/config";
import { nominationCommandHeaders } from "@/lib/nomination/client-auth";
import * as firebaseClient from "@/lib/firebase/client";
import { verifyAuthenticatedRequest, AuthenticationError } from "@/lib/auth/verify-request";
import { handleNominationPost } from "@/app/api/nominations/handler";

describe("Signed-in Nomination & App Check Verification Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("1. exports valid default reCAPTCHA Enterprise site key for production Cloud Run domains", () => {
    expect(FIREBASE_APP_CHECK_DEFAULT_SITE_KEY).toBe("6LdxL5stAAAAAHpXdxPQUfKIyhHZd4pN0UY6Sjcw");
  });

  it("2. nominationCommandHeaders includes App Check token when signed in", async () => {
    const mockIdToken = "firebase-id-token-abc";
    const mockAppCheckToken = "recaptcha-app-check-xyz";

    vi.spyOn(firebaseClient, "getClientAuth").mockReturnValue({
      currentUser: {
        getIdToken: vi.fn().mockResolvedValue(mockIdToken),
      },
    } as any);

    vi.spyOn(firebaseClient, "getClientAppCheckToken").mockResolvedValue(mockAppCheckToken);

    const headers = await nominationCommandHeaders();
    expect(headers["authorization"]).toBe(`Bearer ${mockIdToken}`);
    expect(headers["x-firebase-appcheck"]).toBe(mockAppCheckToken);
  });

  it("3. nominationCommandHeaders throws and does NOT swallow error when App Check fails for signed-in user", async () => {
    const mockIdToken = "firebase-id-token-abc";

    vi.spyOn(firebaseClient, "getClientAuth").mockReturnValue({
      currentUser: {
        getIdToken: vi.fn().mockResolvedValue(mockIdToken),
      },
    } as any);

    vi.spyOn(firebaseClient, "getClientAppCheckToken").mockRejectedValue(
      new Error("reCAPTCHA Enterprise network timeout"),
    );

    await expect(nominationCommandHeaders()).rejects.toThrow(/App Check/);
  });

  it("4. nominationCommandHeaders preserves guest scout without throwing when App Check fails", async () => {
    vi.spyOn(firebaseClient, "getClientAuth").mockReturnValue({
      currentUser: null,
    } as any);

    vi.spyOn(firebaseClient, "getClientAppCheckToken").mockRejectedValue(
      new Error("reCAPTCHA failed for guest"),
    );

    const headers = await nominationCommandHeaders();
    expect(headers["authorization"]).toBe("Bearer demo-scout-token");
    expect(headers["x-firebase-appcheck"]).toBeUndefined();
  });

  it("5. verifyAuthenticatedRequest strictly enforces App Check in production mode", async () => {
    process.env.NODE_ENV = "production";

    const mockServices = {
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: "test-user-123",
        email: "scout@audiencetake.example",
      } as any),
      verifyAppCheckToken: vi.fn().mockResolvedValue({
        appId: "1:866111144888:web:02d8c2e8c00a98ed9c854d",
      }),
    };

    // Case A: Missing App Check header in production -> throws missing_app_check
    const reqWithoutAppCheck = {
      headers: new Headers({
        authorization: "Bearer valid-firebase-token",
      }),
    };

    await expect(
      verifyAuthenticatedRequest(reqWithoutAppCheck, mockServices),
    ).rejects.toThrowError(
      expect.objectContaining({
        code: "missing_app_check",
      }),
    );

    // Case B: Invalid App Check token -> throws invalid_app_check
    const reqWithInvalidAppCheck = {
      headers: new Headers({
        authorization: "Bearer valid-firebase-token",
        "x-firebase-appcheck": "invalid-token",
      }),
    };
    mockServices.verifyAppCheckToken.mockRejectedValueOnce(new Error("Token expired"));

    await expect(
      verifyAuthenticatedRequest(reqWithInvalidAppCheck, mockServices),
    ).rejects.toThrowError(
      expect.objectContaining({
        code: "invalid_app_check",
      }),
    );

    // Case C: Valid App Check token -> returns authenticated user and appId
    const reqWithValidAppCheck = {
      headers: new Headers({
        authorization: "Bearer valid-firebase-token",
        "x-firebase-appcheck": "valid-app-check-token",
      }),
    };

    const result = await verifyAuthenticatedRequest(reqWithValidAppCheck, mockServices);
    expect(result.user.uid).toBe("test-user-123");
    expect(result.appId).toBe("1:866111144888:web:02d8c2e8c00a98ed9c854d");
  });

  it("6. handleNominationPost handles signed-in submissions via /api/nominations with App Check", async () => {
    process.env.NODE_ENV = "production";

    const validSubmission = {
      submittedUrl: "https://www.youtube.com/watch?v=s8G7425lfKs",
      submissionType: "fan",
      whyItShouldGrow: "Compelling sci-fi pilot with outstanding character design and passionate community.",
      supportingUrls: [],
    };

    // Sub-test A: Signed in submission without App Check header is rejected with 401 missing_app_check
    const missingAppCheckReq = new NextRequest("http://localhost:3000/api/nominations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer valid-user-token",
      },
      body: JSON.stringify(validSubmission),
    });

    const mockVerifyFail = vi.fn().mockImplementation(() => {
      throw new AuthenticationError("App verification is required.", "missing_app_check");
    });

    const resFail = await handleNominationPost(missingAppCheckReq, {
      verifyRequest: mockVerifyFail,
    });

    expect(resFail.status).toBe(401);
    const bodyFail = await resFail.json();
    expect(bodyFail.error.code).toBe("missing_app_check");

    // Sub-test B: Signed in submission with valid App Check token succeeds (200 OK)
    const validAppCheckReq = new NextRequest("http://localhost:3000/api/nominations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer valid-user-token",
        "x-firebase-appcheck": "valid-recaptcha-enterprise-appcheck-token",
      },
      body: JSON.stringify(validSubmission),
    });

    const mockVerifySuccess = vi.fn().mockResolvedValue({
      user: { uid: "user-abc-123", email: "scout@test.com" },
      appId: "1:866111144888:web:02d8c2e8c00a98ed9c854d",
    });

    const mockDispatch = vi.fn().mockResolvedValue({ taskId: "task-123" });
    const mockStore = {
      accept: vi.fn().mockResolvedValue({
        kind: "created",
        runId: "run-signed-in-test-999",
        projectId: "proj-signed-in-test-999",
        nominationId: "nom-signed-in-test-999",
        researchUrl: "/research/run-signed-in-test-999",
        canonicalUrl: "https://www.youtube.com/watch?v=s8G7425lfKs",
      }),
      markDispatched: vi.fn().mockResolvedValue(undefined),
    };

    const resSuccess = await handleNominationPost(validAppCheckReq, {
      verifyRequest: mockVerifySuccess,
      database: {} as any,
      consumeLimits: vi.fn().mockResolvedValue(undefined as any),
      store: mockStore as any,
      dispatch: mockDispatch as any,
    });

    const bodySuccess = await resSuccess.json();
    expect(resSuccess.status).toBe(200);
    expect(bodySuccess.ok).toBe(true);
    expect(bodySuccess.data.runId).toBe("run-signed-in-test-999");
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: "run-signed-in-test-999",
        projectId: "proj-signed-in-test-999",
      }),
    );
  });
});
