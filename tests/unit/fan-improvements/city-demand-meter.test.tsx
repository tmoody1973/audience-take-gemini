import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CityDemandMeter } from "@/features/social/city-demand-meter";

describe("CityDemandMeter", () => {
  it("renders top cities and progress towards screening threshold", () => {
    const cities = { "Chicago": 45, "New York": 80, "Austin": 20 };
    render(<CityDemandMeter cities={cities} threshold={100} />);
    expect(screen.getByText(/Community Screening Demand/i)).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
    expect(screen.getByText("80 / 100 signals")).toBeInTheDocument();
    expect(screen.getByText("Chicago")).toBeInTheDocument();
    expect(screen.getByText("45 / 100 signals")).toBeInTheDocument();
  });

  it("handles threshold reached state and default threshold", () => {
    const cities = { "Milwaukee": 120 };
    render(<CityDemandMeter cities={cities} />);
    expect(screen.getByText("Milwaukee")).toBeInTheDocument();
    expect(screen.getByText("120 / 100 signals")).toBeInTheDocument();
    expect(screen.getByText(/Threshold reached/i)).toBeInTheDocument();
  });
});
