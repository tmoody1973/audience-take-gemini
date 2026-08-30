import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScoutingWallClient } from "./scouting-wall-client";
import type { ScoutingWallEntry } from "./data";

const sampleEntries: ScoutingWallEntry[] = [
  {
    accessionId: "card-doc-v1",
    projectId: "proj-doc",
    slug: "american-pachuco",
    title: "American Pachuco",
    hook: "The defiant journey of Luis Valdez.",
    projectType: "documentary",
    submissionLabel: "Curator nomination",
    claimStatus: "unclaimed",
    completeness: "complete",
    evidenceStatus: "verified_core",
    publishedAt: "2026-08-28T10:00:00.000Z",
    sourceCount: 8,
    pathwayLabels: ["Educational Licensing", "Public Media Broadcast"],
    audiencePulse: { follows: 24, wouldWatch: 18, wouldPay: 8, bringToCity: 5, backNextChapter: 12 },
    audienceHeatScore: 98,
    marketReadinessScore: 91,
    marketTier: "Category Breakout",
    buyerTargets: ["PBS / POV / American Masters", "HBO Documentary Films", "Criterion Channel"],
    creators: ["Luis Valdez", "David Alvarado"],
    channelTitle: "Insignia Films",
    channelHandle: "@InsigniaFilms"
  },
  {
    accessionId: "card-comedy-v1",
    projectId: "proj-comedy",
    slug: "fruity",
    title: "Fruity",
    hook: "A razor-sharp queer roommate comedy.",
    projectType: "creator_project",
    submissionLabel: "Fan nomination",
    claimStatus: "unclaimed",
    completeness: "complete",
    evidenceStatus: "verified_core",
    publishedAt: "2026-08-27T10:00:00.000Z",
    sourceCount: 6,
    pathwayLabels: ["Linear TV Half-Hour", "Audio Comedy Expansion"],
    audiencePulse: { follows: 38, wouldWatch: 32, wouldPay: 14, bringToCity: 9, backNextChapter: 20 },
    audienceHeatScore: 94,
    marketReadinessScore: 86,
    marketTier: "Category Breakout",
    buyerTargets: ["Channel 4 / BBC Three", "RTÉ Storyland", "Hulu / FX Comedy"],
    creators: ["Shannon & Megan Haly"],
    channelTitle: "Shannon & Megan Haly",
    channelHandle: "@fruityseries"
  }
];

describe("ScoutingWallClient Component", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders all cards, scores, buyer tags, and inline podcast players", () => {
    render(<ScoutingWallClient initialEntries={sampleEntries} />);

    expect(screen.getByText("American Pachuco")).toBeInTheDocument();
    expect(screen.getByText("Fruity")).toBeInTheDocument();
    expect(screen.getByText("98")).toBeInTheDocument();
    expect(screen.getByText("91")).toBeInTheDocument();
    expect(screen.getByText("PBS / POV / American Masters")).toBeInTheDocument();
    expect(screen.getAllByText(/2-Speaker Scout Brief/i)).toHaveLength(2);
  });

  it("filters scout cards dynamically by search text", () => {
    render(<ScoutingWallClient initialEntries={sampleEntries} />);

    const searchInput = screen.getByPlaceholderText(/Search by title, creator/i);
    fireEvent.change(searchInput, { target: { value: "Valdez" } });

    expect(screen.getByText("American Pachuco")).toBeInTheDocument();
    expect(screen.queryByText("Fruity")).not.toBeInTheDocument();
    expect(screen.getByText(/01 card/i)).toBeInTheDocument();
  });

  it("filters scout cards by persona preset", () => {
    render(<ScoutingWallClient initialEntries={sampleEntries} />);

    // Click "Grassroots Scouts" (Heat 90+)
    const scoutTab = screen.getByRole("tab", { name: /Grassroots Scouts/i });
    fireEvent.click(scoutTab);

    expect(scoutTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("American Pachuco")).toBeInTheDocument();
  });

  it("filters scout cards by target buyer dropdown", () => {
    render(<ScoutingWallClient initialEntries={sampleEntries} />);

    const buyerSelect = screen.getByLabelText(/Target Buyer/i);
    fireEvent.change(buyerSelect, { target: { value: "PBS" } });

    expect(screen.getByText("American Pachuco")).toBeInTheDocument();
    expect(screen.queryByText("Fruity")).not.toBeInTheDocument();
  });

  it("toggles inline podcast playback on card", () => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();

    render(<ScoutingWallClient initialEntries={sampleEntries} />);

    const playButtons = screen.getAllByRole("button", { name: /Play scout brief podcast/i });
    fireEvent.click(playButtons[0]);

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
});
