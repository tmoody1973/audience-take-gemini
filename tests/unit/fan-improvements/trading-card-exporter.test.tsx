import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TradingCardExporter, getCardThumbnailUrl } from "@/features/scout-card/trading-card-exporter";
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

  describe("getCardThumbnailUrl", () => {
    it("extracts YouTube thumbnail from media.sourceUrl", () => {
      const card = {
        ...getScoutCardFixture("complete"),
        media: {
          state: "authorized_embed" as const,
          title: "Trailer",
          sourceUrl: "https://www.youtube.com/watch?v=NB_pfgYMR4Y",
          embedUrl: "https://www.youtube-nocookie.com/embed/NB_pfgYMR4Y",
          attribution: "RubberGum",
          accessibleFallback: "Watch on YouTube",
        },
      };
      expect(getCardThumbnailUrl(card)).toBe("https://img.youtube.com/vi/NB_pfgYMR4Y/hqdefault.jpg");
    });

    it("prefers direct media.imageUrl if specified", () => {
      const card = {
        ...getScoutCardFixture("complete"),
        media: {
          state: "authorized_image" as const,
          title: "Poster",
          sourceUrl: "https://example.com/poster",
          imageUrl: "https://example.com/poster.jpg",
          attribution: "Studio",
          accessibleFallback: "Poster image",
        },
      };
      expect(getCardThumbnailUrl(card)).toBe("https://example.com/poster.jpg");
    });

    it("returns null when no image or YouTube URL is present", () => {
      const card = {
        ...getScoutCardFixture("complete"),
        media: {
          state: "unavailable" as const,
          title: "No Media",
          sourceUrl: "https://vimeo.com/123456",
          attribution: "None",
          accessibleFallback: "None",
        },
        provenance: {
          ...getScoutCardFixture("complete").provenance,
          submittedSourceUrl: "https://vimeo.com/123456",
        },
        sourceLedger: [],
      };
      expect(getCardThumbnailUrl(card)).toBeNull();
    });
  });
});

