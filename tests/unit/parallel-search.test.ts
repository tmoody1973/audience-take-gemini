import { describe, it, expect } from "vitest";
import { ParallelSearchClient } from "../../src/services/parallel-client";

describe("Parallel Search API Integration", () => {
  it("executes search and returns structured results with title, url, and excerpts", async () => {
    const client = new ParallelSearchClient();
    const result = await client.search({
      objective: "Find public reception and festival history for River of Copper",
      search_queries: ["River of Copper film festival", "River of Copper director"],
      mode: "fast",
    });

    expect(result).toBeDefined();
    expect(result.search_id).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);

    const hasRelevantResult = result.results.some(
      (r) => r.title.toLowerCase().includes("river") || r.excerpts.some((e) => e.toLowerCase().includes("river")),
    );
    expect(hasRelevantResult).toBe(true);
    expect(result.results[0].url).toMatch(/^https:\/\//);
    expect(result.results[0].excerpts.length).toBeGreaterThan(0);
    expect(typeof result.results[0].excerpts[0]).toBe("string");
  });

  it("handles custom mode options (fast, turbo, advanced)", async () => {
    const client = new ParallelSearchClient();
    const result = await client.search({
      objective: "Deep search for indie sci-fi shorts",
      search_queries: ["Signal in the Pines proof of concept"],
      mode: "advanced",
    });

    expect(result.results.length).toBeGreaterThan(0);
    const hasSciFiResult = result.results.some(
      (r) => r.title.toLowerCase().includes("signal") || r.title.toLowerCase().includes("sci") || r.title.toLowerCase().includes("film"),
    );
    expect(hasSciFiResult).toBe(true);
  });
});
