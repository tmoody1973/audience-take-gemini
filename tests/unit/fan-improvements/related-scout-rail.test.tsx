import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RelatedScoutRail } from "@/features/scout-card/related-scout-rail";

describe("RelatedScoutRail", () => {
  it("renders related projects by storyworld DNA", () => {
    const related = [
      {
        slug: "project-omega",
        title: "Project Omega",
        hook: "A deep-space salvage crew discovers a living derelict.",
        projectType: "series",
        sharedThemes: ["hard sci-fi", "survival"],
      },
    ];

    render(<RelatedScoutRail related={related} />);
    expect(screen.getByText(/Similar Storyworld DNA/i)).toBeInTheDocument();
    expect(screen.getByText("Project Omega")).toBeInTheDocument();
    expect(screen.getByText("A deep-space salvage crew discovers a living derelict.")).toBeInTheDocument();
    expect(screen.getByText("hard sci-fi")).toBeInTheDocument();
  });

  it("renders null or empty state gracefully when related array is empty", () => {
    const { container } = render(<RelatedScoutRail related={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
