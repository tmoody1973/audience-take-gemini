import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoutBriefPlayer } from "./scout-brief-player";
import type { ScoutBrief } from "./types";

const mockBrief: ScoutBrief = {
  artifactId: "scout-brief-card-test-g1",
  projectId: "proj-test",
  cardVersionId: "card-test",
  runId: "run-test",
  researchVersion: 1,
  generationVersion: 1,
  status: "ready",
  visibility: "public",
  language: "en-US",
  title: "Junichiro Jackson — Audio Scout Brief",
  durationMs: 180000,
  wordCount: 520,
  scriptModelId: "gemini-3.5-flash",
  ttsModelId: "gemini-3.1-flash-tts-preview",
  speakers: [
    { speaker: "Scout", voice: "Kore" },
    { speaker: "Analyst", voice: "Puck" },
  ],
  transcript: {
    segments: [
      { order: 1, section: "hook", speaker: "Scout", text: "Welcome to Audience Take audio briefing.", claimIds: [], sourceIds: ["S1"] },
      { order: 2, section: "project", speaker: "Analyst", text: "Looking at the project fundamentals.", claimIds: [], sourceIds: ["S1"] },
      { order: 3, section: "evidence", speaker: "Scout", text: "Fan comments demand full series.", claimIds: [], sourceIds: ["S2"] },
      { order: 4, section: "uncertainty", speaker: "Analyst", text: "Unit economics are 20k per minute.", claimIds: [], sourceIds: ["S2"] },
      { order: 5, section: "pathways", speaker: "Scout", text: "Three development pathways mapped.", claimIds: [], sourceIds: ["S1"] },
      { order: 6, section: "next_move", speaker: "Analyst", text: "Recommended next step is coproduction.", claimIds: [], sourceIds: ["S2"] },
    ],
    limitations: ["Animation tax credits pending"],
    disclosure: "AI-generated Scout Brief based on verified public evidence.",
  },
  sourceIds: ["S1", "S2"],
  claimIds: ["c1", "c2"],
  pathwayIds: ["p1", "p2", "p3"],
  storagePath: "public/projects/test/scout-briefs/g1.wav",
  audioUrl: "https://storage.googleapis.com/test-app-mkark4.appspot.com/test.wav",
  mimeType: "audio/wav",
  sizeBytes: 8640044,
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  generatedAt: "2026-08-29T12:00:00Z",
};

describe("ScoutBriefPlayer Component", () => {
  it("renders player controls, title, and metadata without autoplay", () => {
    render(<ScoutBriefPlayer brief={mockBrief} />);

    expect(screen.getByText("2-Speaker AI Scout Brief")).toBeDefined();
    expect(screen.getByText("Junichiro Jackson — Audio Scout Brief")).toBeDefined();
    expect(screen.getByLabelText("Play audio briefing")).toBeDefined();
    expect(screen.getByLabelText("Seek audio position")).toBeDefined();
    expect(screen.getByText("1×")).toBeDefined();
  });

  it("toggles expandable transcript with speaker labels and citations", () => {
    render(<ScoutBriefPlayer brief={mockBrief} />);

    const transcriptBtn = screen.getByRole("button", { name: /transcript/i });
    expect(screen.queryByText("Verified Dialogue Transcript")).toBeNull();

    fireEvent.click(transcriptBtn);

    expect(screen.getByText("Verified Dialogue Transcript")).toBeDefined();
    expect(screen.getByText("Welcome to Audience Take audio briefing.")).toBeDefined();
    expect(screen.getByText("Unit economics are 20k per minute.")).toBeDefined();
    expect(screen.getByText("Animation tax credits pending")).toBeDefined();
  });
});
