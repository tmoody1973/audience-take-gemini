import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CityDemandMeter } from "@/features/social/city-demand-meter";
import { LivingUpdates, type ProjectLivingUpdate } from "@/features/scout-card/living-updates";
import { ProfessionalBriefView } from "@/features/scout-card/professional-brief-view";
import { getScoutCardFixture, FALLBACK_RELATED_PROJECTS } from "@/features/scout-card/data";
import {
  normalizeCity,
  moveCityCommitmentCount,
} from "@/lib/social/store";

describe("Package C1: Truthful Surfaces", () => {
  describe("City Demand Meter", () => {
    it("renders honest empty state when no city signals exist (no fake fallback)", () => {
      render(<CityDemandMeter cities={{}} threshold={100} />);
      expect(screen.queryByText(/New York/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Los Angeles/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Chicago/i)).not.toBeInTheDocument();
      expect(
        screen.getByText(/No city signals recorded yet/i)
      ).toBeInTheDocument();
    });

    it("displays genuine city count when one real signal is provided", () => {
      render(<CityDemandMeter cities={{ Milwaukee: 1 }} threshold={100} />);
      expect(screen.getByText("Milwaukee")).toBeInTheDocument();
      expect(screen.getByText("1 / 100 signals")).toBeInTheDocument();
      expect(screen.getByText("99 more needed to activate")).toBeInTheDocument();
    });

    it("shows community goal met, NOT partner outreach active, when threshold is reached without outreach record", () => {
      render(<CityDemandMeter cities={{ Milwaukee: 105 }} threshold={100} />);
      expect(screen.getByText("Milwaukee")).toBeInTheDocument();
      expect(screen.getByText("105 / 100 signals")).toBeInTheDocument();
      // Must not falsely assert partner outreach is active
      expect(screen.queryByText(/Partner outreach active/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Community interest goal met/i)).toBeInTheDocument();
    });

    it("displays partner outreach in progress only when outreachActive prop is explicitly true", () => {
      render(
        <CityDemandMeter
          cities={{ Milwaukee: 105 }}
          threshold={100}
          outreachActive={true}
        />
      );
      expect(screen.getByText(/Partner outreach in progress/i)).toBeInTheDocument();
    });
  });

  describe("City Normalization & Social Store Aggregation Reconciliation", () => {
    it("normalizes city names consistently across variations", () => {
      expect(normalizeCity("new york")).toBe("New York");
      expect(normalizeCity("  chicago  ")).toBe("Chicago");
      expect(normalizeCity("SAN FRANCISCO")).toBe("San Francisco");
      expect(normalizeCity("mount pleasant, wi")).toBe("Mount Pleasant, WI");
    });

    it("reconciles totals across new submissions, updates, and withdrawals", () => {
      let cityCounts: Record<string, number> = {};

      // 1. First user commits to Chicago
      cityCounts = moveCityCommitmentCount(cityCounts, undefined, "Chicago", true);
      expect(cityCounts["Chicago"]).toBe(1);

      // 2. Second user commits to Chicago
      cityCounts = moveCityCommitmentCount(cityCounts, undefined, "Chicago", true);
      expect(cityCounts["Chicago"]).toBe(2);

      // 3. First user changes city from Chicago to Milwaukee
      cityCounts = moveCityCommitmentCount(cityCounts, "Chicago", "Milwaukee", true);
      expect(cityCounts["Chicago"]).toBe(1);
      expect(cityCounts["Milwaukee"]).toBe(1);

      // 4. Second user withdraws commitment
      cityCounts = moveCityCommitmentCount(cityCounts, "Chicago", undefined, false);
      expect(cityCounts["Chicago"]).toBe(0);
      expect(cityCounts["Milwaukee"]).toBe(1);

      // Total active city signals equals sum of positive counts
      const totalSignals = Object.values(cityCounts).reduce((a, b) => a + Math.max(0, b), 0);
      expect(totalSignals).toBe(1);
    });
  });

  describe("Living Updates Truthful Monitoring State", () => {
    const sampleUpdates: ProjectLivingUpdate[] = [
      {
        id: "u-1",
        projectId: "proj-1",
        summary: "World premiere announced at Milwaukee Film Festival.",
        eventDate: "2026-09-01",
        citations: [{ url: "https://mkefilm.cc/festival", title: "Festival Program" }],
        confidence: "high",
        detectedAt: "2026-09-01T12:00:00Z",
        category: "festival",
      },
    ];

    it("renders Active Monitoring badge only when monitor status is active", () => {
      render(
        <LivingUpdates
          updates={sampleUpdates}
          monitorHealth={{ status: "active", lastSuccessfulResearchAt: "2026-09-05T10:00:00Z" }}
        />
      );
      expect(screen.getByText(/Active Monitoring/i)).toBeInTheDocument();
    });

    it("does NOT render Live Tracking when monitor is canceled or disabled", () => {
      render(
        <LivingUpdates
          updates={sampleUpdates}
          monitorHealth={{ status: "disabled", lastCheckedAt: "2026-08-30T10:00:00Z" }}
        />
      );
      expect(screen.queryByText(/Live Tracking/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Active Monitoring/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Recorded Updates/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitoring paused/i)).toBeInTheDocument();
    });

    it("renders neutral Recorded Updates header when no monitor exists", () => {
      render(<LivingUpdates updates={sampleUpdates} />);
      expect(screen.queryByText(/Live Tracking/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Active Monitoring/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Recorded Updates/i)).toBeInTheDocument();
    });
  });

  describe("Public Dossier & Related Content Truthfulness", () => {
    it("does not render CONFIDENTIAL EVALUATION RECORD on public dossier", () => {
      const card = getScoutCardFixture("complete");
      render(<ProfessionalBriefView card={card} />);
      expect(screen.queryByText(/CONFIDENTIAL EVALUATION RECORD/i)).not.toBeInTheDocument();
      expect(screen.getByText(/PROFESSIONAL DOSSIER/i)).toBeInTheDocument();
    });

    it("CYCLE related project describes Ty'Rese West documentary, not bicycle rebuilding", () => {
      const cycleProject = FALLBACK_RELATED_PROJECTS.find((p) => p.slug === "cycle");
      expect(cycleProject).toBeDefined();
      expect(cycleProject?.hook).toContain("Ty'Rese West");
      expect(cycleProject?.hook).not.toContain("rebuild discarded bicycles");
      expect(cycleProject?.sharedThemes).toContain("justice");
    });
  });
});
