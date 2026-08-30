import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../../lib/firebase/config", () => ({
  hasFirebaseClientConfig: () => false,
}));

describe("/about page", () => {
  it("renders exactly one H1 headline with the required hero text", async () => {
    const { default: AboutPage } = await import("./page");
    render(<AboutPage />);

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("The next great screen story may already be online.");
  });

  it("renders the persona directory with the four in-page anchor destinations", async () => {
    const { default: AboutPage } = await import("./page");
    render(<AboutPage />);

    expect(screen.getByRole("link", { name: /i want to discover/i })).toHaveAttribute(
      "href",
      "#public-visitor",
    );
    expect(screen.getByRole("link", { name: /i found something/i })).toHaveAttribute(
      "href",
      "#fan-scout",
    );
    expect(screen.getByRole("link", { name: /i made something/i })).toHaveAttribute(
      "href",
      "#creator",
    );
    expect(screen.getByRole("link", { name: /i scout emerging work/i })).toHaveAttribute(
      "href",
      "#industry",
    );
  });

  it("renders all required primary and secondary CTAs across sections", async () => {
    const { default: AboutPage } = await import("./page");
    render(<AboutPage />);

    // Hero CTAs
    expect(screen.getByRole("link", { name: /^scout a project/i })).toHaveAttribute(
      "href",
      "/nominate",
    );
    expect(screen.getByRole("link", { name: /^explore the scouting wall/i })).toHaveAttribute(
      "href",
      "/projects",
    );

    // Persona CTAs
    expect(screen.getByRole("link", { name: /^browse scout cards/i })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("link", { name: /^nominate what you found/i })).toHaveAttribute(
      "href",
      "/nominate",
    );
    expect(screen.getByRole("link", { name: /^visit the creator desk/i })).toHaveAttribute(
      "href",
      "/creator",
    );
    expect(screen.getByRole("link", { name: /^open the industry lens/i })).toHaveAttribute(
      "href",
      "/projects/junichiro-live-project#industry-lens-title",
    );

    // Final Ticket CTAs
    expect(screen.getByRole("link", { name: /^start a nomination/i })).toHaveAttribute(
      "href",
      "/nominate",
    );
    expect(screen.getByRole("link", { name: /^explore projects first/i })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("renders the research proof points with correct source links and platform labels", async () => {
    const { default: AboutPage } = await import("./page");
    render(<AboutPage />);

    expect(screen.getByText(/13.8% of TV watch-time/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nielsen Gauge/i })).toHaveAttribute(
      "href",
      "https://content.nielsen.com/gauge-and-glossary",
    );

    expect(screen.getByText(/56% of Gen Z/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Deloitte Digital Media Trends/i })).toHaveAttribute(
      "href",
      "https://www.deloitte.com/us/en/insights/industry/technology/digital-media-trends-consumption-habits-survey/2025.html",
    );

    expect(screen.getByText(/13,900\+ Funded Projects/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kickstarter Film/i })).toHaveAttribute(
      "href",
      "https://www.kickstarter.com/pages/film",
    );
  });

  it("renders core trust lines and AI boundaries", async () => {
    const { default: AboutPage } = await import("./page");
    render(<AboutPage />);

    expect(screen.getByText(/Public sources. Clear labels. No mystery score./i)).toBeInTheDocument();
    expect(
      screen.getByText(/AI helps organize the public record. It does not decide which story deserves to exist./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fans scout. Creators speak for their own projects./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /WHAT AI DOES NOT DO/i })).toBeInTheDocument();
    expect(screen.getByText(/Decide which film or series deserves to exist/i)).toBeInTheDocument();
  });
});
