import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductionScenariosSection } from "@/features/production-scenarios/production-scenarios-section";
import type { ScoutCard } from "@/features/scout-card/types";

describe("ProductionScenariosSection UI Component", () => {
  const baseCard: ScoutCard = {
    cardVersionId: "card-test-v1",
    projectId: "proj-101",
    runId: "run-101",
    researchVersion: 1,
    title: "The Kinetic Runner",
    slug: "kinetic-runner",
    claimStatus: "unclaimed",
    publishedAt: "2026-08-28T10:00:00Z",
    submissionLabel: "Community Nom",
    completeness: "complete",
    hook: "A courier races across futuristic Neo-Chicago.",
    projectType: "series",
    fallbackUsed: false,
    provenance: {
      submissionType: "fan",
      submittedSourceUrl: "https://youtube.com/watch?v=123",
      nominationLabel: "Fan nomination",
      nominatedByLabel: "Scout",
      researchedAt: "2026-08-28",
    },
    media: {
      state: "authorized_embed",
      title: "Pilot Pitch",
      sourceUrl: "https://youtube.com/watch?v=123",
      attribution: "Team Runner",
      accessibleFallback: "Animation teaser",
    },
    storyContext: {
      summary: "A courier action series.",
      storyworld: "Neo-Chicago",
      themes: ["action", "anime"],
      currentFormat: "Adult Animated Series",
      audienceHooks: ["action"],
      claimIds: [],
    },
    creatorContext: {
      displayName: "Jane Director",
      claimStatus: "unclaimed",
      summary: "Director",
      sourceIds: [],
      limitations: [],
    },
    sourceIds: [],
    claimIds: ["c-crowdfund"],
    evidenceClaims: [
      {
        id: "c-crowdfund",
        statement: "Raised $42,000 on Kickstarter from 850 backers.",
        status: "supported",
        sourceIds: [],
        qualification: null,
      },
    ],
    sourceLedger: [],
    pathwayIds: [],
    pathways: [],
    decisionBrief: {
      whyInvestigate: "Strong animation proof of concept.",
      materialUncertainty: "Series budget scale unconfirmed.",
      nextDiligenceStep: "Table read with animation studio.",
    },
    missingSections: [],
    limitations: [],
    externalSignals: [],
  };

  it("renders compact collapsed header with reported budget state", () => {
    render(<ProductionScenariosSection card={baseCard} />);

    expect(screen.getByRole("heading", { name: /Production Scenarios/i })).toBeInTheDocument();
    expect(screen.getByText(/Reported Project Budget:/i)).toBeInTheDocument();
    // Does NOT claim Kickstarter pledge is the confirmed production budget
    expect(screen.getByText(/Not established/i)).toBeInTheDocument();
    expect(screen.getByText(/Raised \$42,000 on Kickstarter/i)).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /Explore production scenarios/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("expands to reveal planning range, disclaimer, and top cost drivers", () => {
    render(<ProductionScenariosSection card={baseCard} />);

    const toggleBtn = screen.getByRole("button", { name: /Explore production scenarios/i });
    fireEvent.click(toggleBtn);

    // Disclaimer banner
    expect(screen.getByText(/Indicative Planning Tool:/i)).toBeInTheDocument();
    expect(screen.getByText(/INDICATIVE PLANNING RANGE/i)).toBeInTheDocument();

    // Top cost drivers
    expect(screen.getByText(/Top Cost Drivers/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Keyframe & Inbetween Animation Workload/i).length).toBeGreaterThan(0);

    // Diligence step
    expect(screen.getByText(/NEXT DILIGENCE STEP/i)).toBeInTheDocument();
  });

  it("opens inspection drawer showing exact line item arithmetic and explanation", () => {
    render(<ProductionScenariosSection card={baseCard} />);

    const toggleBtn = screen.getByRole("button", { name: /Explore production scenarios/i });
    fireEvent.click(toggleBtn);

    const inspectBtn = screen.getByRole("button", { name: /View Calculation & Sources/i });
    fireEvent.click(inspectBtn);

    expect(screen.getByText(/CALCULATION AUDIT & EVIDENCE/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive Diligence Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Itemized Line Items/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Production Cost/i)).toBeInTheDocument();

    // Close drawer
    const closeBtn = screen.getByRole("button", { name: /Close calculation audit drawer/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/CALCULATION AUDIT & EVIDENCE/i)).not.toBeInTheDocument();
  });

  it("handles development option switching and comparison", () => {
    render(<ProductionScenariosSection card={baseCard} />);

    const toggleBtn = screen.getByRole("button", { name: /Explore production scenarios/i });
    fireEvent.click(toggleBtn);

    // Open comparison
    const compareBtn = screen.getByRole("button", { name: /Compare Options/i });
    fireEvent.click(compareBtn);

    expect(screen.getByText(/Development Scope Comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Side-by-side analysis of up to 3 development pathways/i)).toBeInTheDocument();
    expect(screen.getByText(/Lower cost indicates reduced scope or duration, not commercial superiority/i)).toBeInTheDocument();
  });

  it("displays stale evidence notice when scenario card version differs from current card", () => {
    const savedScenario = {
      id: "scen-old",
      projectId: baseCard.projectId,
      cardVersionId: "card-test-v1-old", // Saved against older version
      ownerId: "session-local-user",
      isPrivate: true,
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
      revision: 1,
      options: [
        {
          id: "opt-1",
          label: "Old Option",
          targetFormat: "series" as const,
          technique: "2d_animation" as const,
          location: "US",
          currency: "USD" as const,
          priceDate: "2026-08",
          runtimeMinutes: 10,
          episodeCount: 1,
          sharedSetupReuseDiscountPercent: 0,
          inputs: {},
          lineItems: [],
          allowances: [],
        },
      ],
      activeOptionId: "opt-1",
    };

    const updatedCard = { ...baseCard, cardVersionId: "card-test-v2-new" };
    render(<ProductionScenariosSection card={updatedCard} initialScenario={savedScenario} />);

    const toggleBtn = screen.getByRole("button", { name: /Explore production scenarios/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Scout Card evidence version advanced/i)).toBeInTheDocument();
  });
});
