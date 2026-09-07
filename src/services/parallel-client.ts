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
  providerStatus: "succeeded" | "failed" | "skipped_no_key";
  errorDetails?: string;
  warnings?: string[] | null;
  session_id?: string;
}

export interface ParallelSearchOptions {
  objective: string;
  search_queries: string[];
  mode?: "basic" | "fast" | "turbo" | "advanced";
  maxResults?: number;
  sessionId?: string;
}

export interface ParallelExtractItem {
  url: string;
  title?: string;
  markdown?: string;
  excerpts?: string[];
  full_content?: string | null;
  publish_date?: string | null;
}

export interface ParallelExtractResponse {
  extract_id: string;
  results: ParallelExtractItem[];
  providerStatus: "succeeded" | "failed" | "skipped_no_key";
  errorDetails?: string;
  warnings?: string[] | null;
  session_id?: string;
  errors?: { url: string; error: string }[];
}

export interface ParallelExtractOptions {
  urls: string[];
  objective?: string;
  sessionId?: string;
  mode?: "basic" | "markdown" | "full";
  maxCharsPerResult?: number;
}

export interface ParallelMonitorOptions {
  name: string;
  targetUrl: string;
  query?: string;
  frequency?: "daily" | "weekly" | "hourly" | "1d" | "1w" | "1h";
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

export interface ParallelMonitorResponse {
  monitor_id: string;
  status: "active" | "pending" | "disabled";
  target_url?: string;
  created_at: string;
  warnings?: string[] | null;
}

export class ParallelSearchClient {
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = "https://api.parallel.ai/v1") {
    this.apiKey = apiKey || process.env.PARALLEL_API_KEY || null;
    this.baseUrl = baseUrl;
  }

  /**
   * Performs an LLM-optimized web search using Parallel Search API v1
   */
  async search(options: ParallelSearchOptions): Promise<ParallelSearchResponse> {
    const key = this.apiKey || process.env.PARALLEL_API_KEY || null;
    if (!key) {
      console.warn("ParallelSearchClient: No PARALLEL_API_KEY configured.");
      return {
        search_id: `no_key_${Date.now()}`,
        results: [],
        providerStatus: "skipped_no_key",
        warnings: ["PARALLEL_API_KEY not configured"],
      };
    }

    const cleanObjective = (options.objective || "Research screen project").slice(0, 800);
    const sanitizeQuery = (q: string): string =>
      q.replace(/project under research/gi, "")
       .replace(/investigating/gi, "")
       .replace(/\s+/g, " ")
       .trim();

    const rawQueries = options.search_queries || [];
    const uniqueQueries = [
      ...new Set(
        rawQueries
          .map(sanitizeQuery)
          .filter((q) => q.length >= 2 && q.length <= 120)
      ),
    ];

    if (uniqueQueries.length === 0) {
      const fallbackTerm = sanitizeQuery(cleanObjective).slice(0, 60);
      uniqueQueries.push(fallbackTerm.length >= 3 ? fallbackTerm : "independent screen storytelling official");
    }
    const search_queries = uniqueQueries.slice(0, 3);

    const body: Record<string, any> = {
      objective: cleanObjective,
      search_queries,
      mode: options.mode || "basic",
      max_chars_total: 12000,
      advanced_settings: {
        max_results: options.maxResults || 8,
        excerpt_settings: {
          max_chars_per_result: 1200,
        },
      },
    };

    if (options.sessionId) {
      body.session_id = options.sessionId;
    }

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
        data.providerStatus = "succeeded";
        return await this.sanitizeSearchResults(data);
      } else {
        const errText = await response.text();
        console.warn(`Parallel Search API responded with status ${response.status}:`, errText);
        return {
          search_id: `parallel_failed_${Date.now()}`,
          results: [],
          providerStatus: "failed",
          errorDetails: `HTTP ${response.status}: ${errText}`,
          warnings: [`Parallel Search API HTTP ${response.status}: ${errText}`],
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Parallel Search API fetch error:", msg);
      return {
        search_id: `parallel_error_${Date.now()}`,
        results: [],
        providerStatus: "failed",
        errorDetails: msg,
        warnings: [`Parallel Search API network error: ${msg}`],
      };
    }
  }

