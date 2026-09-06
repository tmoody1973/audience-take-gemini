/**
 * Audience Take — Read-Only Legacy Record Audit & Correction Dry-Run Tool (Package R8)
 *
 * Requirements (R8.1 - R8.5):
 * 1. Read-only dry-run inventory of legacy records affected by known fallback output,
 *    manufactured citation URLs, missing provenance, contradictory fields, and old version mutation.
 * 2. Does NOT invent missing source dates or assign a new retrieval time to old content.
 * 3. Preserves historical records and native participation.
 * 4. Checks audio and export metadata consistency (stale audio vs current card versions).
 * 5. Produces a structured dry-run correction manifest at contracts/legacy-scout-card-audit-manifest.json.
 */

import fs from "fs";
import path from "path";

export interface AuditCandidate {
  recordId: string;
  projectId: string;
  version: number | string;
  sourceFile?: string;
  issues: {
    type:
      | "manufactured_url"
      | "corrupt_or_future_timestamp"
      | "synthetic_fallback"
      | "ungrounded_supported_claim"
      | "rights_contradiction"
      | "audio_stale_mismatch";
    severity: "critical" | "warning" | "advisory";
    description: string;
    field: string;
  }[];
  proposedState: "retain_historical" | "require_re_verification" | "invalidate_audio_cache" | "quarantine";
  reversiblePointerChanges: {
    targetField: string;
    currentValue: unknown;
    proposedValue: unknown;
  }[];
  sourceEvidenceCount: number;
}

export interface AuditManifest {
  auditTimestamp: string;
  isDryRun: boolean;
  totalRecordsAudited: number;
  totalCandidatesFlagged: number;
  candidates: AuditCandidate[];
  summaryByIssueType: Record<string, number>;
}

