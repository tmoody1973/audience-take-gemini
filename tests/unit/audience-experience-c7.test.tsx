import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PathwayVotingSection } from "@/features/scout-card/pathway-voting-section";
import { ProfessionalBriefView } from "@/features/scout-card/professional-brief-view";
import { getScoutCardFixture } from "@/features/scout-card/data";
import {
  buildScriptGenerationPrompt,
  buildClosedWorldScriptInput,
} from "@/services/scout-brief/script-builder";
import {
  validateCriticPayload,
  analyzeAnyTrailerVideo,
} from "@/critic/trailer-critic-engine";

describe("Package C7: Purposeful Audience Experiences & Narration Integrity", () => {
  describe("Fan Experience & Honest Ambition Attribution", () => {
    it("displays honest undocumented notice when creator has not verified an ambition", () => {
      const card = {
        ...getScoutCardFixture("complete"),
        claimStatus: "unclaimed" as const,
        creatorContext: {
          ...getScoutCardFixture("complete").creatorContext,
          summary: "AI generated background on creator history",
        },
      };

      render(<PathwayVotingSection card={card} />);

      // Must not falsely assert the AI text is the creator's ambition
      expect(screen.getByText(/CREATOR'S DIRECT AMBITION/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Not yet documented by creator\. The options below represent independent community and scout hypotheses\./i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/AI generated background on creator history/i)).not.toBeInTheDocument();
    });

    it("displays creator verified statement when claimStatus is approved", () => {
      const card = {
        ...getScoutCardFixture("complete"),
        claimStatus: "approved" as const,
        creatorStatement: {
          authorName: "Chaz Bottoms",
          statementText: "Our target is a 10-episode half-hour animated series with international co-producers.",
          verifiedAt: "2026-09-01T00:00:00Z",
        },
      };

      render(<PathwayVotingSection card={card} />);

      expect(screen.getByText(/CREATOR'S VERIFIED STATEMENT/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Our target is a 10-episode half-hour animated series/i)
      ).toBeInTheDocument();
    });
  });

  describe("Professional Brief Experience & Scenario Separation", () => {
    it("leads with identity, stage, and distinct production scenarios", () => {
      const card = getScoutCardFixture("complete");
      render(<ProfessionalBriefView card={card} />);

      expect(screen.getByText(/DEVELOPMENT TRIAGE/i)).toBeInTheDocument();
      expect(screen.getByText(/Material Uncertainty/i)).toBeInTheDocument();
      expect(screen.getByText("3. NEXT DILIGENCE STEP")).toBeInTheDocument();

      // Confirms separate Production Scenarios section exists
      expect(screen.getByRole("heading", { name: "Production Scenarios" })).toBeInTheDocument();
    });
  });

  describe("Audio Script Prompt Invariants & Anti-Hype Constraints", () => {
    it("enforces rules against 'undeniable demand' and AI ambition conflation in both script prompts", () => {
      const card = getScoutCardFixture("complete");
      const discoverInput = buildClosedWorldScriptInput(card, "discover");
      const proInput = buildClosedWorldScriptInput(card, "pro");

      const discoverPrompt = buildScriptGenerationPrompt(discoverInput, "discover");
      const proPrompt = buildScriptGenerationPrompt(proInput, "pro");

      // Discover view prompt invariants
      expect(discoverPrompt).toContain('undeniable demand');
      expect(discoverPrompt).toContain('creator\'s stated ambition');

      // Professional view prompt invariants
      expect(proPrompt).toContain('undeniable demand');
      expect(proPrompt).toContain('creator\'s stated ambition');
    });
  });

  describe("Trailer Critic Runtime Validation & Failure Containment", () => {
    it("validates well-formed critic payloads", () => {
      const validPayload = {
        summary: "Kinetic animation with great foley.",
        genreAndForm: "Animated Short",
        whyItMayConnect: "Strong comedic timing.",
        timestampedBeats: [
          { timestampSeconds: 0, timestampFormatted: "0:00", label: "Intro", description: "City intro" },
          { timestampSeconds: 15, timestampFormatted: "0:15", label: "Action", description: "Chase scene" },
        ],
        craftAnalysis: {
          cinematography: "Dynamic 2D angles",
          soundAndScore: "Boom-bap score",
          editingAndPacing: "Fast rhythmic cuts",
          graphicsAndText: "Clean typography",
        },
        persuasionAndEmotion: {
          emotionalArc: "Excitement",
          targetPersona: "Anime fans",
          callToAction: "Watch series",
        },
        criticMatrix: {
          clarity: 9.0,
          toneConsistency: 8.5,
          visualOriginality: 9.5,
          narrativeTension: 8.0,
        },
        limitations: "Analyzed 90s sample",
      };

      expect(validateCriticPayload(validPayload)).toBe(true);
    });

    it("rejects out-of-order timestamps or negative timestamps", () => {
      const invalidBeats = {
        summary: "Valid summary",
        timestampedBeats: [
          { timestampSeconds: 30, timestampFormatted: "0:30", label: "Later", description: "desc" },
          { timestampSeconds: 10, timestampFormatted: "0:10", label: "Earlier", description: "desc" }, // out of order!
        ],
        criticMatrix: { clarity: 8, toneConsistency: 8, visualOriginality: 8, narrativeTension: 8 },
      };

      expect(validateCriticPayload(invalidBeats)).toBe(false);

      const negativeBeat = {
        summary: "Valid summary",
        timestampedBeats: [
          { timestampSeconds: -5, timestampFormatted: "-0:05", label: "Negative", description: "desc" },
        ],
        criticMatrix: { clarity: 8, toneConsistency: 8, visualOriginality: 8, narrativeTension: 8 },
      };

      expect(validateCriticPayload(negativeBeat)).toBe(false);
    });

    it("rejects scores outside 0-10 range", () => {
      const rogueScores = {
        summary: "Valid summary",
        timestampedBeats: [],
        criticMatrix: { clarity: 15, toneConsistency: 8, visualOriginality: 8, narrativeTension: 8 }, // 15 > 10!
      };

      expect(validateCriticPayload(rogueScores)).toBe(false);
    });

    it("falls back to truthful unavailable state when critic is unavailable or fails validation", async () => {
      const genai = await import("@/lib/google/genai-client");
      vi.spyOn(genai, "getGoogleGenAIClient").mockReturnValue(null);

      const critic = await analyzeAnyTrailerVideo("https://example.com/unreviewed.mp4", "Test Project", "short");

      expect(critic.summary).toContain("Video craft breakdown is currently unavailable");
      expect(critic.craftAnalysis.cinematography).toBe("Unavailable");
      expect(critic.criticMatrix.clarity).toBe(0);
      expect(critic.criticMatrix.toneConsistency).toBe(0);
      expect(critic.timestampedBeats).toHaveLength(0);
    });
  });
});