  /**
   * Performs deep structured document extraction using Parallel Extract API v1 (/v1/extract)
   */
  async extract(options: ParallelExtractOptions): Promise<ParallelExtractResponse> {
    const key = this.apiKey || process.env.PARALLEL_API_KEY || null;
    if (!key) {
      console.warn("ParallelSearchClient.extract: No PARALLEL_API_KEY configured.");
      return {
        extract_id: `no_key_${Date.now()}`,
        results: [],
        providerStatus: "skipped_no_key",
        warnings: ["PARALLEL_API_KEY not configured"],
      };
    }

    const validUrls: string[] = [];
    for (const u of options.urls || []) {
      const safe = await validateSafeUrl(u);
      if (safe.valid) {
        validUrls.push(u);
      }
    }

    if (validUrls.length === 0) {
      return {
        extract_id: `empty_urls_${Date.now()}`,
        results: [],
        providerStatus: "succeeded",
        warnings: ["No safe URLs provided for extraction"],
      };
    }

    const maxPerResult = options.maxCharsPerResult || 8000;
    const body: Record<string, any> = {
      urls: validUrls,
      max_chars_total: maxPerResult * validUrls.length,
      advanced_settings: {
        excerpt_settings: {
          max_chars_per_result: maxPerResult,
        },
      },
    };

    if (options.objective) {
      body.objective = options.objective.slice(0, 1000);
    }
    if (options.sessionId) {
      body.session_id = options.sessionId;
    }

    try {
      const response = await fetch(`${this.baseUrl}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json()) as ParallelExtractResponse;
        data.providerStatus = "succeeded";
        // Map excerpts into markdown field for compatibility with downstream consumers
        for (const item of data.results || []) {
          if (!item.markdown && Array.isArray(item.excerpts) && item.excerpts.length > 0) {
            item.markdown = item.excerpts.join("\n\n");
          } else if (!item.markdown && item.full_content) {
            item.markdown = item.full_content;
          }
        }
        return data;
      } else {
        const errText = await response.text();
        console.warn(`Parallel Extract API responded with status ${response.status}:`, errText);
        return {
          extract_id: `extract_failed_${Date.now()}`,
          results: [],
          providerStatus: "failed",
          errorDetails: `HTTP ${response.status}: ${errText}`,
          warnings: [`Parallel Extract API HTTP ${response.status}: ${errText}`],
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Parallel Extract API fetch error:", msg);
      return {
        extract_id: `extract_error_${Date.now()}`,
        results: [],
        providerStatus: "failed",
        errorDetails: msg,
        warnings: [`Parallel Extract API network error: ${msg}`],
      };
    }
  }

  /**
   * Registers a living dossier monitor sensor using Parallel Monitor API v1 (/v1/monitors)
   */
  async createMonitor(options: ParallelMonitorOptions): Promise<ParallelMonitorResponse> {
    const key = this.apiKey || process.env.PARALLEL_API_KEY || null;
    if (!key) {
      console.warn("ParallelSearchClient.createMonitor: No PARALLEL_API_KEY configured.");
      return {
        monitor_id: `no_key_${Date.now()}`,
        status: "disabled",
        target_url: options.targetUrl,
        created_at: new Date().toISOString(),
        warnings: ["PARALLEL_API_KEY not configured"],
      };
    }

    const safe = await validateSafeUrl(options.targetUrl);
    if (!safe.valid) {
      return {
        monitor_id: `invalid_url_${Date.now()}`,
        status: "disabled",
        target_url: options.targetUrl,
        created_at: new Date().toISOString(),
        warnings: ["Target URL is unsafe or private"],
      };
    }

    const freq =
      options.frequency === "hourly" || options.frequency === "1h"
        ? "1h"
        : options.frequency === "weekly" || options.frequency === "1w"
          ? "1w"
          : "1d";

    const query =
      options.query || `${options.name} development financing production partners festival distribution rights`;

    const body = {
      name: options.name,
      type: "event_stream",
      frequency: freq,
      processor: "lite",
      settings: {
        query,
        include_backfill: false,
      },
      webhook: {
        url: options.webhookUrl,
        event_types: ["monitor.event.detected", "monitor.execution.completed", "monitor.execution.failed"],
      },
      webhook_url: options.webhookUrl,
      metadata: options.metadata || {},
    };

    try {
      const response = await fetch(`${this.baseUrl}/monitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json()) as ParallelMonitorResponse;
        return data;
      } else {
        const errText = await response.text();
        console.warn(`Parallel Monitor API responded with status ${response.status}:`, errText);
      }
    } catch (err) {
      console.warn("Parallel Monitor API fetch error:", err);
    }

    return {
      monitor_id: `monitor_disabled_${Date.now()}`,
      status: "disabled",
      target_url: options.targetUrl,
      created_at: new Date().toISOString(),
      warnings: ["Monitor registration failed or was unavailable."],
    };
  }

  /**
   * Validate returned URLs through SSRF Guard
   */
  private async sanitizeSearchResults(data: ParallelSearchResponse): Promise<ParallelSearchResponse> {
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
