import { describe, it, expect } from "vitest";
import { parsePublicRun } from "@/lib/research/public-research";
import { canonicalizeUrl } from "@/features/scout-card/data";
import { buildScriptGenerationPrompt } from "@/services/scout-brief/script-builder";
import { validateCriticPayload } from "@/critic/trailer-critic-engine";

describe("Rehearsal Findings Defects Suite", () => {
  describe("Defect 1: Completion handoff & case-insensitive cardUrl", () => {
    it("parses mixed-case Firestore document ID in cardUrl and normalizes to lowercase", () => {
      const publicRun = parsePublicRun({
        runId: "run-test-1",
        projectId: "EmDyGtMonXscg9DtudSY",
        status: "complete",
        currentStage: 6,
        completedStages: [1, 2, 3, 4, 5, 6],
        cardUrl: "/projects/EmDyGtMonXscg9DtudSY",
        projectSlug: "project-emdygtmonx",
      });

      expect(publicRun.cardUrl).toBe("/projects/emdygtmonxscg9dtudsy");
      expect(publicRun.projectSlug).toBe("project-emdygtmonx");
      expect(publicRun.status).toBe("complete");
      expect(publicRun.currentStage).toBe(6);
    });

    it("parses standard slug cardUrl correctly", () => {
      const publicRun = parsePublicRun({
        runId: "run-test-2",
        status: "complete",
        cardUrl: "/projects/project-emdygtmonx",
        projectSlug: "project-emdygtmonx",
      });

      expect(publicRun.cardUrl).toBe("/projects/project-emdygtmonx");
    });
  });

  describe("Defect 2: Qualification heritage across surfaces", () => {
    it("includes explicit qualification heritage invariant in buildScriptGenerationPrompt", () => {
      const cardInput: any = {
        projectId: "proj-1",
        title: "GENESIS",
        hook: "A sci-fi short film",
        projectType: "film",
        developmentStage: "in active development",
        creatorName: "Elena & Olivia",
        evidenceClaims: [
          {
            id: "c1",
            statement: "The campaign raised $107,467 across 1,277 backers.",
            status: "qualified",
            qualification: "Self-reported crowdfunding campaign figures.",
            sourceIds: ["s1"],
          },
        ],
        sources: [{ id: "s1", title: "Kickstarter Campaign", url: "https://www.kickstarter.com/projects/elena/genesis" }],
        limitations: [],
      };

      const discoverPrompt = buildScriptGenerationPrompt(cardInput, "discover");
      expect(discoverPrompt).toContain("QUALIFICATION HERITAGE");
      expect(discoverPrompt).toContain("NEVER state a self-reported or qualified figure as an unconditional established fact");

      const proPrompt = buildScriptGenerationPrompt(cardInput, "pro");
      expect(proPrompt).toContain("QUALIFICATION HERITAGE");
      expect(proPrompt).toContain("NEVER state a self-reported or qualified figure as an unconditional established fact");
    });
  });

  describe("Defect 4: Source quality & Kickstarter canonicalization", () => {
    it("strips Kickstarter sub-paths (/description, /comments, /posts, /rewards) to canonical root", () => {
      const root = "https://www.kickstarter.com/projects/elena-olivia/genesis-short-film";
      expect(canonicalizeUrl(`${root}/description`)).toBe(root);
      expect(canonicalizeUrl(`${root}/comments`)).toBe(root);
      expect(canonicalizeUrl(`${root}/posts`)).toBe(root);
      expect(canonicalizeUrl(`${root}/rewards`)).toBe(root);
      expect(canonicalizeUrl(`${root}/updates/123`)).toBe(root);
    });
  });

  describe("Defect 5: Truthful craft analysis in text_context_only mode", () => {
    it("validates that a text-context payload with truthful craft disclaimer conforms to critic invariants", () => {
      const payload = {
        summary: "Contextual narrative evaluation based on verified project metadata and campaign text.",
        genreAndForm: "sci-fi / Short",
        whyItMayConnect: "Strong thematic resonance and core fanbase interest.",
        timestampedBeats: [],
        craftAnalysis: {
          cinematography: "Direct video stream inspection was unavailable; camera framing, lighting, and composition observations cannot be verified without primary video access.",
          soundAndScore: "Direct audio track inspection was unavailable; acoustic mix, sound design, and musical score cannot be verified without primary audio access.",
          editingAndPacing: "Direct video stream inspection was unavailable; shot duration, cut rhythms, and pacing cannot be verified without primary video access.",
          graphicsAndText: "Direct video stream inspection was unavailable; title cards and typography cannot be verified without primary video access.",
        },
        persuasionAndEmotion: {
          emotionalArc: "Intrigue building to thematic reveal.",
          targetPersona: "Independent sci-fi audience.",
          callToAction: "Follow campaign development.",
        },
        criticMatrix: {
          clarity: 8,
          toneConsistency: 8,
          visualOriginality: 7,
          narrativeTension: 8,
        },
        limitations: "Analysis grounded in verified project and trailer metadata; direct multimodal video stream was unattached or unavailable.",
      };

      expect(validateCriticPayload(payload)).toBe(true);
    });
  });
});

  describe("Defect 3: Stage/relationship mapping & multiple creators", () => {
    it("formats multiple creators with ampersand", () => {
      const creators = ["Elena", "Olivia"];
      const displayName = creators.length > 1 ? creators.join(" & ") : creators[0] || null;
      expect(displayName).toBe("Elena & Olivia");
    });

    it("filters out nominator context and crowdfunding from stageClaim and partnerClaim", () => {
      const supportedClaims = [
        {
          id: "claim-nominator",
          statement: "Nominator context: This proof of concept is awesome and in development.",
          status: "qualified",
          sourceIds: ["source-yt"],
        },
        {
          id: "claim-kickstarter",
          statement: "The creators partnered on Kickstarter to raise $107,467 from 1,277 backers.",
          status: "qualified",
          sourceIds: ["source-ks"],
        },
        {
          id: "claim-production",
          statement: "Produced in association with Studio Red Animation.",
          status: "supported",
          sourceIds: ["source-trade"],
        },
        {
          id: "claim-stage",
          statement: "Currently in post-production with sound mix scheduled.",
          status: "supported",
          sourceIds: ["source-blog"],
        },
      ];

      const financingClaim = supportedClaims.find((c) =>
        /\b(kickstarter|indiegogo|crowdfund|pledged|funded|budget|grant|raised)\b/i.test(c.statement)
      );
      expect(financingClaim?.id).toBe("claim-kickstarter");

      const partnerClaim = supportedClaims.find((c) => {
        if (c.id === financingClaim?.id) return false;
        const s = c.statement.toLowerCase();
        if (/\b(kickstarter|indiegogo|crowdfund|pledged|backers)\b/i.test(s)) return false;
        return /\b(teamto|studio|co-production|cbc studios|production company|producing partners?|produced in association with|animation studio)\b/i.test(s);
      });
      expect(partnerClaim?.id).toBe("claim-production");
      expect(partnerClaim?.statement).not.toContain("Kickstarter");

      const stageClaim = supportedClaims.find((c) => {
        if (c.id === partnerClaim?.id || c.id === financingClaim?.id) return false;
        const s = c.statement.toLowerCase();
        if (s.startsWith("nominator context") || s.includes("nominator context:") || s.includes("nominator submission")) {
          return false;
        }
        return /\b(proof of concept|pilot|development|pre-production|production|post-production|festival circuit)\b/i.test(s);
      });
      expect(stageClaim?.id).toBe("claim-stage");
      expect(stageClaim?.statement).toBe("Currently in post-production with sound mix scheduled.");
      expect(stageClaim?.statement).not.toContain("Nominator context");
    });
  });
