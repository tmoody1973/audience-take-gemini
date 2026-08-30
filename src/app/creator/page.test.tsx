import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/domain";

const mockProjects: Project[] = [
  {
    id: "proj-unclaimed",
    identity: {
      title: "Unclaimed Indie Feature",
      medium: "feature_film",
      currentStage: "post_production",
      creators: ["Alex Director"],
      logline: "A suspenseful thriller set in the mountains.",
    },
    creatorClaim: {
      status: "unclaimed",
      claimedBy: null,
      claimedAt: null,
      evidenceUrl: null,
    },
    metrics: {
      watchCount: 420,
      cityDemandCount: 55,
      payCount: 110,
    },
  } as unknown as Project,
  {
    id: "proj-pending",
    identity: {
      title: "Pending Review Documentary",
      medium: "documentary",
      currentStage: "production",
      creators: ["Jordan Producer"],
      logline: "An investigative documentary on local music.",
    },
    creatorClaim: {
      status: "pending",
      claimedBy: "user-123",
      claimedAt: "2026-08-01T00:00:00Z",
      evidenceUrl: "https://twitter.com/filmmaker",
    },
    metrics: {
      watchCount: 880,
      cityDemandCount: 140,
      payCount: 220,
    },
  } as unknown as Project,
  {
    id: "proj-verified",
    identity: {
      title: "Verified Pilot Series",
      medium: "series",
      currentStage: "completed",
      creators: ["Taylor Showrunner"],
      logline: "A sci-fi comedy web series.",
    },
    creatorClaim: {
      status: "verified",
      claimedBy: "user-456",
      claimedAt: "2026-07-15T00:00:00Z",
      evidenceUrl: "https://creatorstudio.com",
    },
    metrics: {
      watchCount: 1500,
      cityDemandCount: 300,
      payCount: 450,
    },
  } as unknown as Project,
];

vi.mock("@/services/firestore-repo", () => ({
  dataRepo: {
    getProjects: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/creator",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/firebase/config", () => ({
  hasFirebaseClientConfig: () => false,
}));

describe("Creator Desk Page (/creator)", () => {
  beforeEach(async () => {
    const { dataRepo } = await import("@/services/firestore-repo");
    vi.mocked(dataRepo.getProjects).mockResolvedValue(mockProjects);
  });

  it("renders exactly one H1 and approved hero copy", async () => {
    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("CREATOR DESK");

    expect(screen.getByText(/CREATOR STEWARDSHIP PROGRAM/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Find your project, request verified stewardship, and turn audience signals into a clearer next move./i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /FIND YOUR PROJECT/i })).toHaveAttribute(
      "href",
      "#creator-projects",
    );
    expect(screen.getByRole("link", { name: /HOW CLAIMING WORKS/i })).toHaveAttribute(
      "href",
      "#creator-access",
    );
  });

  it("renders the 3-step claiming explanation", async () => {
    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    expect(screen.getByRole("heading", { name: /YOUR WORK. YOUR VERIFIED VOICE./i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "FIND THE SCOUT CARD" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "REQUEST STEWARDSHIP" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PUBLISH CREATOR UPDATES" })).toBeInTheDocument();
  });

  it("renders community snapshot with mandatory intent qualification", async () => {
    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    expect(screen.getByRole("heading", { name: /WHAT AUDIENCES ARE SIGNALING/i })).toBeInTheDocument();
    expect(screen.getByText(/1 creator-verified/i)).toBeInTheDocument();
    expect(screen.getByText(/Audience intent signals/i)).toBeInTheDocument();
    expect(screen.getByText(/Location-based requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Intent, not purchases/i)).toBeInTheDocument();

    expect(
      screen.getByText(
        /These are voluntary Audience Take intentions—not purchases, ticket sales, turnout guarantees, or a demand forecast./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders permissions and independence split ledger", async () => {
    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    expect(screen.getByRole("heading", { name: /AFTER VERIFICATION/i })).toBeInTheDocument();
    expect(screen.getByText(/Publish official production updates and authorized media/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /THE SCOUT CARD STAYS INDEPENDENT/i })).toBeInTheDocument();
    expect(screen.getByText(/Creators cannot rewrite independent citations or research findings/i)).toBeInTheDocument();
  });

  it("routes actions properly according to project claim status", async () => {
    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    // Unclaimed project
    expect(screen.getByText(/Unclaimed Indie Feature/i)).toBeInTheDocument();
    const unclaimedAction = screen.getByRole("link", { name: /REQUEST TO CLAIM/i });
    expect(unclaimedAction).toHaveAttribute("href", "/scout/proj-unclaimed#trust-and-ownership");

    // Pending review project
    expect(screen.getByText(/Pending Review Documentary/i)).toBeInTheDocument();
    const pendingAction = screen.getByRole("link", { name: /OPEN CLAIM SECTION/i });
    expect(pendingAction).toHaveAttribute("href", "/scout/proj-pending#trust-and-ownership");

    // Verified creator project
    expect(screen.getByText(/Verified Pilot Series/i)).toBeInTheDocument();
    const verifiedAction = screen.getByRole("link", { name: /MANAGE UPDATES/i });
    expect(verifiedAction).toHaveAttribute("href", "/projects/proj-verified/manage");
  });

  it("renders empty state cleanly when zero projects exist", async () => {
    const { dataRepo } = await import("@/services/firestore-repo");
    vi.mocked(dataRepo.getProjects).mockResolvedValueOnce([]);

    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    expect(screen.getByText(/NO SCOUTED PROJECTS YET/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NOMINATE A PROJECT/i })).toHaveAttribute("href", "/nominate");
  });

  it("renders closing nomination ticket CTA", async () => {
    const { default: CreatorDeskPage } = await import("./page");
    render(await CreatorDeskPage());

    expect(screen.getByText(/DO NOT SEE YOUR WORK\?/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /GIVE IT A PUBLIC STARTING POINT./i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NOMINATE YOUR PROJECT/i })).toHaveAttribute("href", "/nominate");
  });
});
