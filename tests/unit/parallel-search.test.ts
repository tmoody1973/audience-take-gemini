import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ParallelSearchClient } from "../../src/services/parallel-client";

describe("ParallelSearchClient Unit Tests (Mocked Transport)", () => {
  const originalFetch = globalThis.fetch;
  const originalEnvKey = process.env.PARALLEL_API_KEY;

  beforeEach(() => {
    delete process.env.PARALLEL_API_KEY;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnvKey !== undefined) {
      process.env.PARALLEL_API_KEY = originalEnvKey;
    } else {
      delete process.env.PARALLEL_API_KEY;
    }
    vi.restoreAllMocks();
  });

  it("handles missing API key safely without making network requests", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const client = new ParallelSearchClient();
    const result = await client.search({
      objective: "Find public reception for Indie Movie",
      search_queries: ["Indie Movie reviews"],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.search_id).toMatch(/^no_key_/);
    expect(result.results).toEqual([]);
    expect(result.warnings).toContain("PARALLEL_API_KEY not configured");
  });

  it("sends correct POST request, URL, headers, and payload structure", async () => {
    let capturedUrl = "";
    let capturedOptions: RequestInit | undefined;

    const mockResponsePayload = {
      search_id: "search_mock_12345",
      results: [
        {
          url: "https://variety.com/2026/film/news/indie-breakout",
          title: "Variety: Indie Breakout Feature Announced",
          publish_date: "2026-08-01",
          excerpts: ["A gripping story about climate resilience."],
        },
      ],
      warnings: null,
    };

    globalThis.fetch = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      capturedUrl = typeof url === "string" ? url : url.toString();
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => mockResponsePayload,
      } as unknown as Response;
    });

    const fakeKey = "mock-fake-test-key-never-live";
    const client = new ParallelSearchClient(fakeKey);

    const result = await client.search({
      objective: "Research indie film festival acclaim",
      search_queries: ["Indie Film festival awards", "Indie Film director interview"],
      mode: "fast",
      maxResults: 5,
    });

    expect(capturedUrl).toBe("https://api.parallel.ai/v1/search");
    expect(capturedOptions?.method).toBe("POST");

    const headers = capturedOptions?.headers as Record<string, string>;
    expect(headers).toBeDefined();
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["x-api-key"]).toBeDefined();
    expect(headers["x-api-key"]).toBe(fakeKey);

    const parsedBody = JSON.parse(capturedOptions?.body as string);
    expect(parsedBody.objective).toBe("Research indie film festival acclaim");
    expect(parsedBody.search_queries).toHaveLength(2);
    expect(parsedBody.search_queries).toContain("Indie Film festival awards");
    expect(parsedBody.mode).toBe("basic");
    expect(parsedBody.advanced_settings.max_results).toBe(5);

    expect(result.search_id).toBe("search_mock_12345");
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Variety: Indie Breakout Feature Announced");
    expect(result.results[0].url).toBe("https://variety.com/2026/film/news/indie-breakout");
  });

  it("filters out unsafe/private IP URLs through SSRF Guard sanitization", async () => {
    const mockResponseWithPrivateIps = {
      search_id: "search_mock_ssrf_test",
      results: [
        {
          url: "https://deadline.com/article-safe",
          title: "Safe Public Source",
          excerpts: ["Public verified info."],
        },
        {
          url: "http://169.254.169.254/latest/meta-data",
          title: "Blocked Metadata IP",
          excerpts: ["Secret info."],
        },
        {
          url: "http://127.0.0.1:8080/admin",
          title: "Blocked Localhost IP",
          excerpts: ["Localhost."],
        },
      ],
    };

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => mockResponseWithPrivateIps,
    } as unknown as Response));

    const client = new ParallelSearchClient("mock-test-key");
    const result = await client.search({
      objective: "Test SSRF filtering",
      search_queries: ["Test queries"],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Safe Public Source");
    expect(result.results[0].url).toBe("https://deadline.com/article-safe");
  });

  it("handles HTTP 4xx/5xx API errors gracefully without throwing", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized: Invalid API Key",
    } as unknown as Response));

    const client = new ParallelSearchClient("invalid-mock-key");
    const result = await client.search({
      objective: "Test API error handling",
      search_queries: ["Some query"],
    });

    expect(result.search_id).toMatch(/^parallel_empty_/);
    expect(result.results).toEqual([]);
    expect(result.warnings).toContain("Live Parallel Search query yielded no external results.");
  });

  it("handles network fetch rejection gracefully without throwing", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("DNS resolution failed");
    });

    const client = new ParallelSearchClient("mock-key");
    const result = await client.search({
      objective: "Test network failure",
      search_queries: ["Network test query"],
    });

    expect(result.search_id).toMatch(/^parallel_empty_/);
    expect(result.results).toEqual([]);
    expect(result.warnings).toContain("Live Parallel Search query yielded no external results.");
  });
});

/**
 * Opt-in Real Integration Test Suite
 * To run: RUN_PARALLEL_INTEGRATION_TESTS=1 PARALLEL_API_KEY=your_key npm test
 * NOTE: This makes real paid API calls against api.parallel.ai.
 */
describe.skipIf(!process.env.RUN_PARALLEL_INTEGRATION_TESTS || !process.env.PARALLEL_API_KEY)(
  "Parallel Search Live Integration (Opt-In)",
  () => {
    it("executes a live search against api.parallel.ai when explicitly opted-in", async () => {
      const client = new ParallelSearchClient();
      const result = await client.search({
        objective: "Find public film festival history for River of Copper",
        search_queries: ["River of Copper film festival", "River of Copper director"],
        mode: "fast",
      });

      expect(result).toBeDefined();
      expect(result.search_id).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].url).toMatch(/^https:\/\//);
    });
  },
);
