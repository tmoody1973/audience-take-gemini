import { ParallelSearchClient } from "@/services/parallel-client";
import type {
  Currency,
  LineItemCategory,
  ProductionTechnique,
  RateUnit,
} from "@/features/production-scenarios/types";

export interface BenchmarkSnapshot {
  id: string;
  category: LineItemCategory;
  technique: ProductionTechnique;
  label: string;
  sourceUrl: string;
  passage: string;
  publisher: string;
  effectiveDate: string;
  retrievedAt: string;
  geography: string;
  currency: Currency;
  rateUnit: RateUnit;
  indicatedRate: { low: number; base: number; high: number };
  inclusions: string[];
  exclusions: string[];
  applicabilityAssessment: string;
  status: "candidate" | "assessed" | "stale";
}

export interface BenchmarkSearchOptions {
  technique: ProductionTechnique;
  targetFormat: string;
  missingCategory: LineItemCategory;
  projectTitle?: string;
  geography?: string;
  maxSearches?: number;
}

/**
 * Benchmark Research Service
 * 
 * Integrates with Parallel Search and Extract with strict budget limits
 * to find decision-relevant rate cards and production disclosures.
 */
export class BenchmarkService {
  private parallelClient: ParallelSearchClient;

  constructor(apiKey?: string | null) {
    this.parallelClient = new ParallelSearchClient(apiKey || undefined);
  }

  /**
   * Searches for public benchmark evidence candidates for a missing cost category.
   * Hard limits: max 2 searches, max 4 extracts.
   */
  async searchBenchmarks(
    options: BenchmarkSearchOptions
  ): Promise<BenchmarkSnapshot[]> {
    const {
      technique,
      targetFormat,
      missingCategory,
      geography = "US",
      maxSearches = 2,
    } = options;

    const query = `${technique.replace("_", " ")} ${targetFormat.replace("_", " ")} ${missingCategory.replace("_", " ")} production budget guidance rate card ${geography}`;

    try {
      const searchRes = await this.parallelClient.search({
        objective: `Discover public rate cards or budget templates for ${technique} ${targetFormat} ${missingCategory}`,
        search_queries: [query].slice(0, maxSearches),
        mode: "fast",
        maxResults: 4,
      });

      if (!searchRes.results || searchRes.results.length === 0) {
        return [];
      }

      const snapshots: BenchmarkSnapshot[] = [];

      for (let i = 0; i < Math.min(searchRes.results.length, 4); i++) {
        const item = searchRes.results[i];
        const excerpt = item.excerpts?.[0] || "";

        snapshots.push({
          id: `bm-${technique}-${missingCategory}-${i + 1}`,
          category: missingCategory,
          technique,
          label: item.title || `${technique} Benchmark Candidate`,
          sourceUrl: item.url,
          passage: excerpt,
          publisher: new URL(item.url).hostname.replace(/^www\./, ""),
          effectiveDate: item.publish_date || new Date().toISOString().slice(0, 10),
          retrievedAt: new Date().toISOString(),
          geography,
          currency: "USD",
          rateUnit: "fixed",
          indicatedRate: { low: 0, base: 0, high: 0 },
          inclusions: [],
          exclusions: [],
          applicabilityAssessment: `Candidate extracted from ${new URL(item.url).hostname}. Requires professional review before applying to live scenario.`,
          status: "candidate",
        });
      }

      return snapshots;
    } catch (err) {
      console.warn("BenchmarkService: Parallel search encountered error or missing key:", err);
      return [];
    }
  }

  /**
   * Assesses a benchmark against a saved scenario to detect stale evidence.
   */
  checkStaleSnapshot(
    snapshot: BenchmarkSnapshot,
    cardVersionId: string,
    scenarioCardVersionId: string
  ): { isStale: boolean; reason?: string } {
    if (cardVersionId !== scenarioCardVersionId) {
      return {
        isStale: true,
        reason: `Scout card evidence version advanced from ${scenarioCardVersionId} to ${cardVersionId}. Re-audit assumptions against current research.`,
      };
    }
    return { isStale: false };
  }
}
