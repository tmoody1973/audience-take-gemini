import { describe, expect, it } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ScoutCard } from "../../src/features/scout-card/scout-card";
import { ProfessionalBriefView } from "../../src/features/scout-card/professional-brief-view";
import { getScoutCardFixture } from "../../src/features/scout-card/data";
import { createCitationLabels } from "../../src/features/scout-card/citation-labels";

describe("Package B: External Observations & Status Integrity", () => {
  it("renders verified external observations in both Discover view and Professional Brief", () => {
    const baseCard = getScoutCardFixture("complete");
    const card = {
      ...baseCard,
      externalSignals: [
        {
          label: "Kickstarter Crowdfunding Campaign",
          analysis: "€225,000 pledged by 4,100 backers across 30 days (ended 2024-05).",
          sourceIds: ["source-1"],
          limitations: ["Pledges reflect campaign backing, not direct commercial ticket sales."],
          nativeAudienceCount: false as const,
        },
      ],
      externalSignalsStatus: "observations_available" as const,
    };

    const sourceLabels = createCitationLabels(card.sourceLedger);

    // Test Pro View
    const { rerender } = render(
      <ProfessionalBriefView card={card} sourceLabels={sourceLabels} />
    );
    expect(screen.getByText("Kickstarter Crowdfunding Campaign")).toBeInTheDocument();
    expect(screen.getByText(/€225,000 pledged by 4,100 backers/)).toBeInTheDocument();
    expect(screen.getByText(/External observation · Not a native platform count/)).toBeInTheDocument();

    // Test Discover View
    rerender(<ScoutCard card={card} />);
    expect(screen.getAllByText("Kickstarter Crowdfunding Campaign").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Not an Audience Take-native count/).length).toBeGreaterThanOrEqual(1);
  });

  it("distinguishes un-researched cards from verified empty results in Pro view", () => {
    const baseCard = getScoutCardFixture("complete");
    const sourceLabels = createCitationLabels(baseCard.sourceLedger);

    // 1. Not researched
    const unresearchedCard = {
      ...baseCard,
      externalSignals: [],
      externalSignalsStatus: "not_researched" as const,
    };
    const { rerender } = render(
      <ProfessionalBriefView card={unresearchedCard} sourceLabels={sourceLabels} />
    );
    expect(screen.getByText("No external commercial signals verified for this project.")).toBeInTheDocument();

    // 2. Researched with no supported observations
    const noObsCard = {
      ...baseCard,
      externalSignals: [],
      externalSignalsStatus: "no_supported_observations" as const,
    };
    rerender(<ProfessionalBriefView card={noObsCard} sourceLabels={sourceLabels} />);
    expect(screen.getByText("Research complete · No external signals met verification criteria.")).toBeInTheDocument();

    // 3. Research failed
    const failedCard = {
      ...baseCard,
      externalSignals: [],
      externalSignalsStatus: "research_failed" as const,
    };
    rerender(<ProfessionalBriefView card={failedCard} sourceLabels={sourceLabels} />);
    expect(screen.getByText("External commercial research could not be completed.")).toBeInTheDocument();
  });

  it("distinguishes un-researched cards from verified empty results in Discover view", () => {
    const baseCard = getScoutCardFixture("complete");

    // 1. Research complete with no supported observations
    const noObsCard = {
      ...baseCard,
      externalSignals: [],
      externalSignalsStatus: "no_supported_observations" as const,
    };
    render(<ScoutCard card={noObsCard} />);
    expect(
      screen.getByText("Independent research was conducted; no public commercial signals met verification thresholds.")
    ).toBeInTheDocument();
  });
});
