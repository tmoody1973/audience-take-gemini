import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorResponseBanner } from "@/features/scout-card/creator-response-banner";
import { getScoutCardFixture } from "@/features/scout-card/data";

describe("CreatorResponseBanner", () => {
  it("renders verified creator statement when claimStatus is approved", () => {
    const card = {
      ...getScoutCardFixture("complete"),
      claimStatus: "approved" as const,
      creatorStatement: {
        authorName: "RubberGum Studio",
        statementText: "We are actively developing the 6-part pilot based on community pathway signals.",
        verifiedAt: "2026-09-02T10:00:00Z",
      },
    };

    render(<CreatorResponseBanner card={card} />);
    expect(screen.getByText(/Creator Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/We are actively developing the 6-part pilot/i)).toBeInTheDocument();
  });

  it("renders honest unclaimed banner when creator has not claimed", () => {
    const card = {
      ...getScoutCardFixture("complete"),
      claimStatus: "unclaimed" as const,
    };

    render(<CreatorResponseBanner card={card} />);
    expect(screen.getByText(/Unclaimed by creator/i)).toBeInTheDocument();
  });
});
