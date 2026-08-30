import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { handleGetUserNominations } from "./handler";
import { handleDeleteNomination, handlePatchNomination } from "./[id]/handler";

describe("User Nominations API Handlers", () => {
  it("returns nominations list for authenticated nominator", async () => {
    const mockNominations = [
      {
        id: "nom-1",
        data: () => ({
          projectId: "proj-1",
          nominatorUid: "user-123",
          submissionType: "fan",
          submittedUrl: "https://www.youtube.com/watch?v=123",
          whyItShouldGrow: "Great concept",
          status: "accepted",
          runId: "run-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    ];

    const mockDb = {
      collection: vi.fn((colName: string) => {
        if (colName === "nominations") {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve({ docs: mockNominations })),
                })),
              })),
            })),
          };
        }
        if (colName === "projects") {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve({
                  exists: true,
                  data: () => ({
                    title: "Test Project",
                    slug: "test-project",
                    publicationStatus: "published",
                    latestRunId: "run-1",
                  }),
                }),
              ),
            })),
          };
        }
        if (colName === "publicResearchRuns") {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve({
                  exists: true,
                  data: () => ({
                    status: "complete",
                    currentStage: 6,
                  }),
                }),
              ),
            })),
          };
        }
        return {};
      }),
    };

    const mockVerifyRequest = vi.fn(() =>
      Promise.resolve({
        user: { uid: "user-123", email: "user@example.com" } as any,
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/user/nominations", {
      headers: { authorization: "Bearer fake-token" },
    });

    const response = await handleGetUserNominations(request, {
      verifyRequest: mockVerifyRequest,
      database: mockDb as any,
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.nominations).toHaveLength(1);
    expect(json.data.nominations[0].projectTitle).toBe("Test Project");
    expect(json.data.nominations[0].status).toBe("published");
  });

  it("updates nomination context on PATCH", async () => {
    const mockDoc = {
      exists: true,
      data: () => ({
        nominatorUid: "user-123",
        status: "accepted",
      }),
    };

    const mockUpdate = vi.fn(() => Promise.resolve());
    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(mockDoc)),
          update: mockUpdate,
        })),
      })),
    };

    const mockVerifyRequest = vi.fn(() =>
      Promise.resolve({
        user: { uid: "user-123" } as any,
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/user/nominations/nom-1", {
      method: "PATCH",
      headers: {
        authorization: "Bearer fake-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        whyItShouldGrow: "Updated thesis with sufficient length.",
        suggestedFormat: "Feature Film",
      }),
    });

    const response = await handlePatchNomination(request, "nom-1", {
      verifyRequest: mockVerifyRequest,
      database: mockDb as any,
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("withdraws nomination on DELETE", async () => {
    const mockDoc = {
      exists: true,
      data: () => ({
        nominatorUid: "user-123",
        status: "accepted",
      }),
    };

    const mockUpdate = vi.fn(() => Promise.resolve());
    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(mockDoc)),
          update: mockUpdate,
        })),
      })),
    };

    const mockVerifyRequest = vi.fn(() =>
      Promise.resolve({
        user: { uid: "user-123" } as any,
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/user/nominations/nom-1", {
      method: "DELETE",
      headers: { authorization: "Bearer fake-token" },
    });

    const response = await handleDeleteNomination(request, "nom-1", {
      verifyRequest: mockVerifyRequest,
      database: mockDb as any,
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "withdrawn" }),
    );
  });
});
