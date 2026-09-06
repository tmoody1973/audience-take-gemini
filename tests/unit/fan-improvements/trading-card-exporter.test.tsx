import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TradingCardExporter } from "@/features/scout-card/trading-card-exporter";
import { getScoutCardFixture } from "@/features/scout-card/data";

describe("TradingCardExporter", () => {
  it("renders export button and modal trigger", () => {
    render(<TradingCardExporter card={getScoutCardFixture("complete")} />);
    const trigger = screen.getByRole("button", { name: /Export Trading Card/i });
    expect(trigger).toBeInTheDocument();

    // Click to open modal
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: /Scout Trading Card Preview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PNG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy Image/i })).toBeInTheDocument();
  });
});
