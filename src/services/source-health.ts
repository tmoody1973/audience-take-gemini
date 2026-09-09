/**
 * Audience Take — Source Health & Reachability Verification Service
 * 
 * Performs bounded HTTP inspection, SSRF-guarded redirect validation,
 * soft-404 detection, and distinct timeout / restricted / not_found classification.
 */

import { createHash } from "node:crypto";
import { validateSafeUrl } from "@/services/ssrf-guard";
import { detectBoilerplateOrSoftError, type SourceHealthState } from "@/domain/evidence-policy";

export interface SourceHealthResult {
  url: string;
  finalUrl: string;
  state: SourceHealthState;
  httpStatus?: number;
  checkedAt: string;
  contentSnippet?: string;
  errorDetail?: string;
  contentHash?: string;
}

export async function checkSourceHealth(
  rawUrl: string,
  options: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<SourceHealthResult> {
  const { timeoutMs = 5000, maxBytes = 256 * 1024 } = options;
  const now = new Date().toISOString();

  // 1. SSRF and protocol check
  const safetyCheck = await validateSafeUrl(rawUrl);
  if (!safetyCheck.valid) {
    return {
      url: rawUrl,
      finalUrl: rawUrl,
      state: "restricted",
      checkedAt: now,
      errorDetail: safetyCheck.error || "SSRF or forbidden host blocked.",
    };
  }

  const targetUrl = safetyCheck.normalizedUrl || rawUrl;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AudienceTake-ScoutVerifier/1.0 (+https://audiencetake.com/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    const finalUrl = response.url || targetUrl;

    // Validate redirect destination is safe
    if (finalUrl !== targetUrl) {
      const redirectSafety = await validateSafeUrl(finalUrl);
      if (!redirectSafety.valid) {
        return {
          url: rawUrl,
          finalUrl,
          state: "restricted",
          httpStatus: response.status,
          checkedAt: now,
          errorDetail: "Redirected to forbidden or internal destination.",
        };
      }
    }

    if (response.status === 404 || response.status === 410) {
      return {
        url: rawUrl,
        finalUrl,
        state: "not_found",
        httpStatus: response.status,
        checkedAt: now,
        errorDetail: `HTTP status ${response.status} Not Found.`,
      };
    }

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return {
        url: rawUrl,
        finalUrl,
        state: "restricted",
        httpStatus: response.status,
        checkedAt: now,
        errorDetail: `HTTP status ${response.status} Access Restricted or Rate Limited.`,
      };
    }

    if (!response.ok) {
      return {
        url: rawUrl,
        finalUrl,
        state: "fetch_error",
        httpStatus: response.status,
        checkedAt: now,
        errorDetail: `HTTP error ${response.status} ${response.statusText}.`,
      };
    }

    // Read bounded content snippet to detect soft-404
    const textBuffer = await response.text();
    const truncated = textBuffer.slice(0, maxBytes);
    const contentHash = createHash("sha256").update(truncated).digest("hex");

    // Extract title if HTML
    const titleMatch = truncated.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    const { isSoftError, reason } = detectBoilerplateOrSoftError(truncated.slice(0, 1000), title);
    if (isSoftError) {
      return {
        url: rawUrl,
        finalUrl,
        state: "soft_error",
        httpStatus: response.status,
        checkedAt: now,
        contentHash,
        contentSnippet: truncated.slice(0, 300),
        errorDetail: reason || "Page returned HTTP 200 with soft-404 or missing content template.",
      };
    }

    return {
      url: rawUrl,
      finalUrl,
      state: "available",
      httpStatus: response.status,
      checkedAt: now,
      contentHash,
      contentSnippet: truncated.slice(0, 500),
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = (err as Error)?.name === "AbortError";
    return {
      url: rawUrl,
      finalUrl: targetUrl,
      state: isAbort ? "timed_out" : "fetch_error",
      checkedAt: now,
      errorDetail: isAbort
        ? `Request timed out after ${timeoutMs}ms.`
        : (err as Error)?.message || "Network request failed.",
    };
  }
}
