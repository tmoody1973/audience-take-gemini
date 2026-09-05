import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getScoutCardFixture } from "../../src/features/scout-card/data";
import { ScoutCard } from "../../src/features/scout-card/scout-card";
import { CitationDrawer } from "../../src/features/scout-card/citation-drawer";
import { AudienceActionStrip } from "../../src/features/scout-card/audience-action-strip";
import { PathwayVotingSection } from "../../src/features/scout-card/pathway-voting-section";
import { ProfessionalBriefView } from "../../src/features/scout-card/professional-brief-view";
import { createCitationLabels } from "../../src/features/scout-card/citation-labels";

afterEach(cleanup);

describe("Package E: Dual-Audience Scout Card UX & Hallmark Craft", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/");
    }
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe("Role-Based View Switching (Discover vs Professional Brief)", () => {
    it("defaults to Discover view and switches to Professional Brief upon tab selection", () => {
      render(<ScoutCard card={getScoutCardFixture("complete")} />);

      const discoverTab = screen.getByRole("tab", { name: /Discover/i });
      const proTab = screen.getByRole("tab", { name: /Professional Brief/i });

      // Default state: Discover is selected
      expect(discoverTab).toHaveAttribute("aria-selected", "true");
      expect(proTab).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("tabpanel", { name: /Discover/i })).toBeInTheDocument();
      expect(screen.queryByRole("tabpanel", { name: /Professional Brief/i })).not.toBeInTheDocument();

      // Click Professional Brief tab
      fireEvent.click(proTab);

      // Switched state: Pro Brief is selected
      expect(discoverTab).toHaveAttribute("aria-selected", "false");
      expect(proTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel", { name: /Professional Brief/i })).toBeInTheDocument();
      expect(screen.queryByRole("tabpanel", { name: /Discover/i })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Development Triage/i })).toBeInTheDocument();
    });

    it("supports keyboard navigation (ArrowRight and ArrowLeft) between view tabs", () => {
      render(<ScoutCard card={getScoutCardFixture("complete")} />);

      const discoverTab = screen.getByRole("tab", { name: /Discover/i });
      const proTab = screen.getByRole("tab", { name: /Professional Brief/i });

      discoverTab.focus();
      expect(document.activeElement).toBe(discoverTab);

      // Press ArrowRight to move to Professional Brief
      fireEvent.keyDown(discoverTab, { key: "ArrowRight" });
      expect(proTab).toHaveAttribute("aria-selected", "true");

      // Press ArrowLeft to return to Discover
      fireEvent.keyDown(proTab, { key: "ArrowLeft" });
      expect(discoverTab).toHaveAttribute("aria-selected", "true");
    });

    it("respects initialView='pro' prop when rendered directly", () => {
      render(<ScoutCard card={getScoutCardFixture("complete")} initialView="pro" />);

      const proTab = screen.getByRole("tab", { name: /Professional Brief/i });
      expect(proTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("heading", { name: /Development Triage/i })).toBeInTheDocument();
    });

    it("gracefully supports variable pathway counts (1 or 2 pathways) without requiring filler padding", () => {
      const singlePathwayCard = structuredClone(getScoutCardFixture("complete"));
      singlePathwayCard.pathways = [singlePathwayCard.pathways[0]];
      singlePathwayCard.pathwayIds = [singlePathwayCard.pathways[0].id];
      singlePathwayCard.industryLens.pathwayIds = [singlePathwayCard.pathways[0].id];

      // Should render without throwing "requires exactly three pathways"
      const { container } = render(<ScoutCard card={singlePathwayCard} />);
      expect(screen.getByRole("heading", { level: 1, name: /Junichiro Jackson/i })).toBeInTheDocument();
      expect(container.querySelectorAll(".pathway-decision-card")).toHaveLength(1);
    });
  });

  describe("Discover View: Fan Experience & Action Strip", () => {
    it("renders compact audience actions with functional follow and interest toggles", () => {
      const card = getScoutCardFixture("complete");
      render(<AudienceActionStrip card={card} />);

      // Initial truthful early-state note
      expect(screen.getByText(/No Audience Take interest signals yet/i)).toBeInTheDocument();

      // Follow toggle
      const followBtn = screen.getByRole("button", { name: /Follow/i });
      fireEvent.click(followBtn);
      expect(followBtn).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(/Following! Updates will appear in your Living Dossier in-app/i)).toBeInTheDocument();

      // Watch intent toggle ("I'd watch this")
      const wouldWatchBtn = screen.getByRole("button", { name: /I'd watch this/i });
      fireEvent.click(wouldWatchBtn);
      expect(wouldWatchBtn).toHaveAttribute("aria-pressed", "true");

      // Share card
      const shareBtn = screen.getByRole("button", { name: /Share/i });
      fireEvent.click(shareBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it("renders 'How would you like this story to grow?' pathway voting with non-binding disclaimer", () => {
      const card = getScoutCardFixture("complete");
      const onVoteMock = vi.fn();
      render(<PathwayVotingSection card={card} onVote={onVoteMock} />);

      expect(screen.getByRole("heading", { name: /What should happen next\?/i })).toBeInTheDocument();
      expect(screen.getByText(/Voting expresses community perspective; it does not direct the creator or guarantee production/i)).toBeInTheDocument();

      const voteButtons = screen.getAllByRole("button", { name: /Vote for pathway/i });
      expect(voteButtons).toHaveLength(3);

      fireEvent.click(voteButtons[0]);
      expect(onVoteMock).toHaveBeenCalledWith(card.pathways[0].id);
      expect(screen.getByRole("status")).toHaveTextContent(/You selected:/i);
    });
  });

  describe("Professional Brief View: Commercial Triage & Audit", () => {
    it("renders executive triage, structured status audit table, and copy brief action", async () => {
      const card = getScoutCardFixture("complete");
      const sourceLabels = createCitationLabels(card.sourceLedger);
      const onOpenCitation = vi.fn();

      render(
        <ProfessionalBriefView
          card={card}
          sourceLabels={sourceLabels}
          onOpenCitation={onOpenCitation}
        />
      );

      // Executive toolbar & disclaimer
      expect(screen.getByRole("heading", { name: card.title })).toBeInTheDocument();
      expect(screen.getByText(/Not an acquisition recommendation derived from an artificial score/i)).toBeInTheDocument();
      expect(screen.getByText(/1. WHY INVESTIGATE/i)).toBeInTheDocument();
      expect(screen.getByText(/2. MATERIAL UNCERTAINTY/i)).toBeInTheDocument();
      expect(screen.getByText(/3. NEXT DILIGENCE STEP/i)).toBeInTheDocument();

      // Structured status table
      expect(screen.getByRole("table", { name: /Project stage and availability audit/i })).toBeInTheDocument();
      expect(screen.getByRole("rowheader", { name: /Entity & Primary Work/i })).toBeInTheDocument();
      expect(screen.getByRole("rowheader", { name: /Development Stage/i })).toBeInTheDocument();
      expect(screen.getByRole("rowheader", { name: /Publicly Reported Financing/i })).toBeInTheDocument();
      expect(screen.getByRole("rowheader", { name: /Attached Production Partners/i })).toBeInTheDocument();
      expect(screen.getByRole("rowheader", { name: /Rights & Representation/i })).toBeInTheDocument();

      // Comparable pathways with non-binding notice
      expect(screen.getByText(/Pathway ranking does not imply commercial probability/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Comparable Pathways/i })).toBeInTheDocument();

      // Copy brief button
      const copyBtn = screen.getByRole("button", { name: /Copy professional brief/i });
      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(/Brief copied to clipboard!/i);
      });
    });
  });

  describe("Citation Drawer Interaction", () => {
    it("opens accessible drawer with excerpt, publisher metadata, and closes on Escape", () => {
      const card = getScoutCardFixture("complete");
      const sourceLabels = createCitationLabels(card.sourceLedger);
      const source = card.sourceLedger[0];
      source.excerpt = "An occult animated trailer featuring a supernatural underground Brooklyn.";
      const claim = card.evidenceClaims[0];
      const onClose = vi.fn();

      const { rerender } = render(
        <CitationDrawer
          isOpen={true}
          onClose={onClose}
          source={source}
          claim={claim}
          sourceLabels={sourceLabels}
        />
      );

      const dialog = screen.getByRole("dialog", { name: /Citation & Source Evidence/i });
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/An occult animated trailer featuring a supernatural underground Brooklyn/i)).toBeInTheDocument();
      expect(screen.getByText(source.title)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Open external source/i })).toHaveAttribute("href", source.url);

      // Close via Escape key
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();

      // Rerender closed
      rerender(
        <CitationDrawer
          isOpen={false}
          onClose={onClose}
          source={source}
          claim={claim}
          sourceLabels={sourceLabels}
        />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
