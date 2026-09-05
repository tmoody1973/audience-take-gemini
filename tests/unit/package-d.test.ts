import { describe, it, expect, vi } from "vitest";
import { validateScoutProposal, checkHypeAndHallucinations, checkMediumConcordance } from "@/agent/deterministic-validator";
import { dataRepo } from "@/services/firestore-repo";
import { executeScoutResearchRun } from "@/agent/agent-runner";
import { parallelClient } from "@/services/parallel-client";
import type { Project, ResearchRunState, MediumType, PathwayHypothesis } from "@/domain";

describe("Package D: Decision-Focused Research & Bounded Execution", () => {
  it("deterministic validator preserves decisionBrief triage fields and pathway prerequisites/owner/blockers", () => {
    const rawProposal = {
      projectTitle: "The Last Station Proof of Concept",
      medium: "proof_of_concept",
      stage: "production",
      creators: ["Elena Rostova"],
      whatWeKnow: [
        "Elena Rostova is the director and principal creator.",
        "The project is a 12-minute sci-fi proof of concept set in an abandoned polar weather outpost.",
        "Original footage and lookbook completed in early 2026.",
      ],
      whatWereChecking: [
        "Whether underlying feature script rights are fully optioned.",
        "Whether festival premiere applications for Tribeca and Fantasia have been submitted.",
      ],
      whyScouted: "Visually arresting hard sci-fi proof of concept with strong atmospheric tension.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          verified: true,
          caption: "Official Proof of Concept Teaser",
        },
      ],
      evidenceLedger: [
        {
          id: "ev-1",
          sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "The Last Station Proof of Concept",
          publisher: "Elena Rostova",
          claimType: "observation",
          excerpt: "Elena Rostova directed this 12-minute sci-fi proof of concept in an abandoned polar weather outpost.",
          verified: true,
        },
      ],
      pathways: [
        {
          title: "Boutique Sci-Fi Feature Expansion",
          mediumFitRationale: "Atmospheric claustrophobia lends itself directly to a contained 90-minute thriller.",
          targetAudience: "Fans of Ex Machina, The Thing, and cerebral speculative fiction.",
          risksAndUncertainties: ["Securing lead cast to anchor financing packages."],
          nextBoundedExperiment: {
            name: "Director's Lookbook Pitch Packaging",
            description: "Assemble a 10-page treatment and pitch 3 boutique genre producers.",
            successMetric: "Secure option interest or shopping agreement.",
          },
          prerequisites: ["Locked feature-length script draft", "Chain-of-title verification"],
          owner: "Director Elena Rostova / Producer",
          blockers: ["Financing gap for principal photography"],
        },
        {
          title: "Curated Genre Festival Circuit Strategy",
          mediumFitRationale: "Short-form proof is primed for genre festival programming windows.",
          targetAudience: "Genre festival programmers and specialty genre distributors.",
          risksAndUncertainties: ["High festival competition and premiere exclusivity requirements."],
          nextBoundedExperiment: {
            name: "Festival Screener Submissions",
            description: "Submit to Sitges, Fantasia, and Fantastic Fest.",
            successMetric: "At least one official selection laurel.",
          },
          prerequisites: ["Final sound mix and color master"],
          owner: "Festival Publicist / Director",
          blockers: ["Premiere status windowing"],
        },
        {
          title: "Not enough evidence to assess",
          mediumFitRationale: "Insufficient verified market data to support a viable third pathway hypothesis at this time.",
          targetAudience: "To be determined through further development diligence.",
          risksAndUncertainties: ["Platform discoverability and distribution lead times."],
          nextBoundedExperiment: {
            name: "Market Discovery Check",
            description: "Monitor for upcoming public attachments or festival announcements.",
            successMetric: "Identify verified partner or distributor attachment.",
          },
          prerequisites: ["Public confirmation of rights or partners"],
          owner: "Development Executive",
          blockers: ["Unverified commercial rights"],
        },
      ],
      decisionBrief: {
        logline: "In an abandoned polar outpost, an isolated researcher discovers an anomaly in atmospheric sensor data.",
        coreHook: "Tactile, practical-effects sci-fi tension with a singular female protagonist in hostile isolation.",
        comparativeTitles: ["The Thing", "Ex Machina", "Aniara"],
        primaryRisk: "Contained genre films require high-caliber lead performance to transcend festival novelty.",
        triageSummary: "High-craft proof of concept with strong visual execution; festival premiere unannounced and feature rights unencumbered.",
        materialUncertainty: "Underlying feature screenplay status and chain-of-title are unconfirmed in public records.",
        nextDiligenceStep: "Request feature script draft and lookbook from Elena Rostova to confirm chain-of-title.",
      },
      industryLens: {
        marketContext: "Elevated sci-fi thrillers produced under $5M continue to find buyers in specialty theatrical and SVOD windows.",
        comparables: ["The Vast of Night", "Coherence"],
        realisticConstraints: "Practical effects budget must be balanced with VFX finishing costs.",
      },
    };

    const result = validateScoutProposal(rawProposal);
    expect(result.valid).toBe(true);
    expect(result.sanitizedCard).toBeDefined();

    // Verify Decision Brief additions
    expect(result.sanitizedCard?.decisionBrief.triageSummary).toBe(
      "High-craft proof of concept with strong visual execution; festival premiere unannounced and feature rights unencumbered."
    );
    expect(result.sanitizedCard?.decisionBrief.materialUncertainty).toBe(
      "Underlying feature screenplay status and chain-of-title are unconfirmed in public records."
    );
    expect(result.sanitizedCard?.decisionBrief.nextDiligenceStep).toBe(
      "Request feature script draft and lookbook from Elena Rostova to confirm chain-of-title."
    );

    // Verify Pathway additions
    expect(result.sanitizedCard?.pathways[0].prerequisites).toEqual([
      "Locked feature-length script draft",
      "Chain-of-title verification",
    ]);
    expect(result.sanitizedCard?.pathways[0].owner).toBe("Director Elena Rostova / Producer");
    expect(result.sanitizedCard?.pathways[0].blockers).toEqual(["Financing gap for principal photography"]);

    // Verify "Not enough evidence to assess" slot
    expect(result.sanitizedCard?.pathways[2].title).toBe("Not enough evidence to assess");
    expect(result.sanitizedCard?.pathways[2].prerequisites).toEqual(["Public confirmation of rights or partners"]);
  });

  it("deterministic validator rejects forbidden hype, fake buyers, and greenlight scores", () => {
    const hypeProposal = "This film has a 95 Greenlight Score and Netflix is bidding on exclusive worldwide distribution rights.";
    const check = checkHypeAndHallucinations(hypeProposal);
    expect(check.clean).toBe(false);
    expect(check.matches.length).toBeGreaterThanOrEqual(1);
  });

  it("checks medium concordance correctly between medium and proposed pathways", () => {
    const docMedium: MediumType = "documentary";
    const pathways: [PathwayHypothesis, PathwayHypothesis, PathwayHypothesis] = [
      {
        title: "Animated Series Spinoff",
        mediumFitRationale: "Create an animated feature for kids.",
        targetAudience: "Children",
        risksAndUncertainties: ["High animation cost"],
        nextBoundedExperiment: { name: "Animatic", description: "Test animation", successMetric: "Good" },
      },
      {
        title: "Animated Feature",
        mediumFitRationale: "Produce full animated movie.",
        targetAudience: "Families",
        risksAndUncertainties: ["Budget"],
        nextBoundedExperiment: { name: "Test", description: "Test", successMetric: "Good" },
      },
      {
        title: "Video Game",
        mediumFitRationale: "Gaming adaptation.",
        targetAudience: "Gamers",
        risksAndUncertainties: ["Cost"],
        nextBoundedExperiment: { name: "Test", description: "Test", successMetric: "Good" },
      },
    ];

    const concordance = checkMediumConcordance(docMedium, pathways);
    expect(concordance.concordant).toBe(false);
    expect(concordance.error).toContain("Documentary project received pure animation pathways");
  });

  it("executes bounded research without exceeding budget limits (max 3 search requests, max 6 pages extracted)", async () => {
    const projectId = `proj-pkg-d-${Date.now()}`;
    const runId = `run-pkg-d-${Date.now()}`;
    const testUrl = "https://www.youtube.com/watch?v=s8G7425lfKs";

    let searchCount = 0;
    let extractPageCount = 0;

    const searchSpy = vi.spyOn(parallelClient, "search").mockImplementation(async (opts) => {
      searchCount += 1;
      return {
        search_id: `search-test-${searchCount}`,
        results: [
          {
            url: "https://deadline.com/article/junichiro-jackson-animated-short",
            title: "Junichiro Jackson Selected for Annecy Festival",
            publish_date: "2025-05-10",
            excerpts: [
              "Director Chaz Bottoms unveils Junichiro Jackson anime proof of concept in Chicago.",
              "Production completed independently with TeamTO co-producing the pilot teaser.",
            ],
          },
          {
            url: "https://variety.com/news/indie-animation-market-update",
            title: "Indie Animation Buyers Market Update",
            publish_date: "2025-06-15",
            excerpts: ["Specialty distributors seek unencumbered creator-driven animated IP."],
          },
        ],
      };
    });

    const extractSpy = vi.spyOn(parallelClient, "extract").mockImplementation(async (opts) => {
      extractPageCount += opts.urls.length;
      return {
        extract_id: `extract-test-${extractPageCount}`,
        results: opts.urls.map((u) => ({
          url: u,
          title: "Extracted Article Title",
          markdown: "# Extracted Article\nDetailed reporting on the independent proof of concept.",
          publish_date: "2025-05-10",
        })),
      };
    });

    try {
      const project: Project = {
        id: projectId,
        identity: {
          title: "Junichiro Jackson",
          normalizedUrl: testUrl,
          originalUrl: testUrl,
          medium: "proof_of_concept",
          currentStage: "concept",
          logline: "An atmospheric anime proof of concept set in neo-noir Chicago.",
          creators: ["Chaz Bottoms", "TeamTO"],
        },
        publishedCardId: null,
        nomination: {
          submittedByUid: "test-user-d",
          nominatorRole: "fan",
          reason: "Visionary afro-anime neo-noir proof of concept blending hip-hop and supernatural folklore.",
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
        nominatorUid: "test-user-d",
        sourceUrl: testUrl,
        currentStep: "fetching",
        progressPercent: 5,
        stepLogs: [],
      };
      await dataRepo.saveResearchRun(run);

      const completedRun = await executeScoutResearchRun(runId);
      expect(completedRun.currentStep).toBe("complete");

      // Verify limits
      expect(searchCount).toBeLessThanOrEqual(3);
      expect(extractPageCount).toBeLessThanOrEqual(6);

      // Verify published card has Decision Brief and Pathways populated
      if (completedRun.cardId) {
        const card = await dataRepo.getScoutCardById(completedRun.cardId);
        expect(card).toBeDefined();
        expect(card?.decisionBrief.triageSummary).toBeDefined();
        expect(card?.decisionBrief.materialUncertainty).toBeDefined();
        expect(card?.decisionBrief.nextDiligenceStep).toBeDefined();

        expect(card?.pathways[0].prerequisites).toBeDefined();
        expect(card?.pathways[0].owner).toBeDefined();
        expect(card?.pathways[0].blockers).toBeDefined();
      }
    } finally {
      searchSpy.mockRestore();
      extractSpy.mockRestore();

      try {
        const { getAdminFirestore } = await import("@/lib/firebase/admin");
        const db = getAdminFirestore() as any;
        if (db) {
          await db.collection("projects").doc(projectId).delete();
          await db.collection("researchRuns").doc(runId).delete();
        }
      } catch {}
    }
  }, 60000);
});
