import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LivingUpdates, type ProjectLivingUpdate } from "@/features/scout-card/living-updates";

describe("LivingUpdates Timeline Enhancement", () => {
  it("renders category pill badges and milestone timeline elements", () => {
    const updates: ProjectLivingUpdate[] = [
      {
        id: "up-1",
        projectId: "proj-1",
        summary: "Patreon campaign reached $15,000 monthly production budget.",
        eventDate: "2026-09-01",
        citations: [{ url: "https://patreon.com/example", title: "Patreon" }],
        confidence: "high",
        detectedAt: "2026-09-01T12:00:00Z",
        category: "funding",
      },
      {
        id: "up-2",
        projectId: "proj-1",
        summary: "Selected for Clermont-Ferrand Short Film Market 2026.",
        eventDate: "2026-08-28",
        citations: [{ url: "https://clermont-filmfest.org", title: "Festival Program" }],
        confidence: "high",
        detectedAt: "2026-08-28T10:00:00Z",
        category: "festival",
      },
    ];

    render(<LivingUpdates updates={updates} />);
    expect(screen.getByText(/Funding/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Festival/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Patreon campaign reached/i)).toBeInTheDocument();
  });
});
