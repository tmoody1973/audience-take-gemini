import { describe, it, expect, vi } from "vitest";
import { ParallelSearchClient } from "@/services/parallel-client";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { dataRepo } from "@/services/firestore-repo";
import type { Project, ResearchRunState } from "@/domain";

describe("Scout Agent Reliability R1: Truthful Failure & No Fabricated Success", () => {
  it("distinguishes unconfigured API key from a successful empty search in ParallelSearchClient", async () => {
    const clientWithoutKey = new ParallelSearchClient("", "https://api.parallel.ai/v1");
    const res = await clientWithoutKey.search({
      objective: "Find distribution rights",
      search_queries: ["indie film festival"],
    });

    expect(res.providerStatus).toBe("skipped_no_key");
    expect(res.results).toHaveLength(0);
    expect(res.warnings?.[0]).toContain("PARALLEL_API_KEY not configured");
  });

  it("distinguishes provider HTTP failure from empty results in ParallelSearchClient", async () => {
    const client = new ParallelSearchClient("mock-api-key", "https://api.parallel.ai/v1");
    const originalFetch = global.fetch;
    global.fetch = vi.fn(async () => {
      return new Response("Unauthorized", { status: 401 });
    }) as any;

    try {
      const res = await client.search({
        objective: "Check production company",
        search_queries: ["indie film production"],
      });

      expect(res.providerStatus).toBe("failed");
      expect(res.errorDetails).toContain("HTTP 401");
      expect(res.results).toHaveLength(0);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("extracts excerpts properly from documented response format in ParallelExtractClient", async () => {
    const client = new ParallelSearchClient("mock-api-key", "https://api.parallel.ai/v1");
    const originalFetch = global.fetch;
    global.fetch = vi.fn(async (_url, options: any) => {
      const parsedBody = JSON.parse(options.body);
      // Verify documented request shape
      expect(parsedBody.urls).toEqual(["https://lionart.media/cycle/"]);
      expect(parsedBody.max_chars_total).toBeDefined();
      expect(parsedBody.advanced_settings?.excerpt_settings?.max_chars_per_result).toBeDefined();

      return new Response(
        JSON.stringify({
          extract_id: "extract_123",
          results: [
            {
              url: "https://lionart.media/cycle/",
              title: "Cycle Documented",
              excerpts: ["Exposed police brutality documentary.", "World premiere at Oriental Theater."],
              full_content: null,
            },
          ],
          session_id: "session_456",
        }),
        { status: 200 }
      );
    }) as any;

    try {
      const res = await client.extract({
        urls: ["https://lionart.media/cycle/"],
        objective: "Extract documentary subject",
        sessionId: "session_456",
      });

      expect(res.providerStatus).toBe("succeeded");
      expect(res.results[0].markdown).toContain("Exposed police brutality documentary.");
      expect(res.results[0].markdown).toContain("World premiere at Oriental Theater.");
      expect(res.session_id).toBe("session_456");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("fails truthfully and does NOT publish a synthetic Scout Card when Gemini client throws or is unavailable", async () => {
    const projectId = `proj-r1-test-${Date.now()}`;
    const runId = `run-r1-test-${Date.now()}`;
    const testUrl = "https://unreachable-source-domain-999.xyz/project";

    const project: Project = {
      id: projectId,
      identity: {
        title: "Unreachable Project",
        normalizedUrl: testUrl,
        originalUrl: testUrl,
        medium: "proof_of_concept",
        currentStage: "concept",
        logline: "Unreachable test project.",
        creators: [],
      },
      publishedCardId: null,
      nomination: {
        submittedByUid: "test-user-1",
        nominatorRole: "fan",
        reason: "Test nomination that cannot be reached or synthesized.",
        initialLinks: [testUrl],
        createdAt: new Date().toISOString(),
      },
      creatorClaim: { status: "unclaimed" },
      metrics: {
        watchCount: 0,
        payCount: 0,
        cityDemandCount: 0,
        backCount: 0,
        pathwayVotes: [0, 0, 0],
        cities: {},
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataRepo.createProject(project);

    const run: ResearchRunState = {
      id: runId,
      projectId: projectId,
      nominatorUid: "test-user-1",
      sourceUrl: testUrl,
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
      cardId: undefined,
    };

    await dataRepo.saveResearchRun(run);

    // Mock getGoogleGenAIClient to return null so Gemini is unavailable
    const genAiModule = await import("@/lib/google/genai-client");
    const spy = vi.spyOn(genAiModule, "getGoogleGenAIClient").mockReturnValue(null as any);

    try {
      const resultRun = await executeScoutResearchRun(runId);

      // Verify that failure is truthful!
      expect(resultRun.currentStep).toBe("failed");
      expect(resultRun.errorMessage).toContain("Research synthesis failed: Google Gemini AI client unavailable");
      expect(resultRun.cardId).toBeUndefined();

      // Verify no card was published for this project!
      const refreshedProj = await dataRepo.getProjectById(projectId);
      expect(refreshedProj?.publishedCardId).toBeNull();
    } finally {
      spy.mockRestore();

      // Clean up test records
      try {
        const { getAdminFirestore } = await import("@/lib/firebase/admin");
        const db = getAdminFirestore() as any;
        if (db) {
          await db.collection("projects").doc(projectId).delete();
          await db.collection("researchRuns").doc(runId).delete();
        }
      } catch {}
    }
  });
});