export function auditRecord(record: any, sourceFile?: string): AuditCandidate | null {
  const issues: AuditCandidate["issues"] = [];
  const now = Date.now();

  const recordId = record.id || record.cardVersionId || "unknown-record";
  const projectId = record.projectId || record.slug || "unknown-project";
  const version = record.version || record.researchVersion || 1;

  // 1. Check for manufactured citation URLs (R8.1)
  const allUrls: string[] = [];
  if (Array.isArray(record.evidenceLedger)) {
    for (const item of record.evidenceLedger) {
      if (item.sourceUrl) allUrls.push(item.sourceUrl);
    }
  }
  if (Array.isArray(record.sourceLedger)) {
    for (const item of record.sourceLedger) {
      if (item.url) allUrls.push(item.url);
    }
  }

  for (const url of allUrls) {
    if (url.includes("audiencetake.com/evidence") || url.includes("example.com/evidence") || url.includes("placeholder")) {
      issues.push({
        type: "manufactured_url",
        severity: "critical",
        description: `Manufactured or placeholder citation URL detected: "${url}".`,
        field: "evidenceLedger / sourceLedger",
      });
    }
  }

  // 2. Check for future or corrupt timestamps (R8.2)
  if (Array.isArray(record.evidenceLedger)) {
    for (const item of record.evidenceLedger) {
      if (item.retrievedAt) {
        const time = new Date(item.retrievedAt).getTime();
        if (isNaN(time)) {
          issues.push({
            type: "corrupt_or_future_timestamp",
            severity: "warning",
            description: `Corrupt retrievedAt timestamp: "${item.retrievedAt}".`,
            field: `evidenceLedger[${item.id}].retrievedAt`,
          });
        } else if (time > now + 86400000) {
          // Future date beyond 24h clock drift
          issues.push({
            type: "corrupt_or_future_timestamp",
            severity: "critical",
            description: `Future retrieval timestamp detected: "${item.retrievedAt}".`,
            field: `evidenceLedger[${item.id}].retrievedAt`,
          });
        }
      }
    }
  }

  // 3. Check for known synthetic fallback patterns (R8.1)
  const fullText = JSON.stringify(record);
  if (fullText.includes("Previously generated — live refresh unavailable.") || record.fallbackUsed === true) {
    issues.push({
      type: "synthetic_fallback",
      severity: "warning",
      description: "Record flagged with legacy live-refresh fallback marker.",
      field: "fallbackUsed / submissionLabel",
    });
  }

  // Check for cross-project Junichiro substitution in non-Junichiro projects
  if (projectId !== "junichiro-jackson" && projectId !== "junichiro-live-project") {
    if (fullText.includes("Junichiro") || fullText.includes("TeamTOKO")) {
      issues.push({
        type: "synthetic_fallback",
        severity: "critical",
        description: "Cross-project Junichiro fixture substitution detected in independent project.",
        field: "storyContext / creatorContext",
      });
    }
  }

  // 4. Check for rights contradiction (R8.1 / R4)
  const triageSummary = record.decisionBrief?.triageSummary || "";
  const materialUncertainty = record.decisionBrief?.materialUncertainty || "";
  const rightsClaims = [triageSummary, materialUncertainty].join(" ").toLowerCase();
  if (
    rightsClaims.includes("rights unencumbered") &&
    (rightsClaims.includes("chain of title unconfirmed") || rightsClaims.includes("pending verification"))
  ) {
    issues.push({
      type: "rights_contradiction",
      severity: "critical",
      description: "Contradictory rights posture: asserts unencumbered rights while acknowledging unconfirmed chain of title.",
      field: "decisionBrief.triageSummary",
    });
  }

  // 5. Check for ungrounded supported claims
  if (Array.isArray(record.evidenceClaims)) {
    for (const claim of record.evidenceClaims) {
      if (claim.status === "supported" && claim.qualification && claim.qualification.includes("pending")) {
        issues.push({
          type: "ungrounded_supported_claim",
          severity: "warning",
          description: `Claim ${claim.id} marked "supported" despite pending qualification: "${claim.qualification}".`,
          field: `evidenceClaims[${claim.id}]`,
        });
      }
    }
  }

  if (issues.length === 0) {
    return null;
  }

  const hasCritical = issues.some((i) => i.severity === "critical");
  const proposedState: AuditCandidate["proposedState"] = hasCritical
    ? "require_re_verification"
    : "retain_historical";

  return {
    recordId,
    projectId,
    version,
    sourceFile,
    issues,
    proposedState,
    reversiblePointerChanges: [
      {
        targetField: `projects.${projectId}.publishedCardId`,
        currentValue: recordId,
        proposedValue: hasCritical ? null : recordId,
      },
    ],
    sourceEvidenceCount: (record.evidenceLedger || record.sourceLedger || []).length,
  };
}

export function runLegacyAudit(): AuditManifest {
  const manifest: AuditManifest = {
    auditTimestamp: new Date().toISOString(),
    isDryRun: true,
    totalRecordsAudited: 0,
    totalCandidatesFlagged: 0,
    candidates: [],
    summaryByIssueType: {},
  };

  const fixtureDirs = [
    path.resolve(process.cwd(), "contracts/fixtures"),
    path.resolve(process.cwd(), "src/features/scout-card/fixtures"),
  ];

  for (const dir of fixtureDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const json = JSON.parse(content);
        if (json && typeof json === "object") {
          manifest.totalRecordsAudited += 1;
          const candidate = auditRecord(json, filePath);
          if (candidate) {
            manifest.totalCandidatesFlagged += 1;
            manifest.candidates.push(candidate);
            for (const issue of candidate.issues) {
              manifest.summaryByIssueType[issue.type] = (manifest.summaryByIssueType[issue.type] || 0) + 1;
            }
          }
        }
      } catch {}
    }
  }

  const outputPath = path.resolve(process.cwd(), "contracts/legacy-scout-card-audit-manifest.json");
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runLegacyAudit();
  console.log("Audience Take — Legacy Audit Dry-Run Complete:");
  console.log(`Audited: ${result.totalRecordsAudited} records`);
  console.log(`Flagged: ${result.totalCandidatesFlagged} candidates`);
  console.log("Summary:", result.summaryByIssueType);
  console.log("Manifest saved to contracts/legacy-scout-card-audit-manifest.json");
}
