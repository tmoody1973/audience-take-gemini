import { describe, expect, it } from "vitest";
import {
  checkCitationCoverage,
  checkHypeAndHallucinations,
  hasNegationContradiction,
  validateProposal,
} from "@/agent/deterministic-validator";
import type { EvidenceItem } from "@/domain";

describe("Package C2: Evidence and Publication Integrity", () => {
  const nominatorLead: EvidenceItem = {
    id: "ev-nominator",
    sourceUrl: "https://audiencetake.com/nominate",
    title: "Nominator Context",
    publisher: "User Submission",
    claimType: "reported",
    excerpt: 'Nominator context: "Netflix has acquired the project for a $10 million budget."',
    verified: false,
    isNominatorLead: true,
  };

  const unverifiedWebSource: EvidenceItem = {
    id: "ev-blog",
    sourceUrl: "https://unverified-fan-blog.example.com",
    title: "Fan Speculation Blog",
    publisher: "Fan Blog",
    claimType: "reported",
    excerpt: "Rumors suggest Netflix has acquired the project for a $10 million budget.",
    verified: false,
  };

  const verifiedDenialSource: EvidenceItem = {
    id: "ev-variety",
    sourceUrl: "https://variety.com/article",
    title: "Variety Trade Report",
    publisher: "Variety",
    claimType: "observation",
    excerpt: "Representatives confirmed Netflix has not acquired the project and is not in talks.",
    verified: true,
  };

  const verifiedPrimarySource: EvidenceItem = {
    id: "ev-primary",
    sourceUrl: "https://youtube.com/watch?v=12345",
    title: "Signal in the Pines Official Short",
    publisher: "Pine Grove Studios",
    claimType: "observation",
    excerpt: "Official short film release running 14 minutes, directed by Jane Doe.",
    verified: true,
  };

  describe("Acceptance Case 1: Nominator text separation", () => {
    it("nominator assertion of Netflix acquisition and $10M budget cannot ground whatWeKnow claims", () => {
      const claims = ["Netflix has acquired the project for a $10 million budget."];
      const coverage = checkCitationCoverage([nominatorLead], claims);

      expect(coverage.sufficientCoverage).toBe(false);
      expect(coverage.ungroundedClaims).toContain(claims[0]);
      expect(coverage.groundedClaims).toHaveLength(0);
    });
  });

  describe("Acceptance Case 2: Negation detection & Buyer Guard", () => {
    it("detects negation contradiction between affirmative claim and negating passage", () => {
      const claim = "Netflix has acquired the project.";
      const passage = "Representatives confirmed Netflix has not acquired the project.";
      expect(hasNegationContradiction(claim, passage)).toBe(true);
    });

    it("rejects affirmative acquisition claim when source explicitly denies acquisition", () => {
      const claims = ["Netflix has acquired the project."];
      const coverage = checkCitationCoverage([verifiedDenialSource], claims);

      expect(coverage.sufficientCoverage).toBe(false);
      expect(coverage.ungroundedClaims).toContain(claims[0]);
      expect(coverage.groundedClaims).toHaveLength(0);
    });

    it("buyer guard flags Netflix acquisition as unclean when only denied or unverified", () => {
      const text = "Netflix has acquired the project for a major series expansion.";
      const guardWithDenial = checkHypeAndHallucinations(text, [verifiedDenialSource]);
      expect(guardWithDenial.clean).toBe(false);
      expect(guardWithDenial.matches.length).toBeGreaterThan(0);

      const guardWithNominator = checkHypeAndHallucinations(text, [nominatorLead]);
      expect(guardWithNominator.clean).toBe(false);
    });
  });

  describe("Acceptance Case 3: Unverified text cannot promote verification state", () => {
    it("unverified text matching exactly does not promote claim to grounded", () => {
      const claims = ["Netflix has acquired the project for a $10 million budget."];
      const coverage = checkCitationCoverage([unverifiedWebSource], claims);

      expect(coverage.sufficientCoverage).toBe(false);
      expect(coverage.ungroundedClaims).toContain(claims[0]);
      expect(coverage.groundedClaims).toHaveLength(0);
    });
  });

  describe("Acceptance Case 4: Honest verification with genuine verified sources", () => {
    it("grounds genuine factual claims supported by verified sources without negation", () => {
      const claims = ["Official short film running 14 minutes directed by Jane Doe."];
      const coverage = checkCitationCoverage([verifiedPrimarySource], claims);

      expect(coverage.sufficientCoverage).toBe(true);
      expect(coverage.groundedClaims).toContain(claims[0]);
      expect(coverage.ungroundedClaims).toHaveLength(0);
    });
  });

  describe("Acceptance Case 5: Full-surface gating across triage, pathways, and script", () => {
    it("detects unsupported buyer claims in decisionBrief triageSummary", () => {
      const proposal = {
        projectTitle: "Signal in the Pines",
        medium: "short",
        stage: "concept",
        whyScouted: "Distinctive atmospheric short film showing high craft.",
        decisionBrief: {
          logline: "A lone ranger hears strange signals in the forest.",
          coreHook: "Analog audio transmissions repeating memories in a dense forest.",
          comparativeTitles: ["The Vast of Night"],
          primaryRisk: "Low commercial awareness without festival premiere.",
          triageSummary: "Project is in talks with Netflix for an acquisition.",
          materialUncertainty: "Rights chain of title unconfirmed.",
        },
        industryLens: {
          marketContext: "Short form sci-fi with elevated atmospheric pacing.",
          comparables: ["The Vast of Night"],
          realisticConstraints: "Requires festival proof-of-concept laurels.",
        },
        pathways: [
          {
            title: "Festival Circuit Strategy",
            mediumFitRationale: "Ideal for short film festivals and genre showcases.",
            targetAudience: "Indie sci-fi fans and festival programmers.",
            risksAndUncertainties: ["Acceptance rates at top tier festivals are low."],
            nextBoundedExperiment: {
              name: "Regional Festival Submission",
              description: "Submit to 5 genre festivals with early bird deadlines.",
              successMetric: "At least one competitive festival selection.",
            },
          },
        ],
        whatWeKnow: [
          "Official short film running 14 minutes.",
          "Directed by independent filmmaker Jane Doe.",
        ],
        whatWereChecking: ["Festival premiere status."],
        evidenceLedger: [verifiedPrimarySource],
      };

      const result = validateProposal(proposal);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("buyer") || e.includes("Netflix"))).toBe(true);
    });
  });
});
