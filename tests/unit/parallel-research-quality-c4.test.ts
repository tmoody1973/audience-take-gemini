import { describe, it, expect, vi, beforeEach } from "vitest";
import { ParallelSearchClient } from "@/services/parallel-client";
import {
  createInitialQuestionLedger,
  planNextResearchStep,
  ResearchBudget,
} from "@/agent/question-ledger";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { dataRepo } from "@/services/firestore-repo";
import { parallelClient } from "@/services/parallel-client";
import type { Project, ResearchRunState } from "@/domain";

describe("Package C4: Parallel Research Quality & Identity-First Resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("ParallelSearchClient Query Sanitization", () => {
    it("strips 'project under research' and 'investigating' placeholders from outgoing queries", async () => {
      let interceptedBody: any = null;
      const client = new ParallelSearchClient("mock-api-key");
      vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
        interceptedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            search_id: "s-clean-1",
            results: [],
            warnings: [],
          }),
          { status: 200 }
        );
      });

      await client.search({
        objective: "Research screen project",
        search_queries: [
          "Project under research development financing",
          "Investigating festival distribution",
        ],
      });

      expect(interceptedBody).toBeDefined();
      const queries: string[] = interceptedBody.search_queries;
      for (const q of queries) {
        expect(q.toLowerCase()).not.toContain("project under research");
        expect(q.toLowerCase()).not.toContain("investigating");
      }
      expect(queries).toContain("development financing");
      expect(queries).toContain("festival distribution");
    });

    it("does NOT artificially append 'film series' instruction junk when valid queries are provided", async () => {
      let interceptedBody: any = null;
      const client = new ParallelSearchClient("mock-api-key");
      vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
        interceptedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            search_id: "s-clean-2",
            results: [],
            warnings: [],
          }),
          { status: 200 }
        );
      });

      await client.search({
        objective: "Find public details for Vampair",
        search_queries: ["Vampair pilot official release"],
      });

      expect(interceptedBody).toBeDefined();
      const queries: string[] = interceptedBody.search_queries;
      expect(queries).toHaveLength(1);
      expect(queries[0]).toBe("Vampair pilot official release");
      expect(queries[0]).not.toContain("film series");
    });
  });

  describe("Question Ledger Sanitization", () => {
    it("planNextResearchStep never emits 'Project under research' into follow-up queries or objectives", () => {
      const ledger = createInitialQuestionLedger("Project under research", "https://example.com/project");
      const budget: ResearchBudget = {
        maxSearches: 3,
        searchesUsed: 1,
        maxExtractions: 6,
        extractionsUsed: 2,
        attemptedUrls: [],
      };

      const step = planNextResearchStep(ledger, budget, "Project under research");
      expect(step.shouldSearch).toBe(true);
      expect(step.objective?.toLowerCase()).not.toContain("project under research");
      for (const q of step.queries || []) {
        expect(q.toLowerCase()).not.toContain("project under research");
      }
    });

    it("incorporates confirmed clean title into follow-up queries", () => {
      const ledger = createInitialQuestionLedger("CYCLE", "https://example.com/cycle");
      const budget: ResearchBudget = {
        maxSearches: 3,
        searchesUsed: 1,
        maxExtractions: 6,
        extractionsUsed: 2,
        attemptedUrls: [],
      };

      const step = planNextResearchStep(ledger, budget, "CYCLE");
      expect(step.shouldSearch).toBe(true);
      expect(step.objective).toContain('"CYCLE"');
      expect(step.queries?.[0]).toContain('"CYCLE"');
    });
  });

  describe("Runner Identity-First Resolution", () => {
    it("resolves project title from YouTube video title when project title is 'Project under research'", async () => {
      const projectId = `proj-c4-yt-${Date.now()}`;
      const runId = `run-c4-yt-${Date.now()}`;

      const project: Project = {
        id: projectId,
        identity: {
          title: "Project under research", // Nominal placeholder
          normalizedUrl: "https://www.youtube.com/watch?v=mockYtVideo",
          originalUrl: "https://www.youtube.com/watch?v=mockYtVideo",
          medium: "short",
          currentStage: "concept",
        },
        publishedCardId: null,
        nomination: {
          submittedByUid: "u-1",
          nominatorRole: "fan",
          reason: "Incredible indie pilot teaser",
          initialLinks: ["https://www.youtube.com/watch?v=mockYtVideo"],
          createdAt: new Date().toISOString(),
        },
        creatorClaim: { status: "unclaimed" },
        metrics: {} as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dataRepo.createProject(project);

      const run: ResearchRunState = {
        id: runId,
        projectId,
        nominatorUid: "u-1",
        sourceUrl: "https://www.youtube.com/watch?v=mockYtVideo",
        currentStep: "fetching",
        progressPercent: 10,
        stepLogs: [],
      };
      await dataRepo.saveResearchRun(run);

      // Mock YouTube metadata returning clean title
      const ytModule = await import("@/lib/media/youtube");
      vi.spyOn(ytModule, "fetchYouTubeMetadata").mockResolvedValue({
        videoId: "mockYtVideo",
        title: "Horizonauts | Official Sci-Fi Teaser Trailer (2026)",
        authorName: "Future Vision Films",
        authorUrl: "https://youtube.com/@futurevisionfilms",
      });

      let outgoingSearchQueries: string[] = [];
      let outgoingObjective: string = "";
      vi.spyOn(parallelClient, "search").mockImplementation(async (opts) => {
        outgoingSearchQueries = opts.search_queries;
        outgoingObjective = opts.objective;
        return {
          search_id: "s-c4-1",
          results: [
            {
              url: "https://indiefilm.com/horizonauts-review",
              title: "Horizonauts Short Film Review",
              excerpts: ["Director wrapped Horizonauts sci-fi short."],
            },
          ],
          providerStatus: "succeeded",
          warnings: [],
        };
      });

      vi.spyOn(parallelClient, "extract").mockResolvedValue({
        extract_id: "e-c4-1",
        results: [
          {
            url: "https://indiefilm.com/horizonauts-review",
            title: "Horizonauts Short Film Review",
            markdown: "Horizonauts is a 15-minute sci-fi short produced by Future Vision Films.",
          },
        ],
        providerStatus: "succeeded",
      });

      const googleGenAIModule = await import("@/lib/google/genai-client");
      vi.spyOn(googleGenAIModule, "getGoogleGenAIClient").mockReturnValue({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              projectTitle: "Horizonauts",
              medium: "short",
              stage: "completed",
              creators: ["Future Vision Films"],
              whyScouted: "Visually ambitious indie sci-fi teaser.",
              whatWeKnow: ["Future Vision Films produced the 15-minute sci-fi short Horizonauts."],
              whatWereChecking: ["Distribution rights availability."],
              evidenceLedger: [
                {
                  id: "ev-c4-1",
                  sourceUrl: "https://indiefilm.com/horizonauts-review",
                  title: "Horizonauts Short Film Review",
                  publisher: "IndieFilm",
                  claimType: "reported",
                  excerpt: "Future Vision Films produced the 15-minute sci-fi short Horizonauts.",
                  verified: true,
                  retrievedAt: new Date().toISOString(),
                },
              ],
              pathways: [
                {
                  title: "Genre Festival Tour",
                  mediumFitRationale: "Festival fit",
                  targetAudience: "Sci-fi fans",
                  risksAndUncertainties: ["Festival submission fees"],
                  nextBoundedExperiment: {
                    name: "Submit to festivals",
                    description: "Target top 5 genre festivals.",
                    successMetric: "2 festival acceptances",
                  },
                },
              ],
              decisionBrief: {
                logline: "Logline",
                coreHook: "Hook",
                comparativeTitles: ["Ex Machina"],
                primaryRisk: "Risk",
                triageSummary: "Summary",
              },
              industryLens: {
                marketContext: "Context",
                comparables: ["Comp"],
                realisticConstraints: "Constraints",
              },
            }),
          }),
        },
      } as any);

      await executeScoutResearchRun(runId);

      // Verify ZERO placeholder terms in outgoing queries
      expect(outgoingSearchQueries.length).toBeGreaterThan(0);
      for (const q of outgoingSearchQueries) {
        expect(q.toLowerCase()).not.toContain("project under research");
        expect(q.toLowerCase()).not.toContain("investigating");
        expect(q).toContain("Horizonauts");
      }
      expect(outgoingObjective).toContain("Horizonauts");
      expect(outgoingObjective.toLowerCase()).not.toContain("project under research");
    });
  });
});
