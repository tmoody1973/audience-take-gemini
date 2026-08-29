import { validateSafeUrl } from "./ssrf-guard";

export interface ParallelSearchResultItem {
  url: string;
  title: string;
  publish_date?: string | null;
  excerpts: string[];
}

export interface ParallelSearchResponse {
  search_id: string;
  results: ParallelSearchResultItem[];
  warnings?: string[] | null;
}

export interface ParallelSearchOptions {
  objective: string;
  search_queries: string[];
  mode?: "basic" | "fast" | "turbo" | "advanced";
  maxResults?: number;
}

const DEFAULT_PARALLEL_KEY = "cPOGrhSRfJhPZpF28bYlZHjAZ56bkMifxz0kXOg2";

export class ParallelSearchClient {
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = "https://api.parallel.ai/v1") {
    this.apiKey = apiKey || process.env.PARALLEL_API_KEY || DEFAULT_PARALLEL_KEY;
    this.baseUrl = baseUrl;
  }

  /**
   * Performs an LLM-optimized web search using Parallel Search API v1
   */
  async search(options: ParallelSearchOptions): Promise<ParallelSearchResponse> {
    const key = this.apiKey || process.env.PARALLEL_API_KEY || DEFAULT_PARALLEL_KEY;
    if (!key) {
      console.warn("ParallelSearchClient: No PARALLEL_API_KEY available.");
      return { search_id: `no_key_${Date.now()}`, results: [], warnings: ["PARALLEL_API_KEY not configured"] };
    }

    const cleanObjective = (options.objective || "Research screen project").slice(0, 800);
    const rawQueries = options.search_queries || [];
    const uniqueQueries = [...new Set(rawQueries.map((q) => q.trim()).filter((q) => q.length >= 2 && q.length <= 120))];

    if (uniqueQueries.length < 2) {
      uniqueQueries.push(`${cleanObjective.slice(0, 60)} film series`);
    }
    const search_queries = uniqueQueries.slice(0, 3);

    const body = {
      objective: cleanObjective,
      search_queries,
      mode: "basic",
      max_chars_total: 12000,
      advanced_settings: {
        max_results: options.maxResults || 8,
        excerpt_settings: {
          max_chars_per_result: 1200,
        },
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json()) as ParallelSearchResponse;
        return await this.sanitizeResults(data);
      } else {
        const errText = await response.text();
        console.warn(`Parallel Search API responded with status ${response.status}:`, errText);
      }
    } catch (err) {
      console.warn("Parallel Search API fetch error:", err);
    }

    return {
      search_id: `parallel_empty_${Date.now()}`,
      results: [],
      warnings: ["Live Parallel Search query yielded no external results."],
    };
  }

  /**
   * Validate returned URLs through SSRF Guard
   */
  private async sanitizeResults(data: ParallelSearchResponse): Promise<ParallelSearchResponse> {
    const safeResults: ParallelSearchResultItem[] = [];
    for (const res of data.results || []) {
      const safe = await validateSafeUrl(res.url);
      if (safe.valid) {
        safeResults.push(res);
      }
    }
    return {
      ...data,
      results: safeResults,
    };
  }
}

export const parallelClient = new ParallelSearchClient();

