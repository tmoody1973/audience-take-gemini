import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInitialQuestionLedger,
  assessQuestionLedger,
  planNextResearchStep,
  ResearchBudget,
} from "@/agent/question-ledger";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { dataRepo } from "@/services/firestore-repo";
import { parallelClient } from "@/services/parallel-client";
import { Project, ResearchRun } from "@/domain";
import { validateScoutProposal } from "@/agent/deterministic-validator";

vi.mock("@/services/firestore-repo", () => {
  return {
    dataRepo: {
      getProjectById: vi.fn(),
      getResearchRunById: vi.fn(),
      saveResearchRun: vi.fn(),
      acquireResearchRunLease: vi.fn(),
      verifyResearchRunLease: vi.fn(),
      renewResearchRunLease: vi.fn().mockResolvedValue({ renewed: true }),
      atomicPublishScoutCard: vi.fn(),
      getProjectMonitorById: vi.fn(),
      saveProjectMonitor: vi.fn(),
    },
  };
});

vi.mock("@/services/parallel-client", () => {
  return {
    parallelClient: {
      search: vi.fn(),
      extract: vi.fn(),
      createMonitor: vi.fn(),
    },
  };
});

vi.mock("@/services/youtube-metadata", () => ({
  fetchYouTubeMetadata: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/critic/trailer-critic-engine", () => ({
  analyzeTrailerVideo: vi.fn().mockResolvedValue({
    id: "critic-test-1",
    timestampedBeats: [],
  }),
}));

vi.mock("@/lib/safe-fetch", () => ({
  fetchSafeWebContent: vi.fn().mockResolvedValue({
    text: "Sample project synopsis and creator notes.",
    contentType: "text/html",
  }),
}));

const mockGenerateContent = vi.fn();
vi.mock("@/lib/gemini", () => ({
  getGoogleGenAIClient: () => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }),
}));

