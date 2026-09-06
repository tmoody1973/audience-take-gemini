import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ScoutCard } from "@/features/scout-card/scout-card";
import { getScoutCardFixture } from "@/features/scout-card/data";
import type { ScoutBrief } from "@/features/scout-brief/types";

const mockBrief: ScoutBrief = {
  artifactId: "scout-brief-test-top-g1",
  projectId: "proj-junichiro",
  cardVersionId: "card-junichiro-v1",
  runId: "run-test",
  researchVersion: 1,
  generationVersion: 1,
  status: "ready",
  visibility: "public",
  language: "en-US",
  title: "Junichiro Jackson — Audio Scout Brief",
  durationMs: 90000,
  wordCount: 220,
  scriptModelId: "gemini-3.5-flash",
  ttsModelId: "gemini-3.1-flash-tts-preview",
  speakers: [
    { speaker: "Scout", voice: "Kore" },
    { speaker: "Analyst", voice: "Puck" },
  ],
  transcript: {
    segments: [
      { order: 1, section: "hook", speaker: "Scout", text: "Welcome to the brief.", claimIds: [], sourceIds: [] },
    ],
    limitations: [],
    disclosure: "AI-generated Scout Brief.",
  },
  sourceIds: [],
  claimIds: [],
  pathwayIds: [],
  storagePath: "test.wav",
  audioUrl: "https://example.com/test.wav",
  mimeType: "audio/wav",
  sizeBytes: 1000,
  sha256: "abc",
  generatedAt: "2026-09-06T12:00:00Z",
};

describe("Scout Brief Top Placement", () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(async () => {});
  });

  it("renders ScoutBriefPlayer at the top of the Discover view dossier before the primary media grid", () => {
    const card = getScoutCardFixture("complete");
    const { container } = render(<ScoutCard card={card} scoutBrief={mockBrief} initialView="discover" />);

    const player = screen.getByLabelText("Audio Scout Briefing");
    expect(player).toBeInTheDocument();

    // Check that player appears before the primary grid
    const dossier = container.querySelector(".scout-dossier-redesign");
    const primaryGrid = container.querySelector(".scout-primary-grid");
    expect(dossier).toBeInTheDocument();
    expect(primaryGrid).toBeInTheDocument();

    // Verify ordering: player comes before primaryGrid in DOM order
    expect(player.compareDocumentPosition(primaryGrid!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders ScoutBriefPlayer at the top of the Professional view dossier before the triage section", () => {
    const card = getScoutCardFixture("complete");
    const { container } = render(<ScoutCard card={card} scoutBrief={mockBrief} initialView="pro" />);

    const player = screen.getByLabelText("Audio Scout Briefing");
    expect(player).toBeInTheDocument();

    const triageSection = container.querySelector(".pro-triage-section");
    expect(triageSection).toBeInTheDocument();

    // Verify ordering: player comes before pro triage section in DOM order
    expect(player.compareDocumentPosition(triageSection!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
