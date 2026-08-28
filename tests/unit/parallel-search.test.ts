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

    const firstResult = result.results[0];
    expect(firstResult.title).toContain("River of Copper");
    expect(firstResult.url).toMatch(/^https:\/\//);
    expect(firstResult.excerpts.length).toBeGreaterThan(0);
    expect(typeof firstResult.excerpts[0]).toBe("string");
  });

  it("handles custom mode options (fast, turbo, advanced)", async () => {
    const client = new ParallelSearchClient();
    const result = await client.search({
      objective: "Deep search for indie sci-fi shorts",
      search_queries: ["Signal in the Pines proof of concept"],
      mode: "advanced",
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].title).toContain("Signal in the Pines");
  });
});