describe("Package R7: Question Ledger & Budgeted Follow-ups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("R7.1: Targeted follow-up for unresolved rights occurs even when festival laurels/screenings exist", () => {
    const ledger = createInitialQuestionLedger("The Silent Shore", "https://example.com/film");
    
    // Passages contain festival laurels and premiere info, but no rights/deal report
    const passages = [
      {
        url: "https://festivals.com/awards",
        title: "Official Selection - The Silent Shore",
        text: "The Silent Shore won laurels and official selection at Austin Film Festival and screened to packed audiences.",
      },
      {
        url: "https://example.com/film",
        title: "The Silent Shore",
        text: "Directed by Jane Doe. A proof-of-concept short film exploring isolation in coastal towns.",
      },
    ];

    assessQuestionLedger(ledger, passages);

    // Festival distribution is supported
    expect(ledger.festival_distribution.status).toBe("supported");
    // Rights must remain strictly unknown!
    expect(ledger.rights.status).toBe("unknown");

    const budget: ResearchBudget = {
      maxSearches: 3,
      maxExtractions: 6,
      searchesUsed: 1,
      extractionsUsed: 2,
      attemptedUrls: ["https://example.com/film", "https://festivals.com/awards"],
    };

    const nextStep = planNextResearchStep(ledger, budget, "The Silent Shore");
    expect(nextStep.shouldSearch).toBe(true);
    expect(nextStep.targetQuestion).toBe("rights");
    expect(nextStep.queries?.[0]).toContain("distribution rights");
  });

  it("R7.2: Submitted supporting nomination URLs are included alongside primary video links", async () => {
    const mockProject: Project = {
      id: "proj-r7-links",
      identity: {
        title: "Supporting Links Film",
        normalizedUrl: "https://youtube.com/watch?v=sample123",
        medium: "short",
        currentStage: "festival_circuit",
        logline: "A compelling short.",
        creators: ["Alice Director"],
        originalUrl: "https://youtube.com/watch?v=sample123",
      },
      nomination: {
        reason: "Innovative sci-fi short with deck and press article.",
        formatNotes: "Short film",
        audienceNotes: "Growing views",
        submittedByUid: "user-nom-1",
        nominatorRole: "fan",
        createdAt: new Date().toISOString(),
        initialLinks: [
          "https://variety.com/2026/film/news/supporting-links-film-preview",
          "https://filmmakermagazine.com/features/supporting-links-interview",
        ],
      },
      creatorClaim: { status: "unclaimed" },
      metrics: { watchCount: 0, payCount: 0, cityDemandCount: 0, backCount: 0, pathwayVotes: [0, 0, 0], cities: {} },
      publishedCardId: null,
      publicationStatus: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockRun: ResearchRun = {
      id: "run-r7-links",
      projectId: "proj-r7-links",
      sourceUrl: "https://youtube.com/watch?v=sample123",
      nominatorUid: "user-nom-1",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
    };

    vi.mocked(dataRepo.getProjectById).mockResolvedValue(mockProject);
    vi.mocked(dataRepo.getResearchRunById).mockResolvedValue(mockRun);
    vi.mocked(dataRepo.acquireResearchRunLease).mockResolvedValue({
      acquired: true,
      leaseToken: "lease-r7-links",
      run: {
        ...mockRun,
        lease: {
          workerId: "w1",
          acquiredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          attempt: 1,
          leaseToken: "lease-r7-links",
        },
      },
    });
    vi.mocked(dataRepo.verifyResearchRunLease).mockResolvedValue({ valid: true });

    vi.mocked(parallelClient.search).mockResolvedValue({
      results: [
        {
          title: "Supporting Links Film - Press",
          url: "https://deadline.com/supporting-links-film",
          excerpts: ["Alice Director discusses the project."],
        },
      ],
      search_id: "search-r7-links",
      providerStatus: "succeeded",
      warnings: [],
    });

    vi.mocked(parallelClient.extract).mockResolvedValue({
      extract_id: "ext-r7-links",
      results: [
        {
          url: "https://variety.com/2026/film/news/supporting-links-film-preview",
          title: "Variety Feature",
          markdown: "Variety coverage of the short film and its creator Alice Director.",
        },
      ],
      providerStatus: "succeeded",
    });

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        projectTitle: "Supporting Links Film",
        medium: "short",
        stage: "festival_circuit",
        creators: ["Alice Director"],
        whatWeKnow: [
          "Supporting Links Film is an innovative short directed by Alice Director.",
          "Variety coverage highlights the short film and creator Alice Director.",
        ],
        whatWereChecking: ["Checking commercial distribution."],
        whyScouted: "Strong creative vision and press support.",
        sourceMedia: [],
        evidenceLedger: [],
        pathways: [
          {
            title: "Festival and Acquisition Pathway",
            mediumFitRationale: "Short film primed for premier circuit.",
            targetAudience: "Sci-fi festivalgoers",
            risksAndUncertainties: ["Distribution interest"],
            nextBoundedExperiment: {
              name: "Submit to festivals",
              description: "Target top 5 genre festivals.",
              successMetric: "2 festival acceptances",
            },
            prerequisites: ["Finished screener"],
            owner: "Alice Director",
            blockers: [],
          },
        ],
        decisionBrief: {
          logline: "A compelling short.",
          coreHook: "Sci-fi perspective.",
          comparativeTitles: ["Ex Machina"],
          primaryRisk: "Niche audience",
          triageSummary: "Promising sci-fi short on the festival circuit.",
          materialUncertainty: "Underlying rights and chain of title.",
          nextDiligenceStep: "Request pitch deck.",
        },
        industryLens: {
          marketContext: "Shorts market",
          comparables: ["District 9"],
          realisticConstraints: "Low budget",
        },
      }),
    });

    vi.mocked(dataRepo.atomicPublishScoutCard).mockImplementation(async (args: any) => ({
      publishedCard: args.card,
      project: args.project,
      run: { ...mockRun, currentStep: "complete" as any },
    }));

    await executeScoutResearchRun("run-r7-links");

    // Expect extract was called with candidate URLs that included the submitted supporting variety URL
    expect(parallelClient.extract).toHaveBeenCalled();
    const extractCalls = vi.mocked(parallelClient.extract).mock.calls;
    const requestedUrls = extractCalls.flatMap((c) => c[0].urls);
    expect(requestedUrls).toContain("https://variety.com/2026/film/news/supporting-links-film-preview");
  });

  it("R7.3: Official project root URLs are not rejected by candidate URL filtering", () => {
    const candidateUrls = [
      "https://officialfilmproject.com/",
      "https://anotherfilm.org",
      "https://www.youtube.com/watch?v=123",
      "https://vimeo.com/98765",
      "https://tiktok.com/@creator",
      "https://deadline.com/article/123",
    ];

    const filtered = candidateUrls.filter((u) => {
      try {
        const parsed = new URL(u);
        const h = parsed.hostname.toLowerCase();
        if (h.includes("youtube.com") || h.includes("youtu.be") || h.includes("vimeo.com") || h.includes("tiktok.com") || h.includes("x.com") || h.includes("twitter.com")) return false;
        return true;
      } catch {
        return false;
      }
    });

    // Both official domain roots must be preserved!
    expect(filtered).toContain("https://officialfilmproject.com/");
    expect(filtered).toContain("https://anotherfilm.org");
    expect(filtered).toContain("https://deadline.com/article/123");
    // Video and social aggregators must be filtered out
    expect(filtered).not.toContain("https://www.youtube.com/watch?v=123");
    expect(filtered).not.toContain("https://vimeo.com/98765");
    expect(filtered).not.toContain("https://tiktok.com/@creator");
  });

  it("R7.4: Research budget caps (max 3 searches, max 6 page extractions) are strictly respected", () => {
    const ledger = createInitialQuestionLedger("Exhausted Budget Project", "https://example.com");
    ledger.rights.status = "unknown";
    ledger.financing.status = "unknown";

    // Budget has used 3 searches
    const exhaustedSearchBudget: ResearchBudget = {
      maxSearches: 3,
      maxExtractions: 6,
      searchesUsed: 3,
      extractionsUsed: 2,
      attemptedUrls: [],
    };

    const plan = planNextResearchStep(ledger, exhaustedSearchBudget, "Exhausted Budget Project");
    expect(plan.shouldSearch).toBe(false);
  });

  it("R7.5: Unresolved rights mark decisionBrief.nextDiligenceStep with creator-controlled diligence", async () => {
    const mockProject: Project = {
      id: "proj-r7-diligence",
      identity: {
        title: "Unresolved Rights Indie",
        normalizedUrl: "https://example.com/concept",
        medium: "proof_of_concept",
        currentStage: "concept",
        logline: "An indie concept.",
        creators: ["Bob Creator"],
        originalUrl: "https://example.com/concept",
      },
      nomination: {
        reason: "Great pitch",
        formatNotes: "Proof of concept",
        submittedByUid: "user-1",
        nominatorRole: "fan",
        initialLinks: [],
        createdAt: new Date().toISOString(),
      },
      creatorClaim: { status: "unclaimed" },
      metrics: { watchCount: 0, payCount: 0, cityDemandCount: 0, backCount: 0, pathwayVotes: [0, 0, 0], cities: {} },
      publishedCardId: null,
      publicationStatus: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockRun: ResearchRun = {
      id: "run-r7-diligence",
      projectId: "proj-r7-diligence",
      sourceUrl: "https://example.com/concept",
      nominatorUid: "user-1",
      currentStep: "fetching",
      progressPercent: 10,
      stepLogs: [],
    };

    vi.mocked(dataRepo.getProjectById).mockResolvedValue(mockProject);
    vi.mocked(dataRepo.getResearchRunById).mockResolvedValue(mockRun);
    vi.mocked(dataRepo.acquireResearchRunLease).mockResolvedValue({
      acquired: true,
      leaseToken: "lease-r7-diligence",
      run: {
        ...mockRun,
        lease: {
          workerId: "w1",
          acquiredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          attempt: 1,
          leaseToken: "lease-r7-diligence",
        },
      },
    });
    vi.mocked(dataRepo.verifyResearchRunLease).mockResolvedValue({ valid: true });

    vi.mocked(parallelClient.search).mockResolvedValue({
      results: [
        {
          title: "Unresolved Rights Indie Festival Laurels",
          url: "https://filmfest.com/selection",
          excerpts: ["Screened at local indie fest according to festival notes."],
        },
        {
          title: "Unresolved Rights Indie Announcement",
          url: "https://indiefilmnews.com/article",
          excerpts: ["Unresolved Rights Indie is a proof of concept by Bob Creator."],
        },
      ],
      search_id: "search-diligence",
      providerStatus: "succeeded",
    });

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        projectTitle: "Unresolved Rights Indie",
        medium: "proof_of_concept",
        stage: "concept",
        creators: ["Bob Creator"],
        whatWeKnow: [
          "Unresolved Rights Indie is a proof of concept by Bob Creator.",
          "Screened at local indie fest according to festival notes.",
        ],
        whatWereChecking: ["Underlying option agreement."],
        whyScouted: "Compelling world.",
        sourceMedia: [],
        evidenceLedger: [],
        pathways: [
          {
            title: "Development Lab Pathway",
            mediumFitRationale: "Concept ready for labs.",
            targetAudience: "Indie development labs",
            risksAndUncertainties: ["Chain of title"],
            nextBoundedExperiment: {
              name: "Apply to lab",
              description: "Submit to Sundance lab.",
              successMetric: "Lab acceptance",
            },
            prerequisites: ["Treatment"],
            owner: "Bob Creator",
            blockers: [],
          },
        ],
        decisionBrief: {
          logline: "An indie concept.",
          coreHook: "High concept hook.",
          comparativeTitles: ["Primer"],
          primaryRisk: "Rights unclear",
          triageSummary: "Early concept with festival screening but unconfirmed commercial rights.",
          materialUncertainty: "Underlying rights and chain of title.",
          nextDiligenceStep: "General review of market", // Vague diligence step from model
        },
        industryLens: {
          marketContext: "Indie sci-fi",
          comparables: ["Primer"],
          realisticConstraints: "Micro-budget",
        },
      }),
    });

    let publishedCard: any = null;
    vi.mocked(dataRepo.atomicPublishScoutCard).mockImplementation(async (args: any) => {
      publishedCard = args.card;
      return {
        publishedCard: args.card,
        project: args.project,
        run: { ...mockRun, currentStep: "complete" as any },
      };
    });

    await executeScoutResearchRun("run-r7-diligence");

    expect(publishedCard).toBeDefined();
    // Diligence step must be creator-controlled diligence because rights are unknown
    expect(publishedCard.decisionBrief.nextDiligenceStep).toMatch(/chain[- ]of[- ]title|option agreement|creator\/producer/i);
  });

  it("R7.6: Deterministic validator accepts 1 or 2 pathways without forcing an invented 3rd pathway", () => {
    const proposalWith2Pathways = {
      projectTitle: "Dual Pathway Project",
      medium: "short" as const,
      stage: "festival_circuit" as const,
      creators: ["Director One"],
      whatWeKnow: [
        "Dual Pathway Project is a festival short film.",
        "Screened at top festivals with confirmed citations.",
      ],
      whatWereChecking: ["Checking international festival premiere dates."],
      whyScouted: "Solid short film execution.",
      sourceMedia: [],
      evidenceLedger: [
        {
          id: "ev-1",
          sourceUrl: "https://example.com/source1",
          title: "Dual Pathway Project Review",
          publisher: "Film Review Daily",
          claimType: "observation" as const,
          excerpt: "Dual Pathway Project is a festival short film.",
          verified: true,
        },
        {
          id: "ev-2",
          sourceUrl: "https://fest.com/selection",
          title: "Festival Laurels",
          publisher: "Fest",
          claimType: "reported" as const,
          excerpt: "Screened at top festivals with confirmed citations.",
          verified: true,
        },
      ],
      pathways: [
        {
          title: "Festival Circuit Run",
          mediumFitRationale: "Optimized for festival awards.",
          targetAudience: "Shorts programmers",
          risksAndUncertainties: ["High submission competition"],
          nextBoundedExperiment: {
            name: "Apply to major qualifying festivals",
            description: "Submit to BAFTA/Academy qualifying festivals.",
            successMetric: "1 qualifying selection",
          },
          prerequisites: ["DCP master"],
          owner: "Director One",
          blockers: [],
        },
        {
          title: "Online Showcase Release",
          mediumFitRationale: "Short form digital release.",
          targetAudience: "Digital sci-fi fans",
          risksAndUncertainties: ["Monetization"],
          nextBoundedExperiment: {
            name: "Submit to Short of the Week",
            description: "Pitch for online premiere.",
            successMetric: "Feature selection",
          },
          prerequisites: ["Online screener"],
          owner: "Director One",
          blockers: [],
        },
      ],
      decisionBrief: {
        logline: "Dual Pathway Project follows an inventor.",
        coreHook: "Inventive premise.",
        comparativeTitles: ["La Jetée"],
        primaryRisk: "Short monetization limit",
        triageSummary: "Complete short film actively on the festival circuit.",
        materialUncertainty: "Feature adaptation rights.",
        nextDiligenceStep: "Request screener link and chain of title.",
      },
      industryLens: {
        marketContext: "Shorts ecosystem",
        comparables: ["La Jetée"],
        realisticConstraints: "Short film budget constraints.",
      },
    };

    const validation = validateScoutProposal(proposalWith2Pathways);
    expect(validation.valid).toBe(true);
    expect(validation.sanitizedCard?.pathways.length).toBe(2);
  });
});
