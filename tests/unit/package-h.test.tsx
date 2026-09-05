import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { dataRepo } from "@/services/firestore-repo";
import { loadPublishedScoutCard } from "@/features/scout-card/data";
import { ProfessionalBriefView } from "@/features/scout-card/professional-brief-view";
import { createFallbackTranscript } from "@/services/scout-brief/gemini-script-generator";
import { validateScoutBriefTranscript } from "@/services/scout-brief/script-builder";
import { analyzeTrailerVideo } from "@/critic/trailer-critic-engine";
import { analyzeAudienceComments } from "@/critic/audience-comment-analyzer";
import * as genaiClient from "@/lib/google/genai-client";
import type { ScoutCard } from "@/features/scout-card/types";

describe("Package H: Release Gate Verification (EI-1, EI-2, EI-3, EI-4)", () => {
  describe("Gate EI-3: Junichiro Jackson Evidence & Chicago Setting Reconciliation", () => {
    it("resolves proj-junichiro via slug lookup and validates unified Chicago evidence ledger", async () => {
      const project = await dataRepo.getProjectById("junichiro-jackson");
      expect(project).toBeDefined();
      expect(project?.id).toBe("proj-junichiro");
      expect(project?.identity.title).toBe("Junichiro Jackson");

      // Verify the logline and hook are grounded in Chicago, not Brooklyn
      expect(project?.identity.logline).toContain("Chicago");
      expect(project?.identity.logline).not.toContain("Brooklyn");

      // Verify published scout card evidence ledger
      const card = await dataRepo.getScoutCardById("card-junichiro-v1");
      expect(card).toBeDefined();
      expect(card?.whatWeKnow.join(" ")).toContain("Chicago hip-hop culture");
      expect(card?.whatWeKnow.join(" ")).not.toContain("Brooklyn");

      // Verify supporting sources
      const evidence = card?.evidenceLedger || [];
      expect(evidence.length).toBeGreaterThanOrEqual(2);
      const variety = evidence.find((e: any) => e.publisher === "Variety");
      expect(variety).toBeDefined();
      expect(variety.excerpt).toContain("futuristic Chicago");
      expect(variety.excerpt).not.toContain("Brooklyn");
    });

    it("dynamically renders verified partners and financing in Stage & Availability Audit", () => {
      const mockCardWithEvidence: ScoutCard = {
        cardVersionId: "card-jj-audit-01",
        projectId: "proj-junichiro",
        runId: "run-01",
        researchVersion: 1,
        title: "Junichiro Jackson",
        slug: "junichiro-jackson",
        claimStatus: "unclaimed",
        publishedAt: "2026-08-28T10:00:00Z",
        submissionLabel: "Fan nomination",
        completeness: "complete",
        hook: "A kinetic hip-hop anime pilot set in futuristic Chicago.",
        projectType: "series",
        fallbackUsed: false,
        provenance: {
          submissionType: "fan",
          submittedSourceUrl: "https://teamto.com/projects/junichiro-jackson",
          nominationLabel: "Fan nomination",
          nominatedByLabel: "Community Scout",
          researchedAt: "2026-08-28T10:00:00Z",
        },
        media: {
          state: "authorized_embed",
          title: "TeamTO Proof of Concept",
          sourceUrl: "https://www.youtube.com/watch?v=s8G7425lfKs",
          embedUrl: "https://www.youtube.com/embed/s8G7425lfKs",
          attribution: "TeamTO & Chaz Bottoms",
          accessibleFallback: "Animation teaser",
        },
        storyContext: {
          summary: "An easygoing courier must clear his name in futuristic Chicago.",
          storyworld: "Futuristic Chicago with hip-hop soundtrack.",
          themes: ["action", "hip-hop", "anime"],
          currentFormat: "Adult Animated Action Proof-of-Concept",
          audienceHooks: ["hip-hop", "anime"],
          claimIds: ["claim-1", "claim-2"],
        },
        creatorContext: {
          displayName: "Chaz Bottoms",
          claimStatus: "unclaimed",
          summary: "Director of Junichiro Jackson",
          sourceIds: ["source-1"],
          limitations: ["Unclaimed profile"],
        },
        sourceIds: ["source-1", "source-2"],
        claimIds: ["claim-1", "claim-2"],
        evidenceClaims: [
          {
            id: "claim-1",
            statement: "Director Chaz Bottoms partnered with TeamTO animation studio on the pilot.",
            status: "supported",
            sourceIds: ["source-1"],
            qualification: null,
          },
          {
            id: "claim-2",
            statement: "Raised over 1,200 fan backers on Kickstarter for the manga companion.",
            status: "supported",
            sourceIds: ["source-2"],
            qualification: null,
          },
        ],
        sourceLedger: [
          {
            id: "source-1",
            origin: "parallel",
            title: "Variety: Chaz Bottoms Teams with TeamTO",
            url: "https://variety.com/2026/film/news/junichiro-jackson-animated-spotlight",
            publishedAt: "2026-08-28",
            retrievedAt: "2026-08-28",
            availability: "available",
            verificationStatus: "verified",
            sourceRole: "trade_reporting",
            sourceTier: "reputable_trade",
            supportsClaimIds: ["claim-1"],
          },
          {
            id: "source-2",
            origin: "parallel",
            title: "Junichiro Jackson Manga Universe Campaign",
            url: "https://kickstarter.com/projects/chazbottoms/junichiro-jackson-vol1",
            publishedAt: "2026-08-28",
            retrievedAt: "2026-08-28",
            availability: "available",
            verificationStatus: "verified",
            sourceRole: "primary_work",
            sourceTier: "primary",
            supportsClaimIds: ["claim-2"],
          },
        ],
        pathwayIds: ["pw-1", "pw-2", "pw-3"],
        pathways: [
          {
            id: "pw-1",
            order: 1,
            label: "Premium Adult Animated Series",
            format: "10-episode animated series",
            audience: "Anime & Hip-Hop fans",
            rationale: "Episodic rhythm supports a full season",
            supportingClaimIds: ["claim-1"],
            comparableSourceIds: [],
            strengths: ["Unique craft"],
            risks: ["High budget scale"],
            openQuestions: ["Network exclusivity"],
            confidence: "high",
            nextExperiment: {
              title: "Animatic Table Read",
              hypothesis: "Live read validates comedic timing",
              method: "Community stream",
              participantAction: "Vote",
              signal: "80% consensus",
              timebox: "2 weeks",
            },
          },
          {
            id: "pw-2",
            order: 2,
            label: "Feature Film",
            format: "Theatrical",
            audience: "Cinephiles",
            rationale: "Festival prestige",
            supportingClaimIds: [],
            comparableSourceIds: [],
            strengths: ["Contained arc"],
            risks: ["Timeline"],
            openQuestions: ["Financing"],
            confidence: "medium",
            nextExperiment: {
              title: "MIFA Pitch",
              hypothesis: "Buyers will co-produce",
              method: "Pitch",
              participantAction: "Attend",
              signal: "2 inquiries",
              timebox: "4 weeks",
            },
          },
          {
            id: "pw-3",
            order: 3,
            label: "Creator Direct Manga",
            format: "Print",
            audience: "Manga readers",
            rationale: "Direct audience",
            supportingClaimIds: ["claim-2"],
            comparableSourceIds: [],
            strengths: ["Independence"],
            risks: ["Fulfillment"],
            openQuestions: ["Scale"],
            confidence: "high",
            nextExperiment: {
              title: "Volume 2 pre-order",
              hypothesis: "Backers will return",
              method: "Crowdfunder",
              participantAction: "Back",
              signal: "$50k",
              timebox: "2 weeks",
            },
          },
        ],
        missingSections: [],
        limitations: ["Based on public reporting and submitted media."],
        externalSignals: [],
        identity: {
          relationshipStatus: "source_aligned",
        },
      };

      const sourceLabels = new Map([
        ["source-1", "[S1]"],
        ["source-2", "[S2]"],
      ]);

      render(
        <ProfessionalBriefView
          card={mockCardWithEvidence}
          sourceLabels={sourceLabels}
          onOpenCitation={() => {}}
        />
      );

      const auditTable = screen.getByRole("table", { name: /Project stage and availability audit/i });
      // Attached Partners MUST NOT be Unknown; it must render the TeamTO claim!
      expect(within(auditTable).getByText(/Director Chaz Bottoms partnered with TeamTO animation studio on the pilot/i)).toBeInTheDocument();

      // Public Financing MUST NOT be Unknown; it must render the Kickstarter claim!
      expect(within(auditTable).getByText(/Raised over 1,200 fan backers on Kickstarter for the manga companion/i)).toBeInTheDocument();

      // Development stage reflects submitted format
      expect(within(auditTable).getByText("Adult Animated Action Proof-of-Concept")).toBeInTheDocument();
    });

    it("gates next diligence step when project identity is unresolved", () => {
      const mockUnresolvedCard: ScoutCard = {
        cardVersionId: "card-unresolved-01",
        projectId: "proj-unresolved",
        runId: "run-01",
        researchVersion: 1,
        title: "Unresolved Indie Mystery",
        slug: "unresolved-indie-mystery",
        claimStatus: "unclaimed",
        publishedAt: "2026-08-30T10:00:00Z",
        submissionLabel: "Fan nomination",
        completeness: "complete",
        hook: "A mysterious project submitted without creator contact.",
        projectType: "film",
        fallbackUsed: false,
        provenance: {
          submissionType: "fan",
          submittedSourceUrl: "https://youtube.com/watch?v=xyz",
          nominationLabel: "Fan nomination",
          nominatedByLabel: "Anonymous",
          researchedAt: "2026-08-30",
        },
        media: {
          state: "editorial_fallback",
          title: "Placeholder",
          sourceUrl: "https://youtube.com/watch?v=xyz",
          attribution: "Unknown",
          accessibleFallback: "No video",
        },
        storyContext: {
          summary: "Summary",
          storyworld: "World",
          themes: [],
          currentFormat: "Unknown",
          audienceHooks: [],
          claimIds: ["c-1"],
        },
        creatorContext: {
          displayName: null,
          claimStatus: "unclaimed",
          summary: "Unknown creator",
          sourceIds: [],
          limitations: ["Unverified creator"],
        },
        sourceIds: ["s-1"],
        claimIds: ["c-1"],
        evidenceClaims: [
          {
            id: "c-1",
            statement: "Unconfirmed public video upload.",
            status: "inference",
            sourceIds: [],
            qualification: "Unverified",
          },
        ],
        sourceLedger: [
          {
            id: "s-1",
            origin: "submitted",
            title: "Public Video",
            url: "https://youtube.com/watch?v=xyz",
            publishedAt: null,
            retrievedAt: "2026-08-30",
            availability: "available",
            verificationStatus: "observed",
            supportsClaimIds: [],
          },
        ],
        pathwayIds: ["pw-1", "pw-2", "pw-3"],
        pathways: [
          {
            id: "pw-1",
            order: 1,
            label: "Pathway 1",
            format: "Film",
            audience: "General",
            rationale: "Rationale",
            supportingClaimIds: ["c-1"],
            comparableSourceIds: [],
            strengths: ["Concept"],
            risks: ["No creator contact"],
            openQuestions: ["Who owns rights?"],
            confidence: "low",
            nextExperiment: {
              title: "Confirm creator identity",
              hypothesis: "Identify creator",
              method: "Outreach",
              participantAction: "Confirm",
              signal: "Response",
              timebox: "1 week",
            },
          },
          {
            id: "pw-2",
            order: 2,
            label: "Pathway 2",
            format: "Short",
            audience: "General",
            rationale: "Rationale",
            supportingClaimIds: [],
            comparableSourceIds: [],
            strengths: ["Concept"],
            risks: ["Rights"],
            openQuestions: ["Chain of custody"],
            confidence: "low",
            nextExperiment: {
              title: "Experiment",
              hypothesis: "H",
              method: "M",
              participantAction: "A",
              signal: "S",
              timebox: "1 week",
            },
          },
          {
            id: "pw-3",
            order: 3,
            label: "Pathway 3",
            format: "Digital",
            audience: "General",
            rationale: "Rationale",
            supportingClaimIds: [],
            comparableSourceIds: [],
            strengths: ["Concept"],
            risks: ["Rights clearance"],
            openQuestions: ["Chain of title"],
            confidence: "low",
            nextExperiment: {
              title: "Experiment",
              hypothesis: "H",
              method: "M",
              participantAction: "A",
              signal: "S",
              timebox: "1 week",
            },
          },
        ],
        missingSections: [],
        limitations: ["Unverified"],
        externalSignals: [],
        identity: {
          relationshipStatus: "unresolved",
        },
      };

      render(
        <ProfessionalBriefView
          card={mockUnresolvedCard}
          sourceLabels={new Map([["s-1", "[S1]"]])}
          onOpenCitation={() => {}}
        />
      );

      // Next diligence step MUST guide user to verify creator identity rather than acquiring
      expect(screen.getByText(/Verify creator identity and primary work provenance before initiating commercial discussions/i)).toBeInTheDocument();
    });
  });

  describe("Gate EI-1 & EI-4: No Fabricated Metrics or Artificial Critic Matrix", () => {
    it("returns zero score floors and honest unavailable matrix when video critic is disabled", async () => {
      vi.spyOn(genaiClient, "getGoogleGenAIClient").mockReturnValue(null);

      const critic = await analyzeTrailerVideo(
        "proj-junichiro",
        "https://www.youtube.com/watch?v=s8G7425lfKs"
      );

      expect(critic.criticMatrix.clarity).toBe(0);
      expect(critic.criticMatrix.toneConsistency).toBe(0);
      expect(critic.criticMatrix.visualOriginality).toBe(0);
      expect(critic.criticMatrix.narrativeTension).toBe(0);
      expect(critic.timestampedBeats).toHaveLength(0);
      expect(critic.craftAnalysis.cinematography).toBe("Unavailable");
      expect(critic.limitations).toContain("Video craft analysis could not be completed");
    });

    it("abstains from demographic and sentiment claims when comment sample is empty", async () => {
      const result = await analyzeAudienceComments([], "Junichiro Jackson", "Animation");
      expect(result.sampleSize).toBe(0);
      expect(result.sentimentScore).toBe(0);
      expect(result.organicVsBrigadedFlag).toBe("insufficient_sample");
      expect(result.characterAndLoreObsessions).toHaveLength(0);
      expect(result.merchandiseDemandSignals).toHaveLength(0);
    });
  });
});
