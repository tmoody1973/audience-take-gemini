import { describe, it, expect, vi, beforeEach } from "vitest";
import { auditRecord, runLegacyAudit } from "../../scripts/audit-legacy-records";
import { GET } from "@/app/api/scout-briefs/[artifactId]/audio/route";
import { scoutBriefStore } from "@/services/scout-brief/store";
import { createWavHeader } from "@/services/scout-brief/audio-processor";
import { dataRepo } from "@/services/firestore-repo";
import fs from "fs";
import path from "path";

vi.mock("@/services/firestore-repo", () => ({
  dataRepo: {
    getProjectById: vi.fn(),
  },
}));

describe("Package R8: Legacy Corrections, Cross-Output Consistency & Acceptance Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("R8.1: Legacy audit dry-run flags manufactured URLs and future timestamps without modifying data", () => {
    const corruptRecord = {
      id: "card-legacy-corrupt",
      projectId: "proj-legacy",
      version: 1,
      evidenceLedger: [
        {
          id: "ev-placeholder",
          sourceUrl: "https://audiencetake.com/evidence/fake-citation",
          title: "Placeholder Evidence",
          publisher: "Audience Take",
          claimType: "observation",
          excerpt: "Fabricated excerpt",
          verified: true,
          retrievedAt: "2099-01-01T00:00:00Z", // Future date
        },
      ],
      decisionBrief: {
        triageSummary: "Project with feature rights unencumbered.",
        materialUncertainty: "Underlying rights and chain of title unconfirmed pending verification.",
      },
    };

    const candidate = auditRecord(corruptRecord, "test-file.json");
    expect(candidate).not.toBeNull();
    expect(candidate?.issues.some((i) => i.type === "manufactured_url")).toBe(true);
    expect(candidate?.issues.some((i) => i.type === "corrupt_or_future_timestamp")).toBe(true);
    expect(candidate?.issues.some((i) => i.type === "rights_contradiction")).toBe(true);
    expect(candidate?.proposedState).toBe("require_re_verification");
    expect(candidate?.reversiblePointerChanges[0].targetField).toBe("projects.proj-legacy.publishedCardId");
  });

  it("R8.2: Legacy audit produces a valid dry-run manifest file in contracts/", () => {
    const manifest = runLegacyAudit();
    expect(manifest.isDryRun).toBe(true);
    expect(manifest.totalRecordsAudited).toBeGreaterThan(0);
    expect(manifest.totalCandidatesFlagged).toBeGreaterThanOrEqual(0);

    const manifestPath = path.resolve(process.cwd(), "contracts/legacy-scout-card-audit-manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(content.isDryRun).toBe(true);
    expect(Array.isArray(content.candidates)).toBe(true);
  });

  it("R8.3: Audio briefing endpoint signals X-Audio-Stale: true when project is flagged audioStale", async () => {
    const pcm = Buffer.alloc(48000, 1);
    const header = createWavHeader(pcm.length, 24000);
    const wav = Buffer.concat([header, pcm]);
    scoutBriefStore.saveAudioBuffer("brief-stale-01", wav);

    await scoutBriefStore.saveScoutBrief({
      artifactId: "brief-stale-01",
      id: "brief-stale-01",
      projectId: "proj-stale-01",
      cardVersionId: "card-v1",
      variant: "pro",
      title: "Stale Audio Brief",
      summary: "Summary",
      transcript: "Transcript",
      status: "ready",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    vi.mocked(dataRepo.getProjectById).mockResolvedValue({
      id: "proj-stale-01",
      identity: {
        title: "Stale Project",
        normalizedUrl: "https://example.com",
        medium: "feature",
        currentStage: "concept",
        logline: "Logline",
        creators: [],
        originalUrl: "https://example.com",
      },
      publishedCardId: "card-v2", // Superseded!
      audioStale: true, // Flagged for regeneration
      nomination: {
        reason: "test",
        submittedByUid: "u1",
        nominatorRole: "fan",
        initialLinks: [],
        createdAt: new Date().toISOString(),
      },
      creatorClaim: { status: "unclaimed" },
      metrics: { watchCount: 0, payCount: 0, cityDemandCount: 0, backCount: 0, pathwayVotes: [0, 0, 0], cities: {} },
      publicationStatus: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = new Request("http://localhost:3000/api/scout-briefs/brief-stale-01/audio");
    const response = await GET(request, {
      params: Promise.resolve({ artifactId: "brief-stale-01" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Audio-Stale")).toBe("true");
    expect(response.headers.get("X-Audio-Card-Version")).toBe("card-v1");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");
  });

  it("R8.4: Audio briefing endpoint returns X-Audio-Stale: false for fresh active card versions", async () => {
    const pcm = Buffer.alloc(48000, 1);
    const header = createWavHeader(pcm.length, 24000);
    const wav = Buffer.concat([header, pcm]);
    scoutBriefStore.saveAudioBuffer("brief-fresh-01", wav);

    await scoutBriefStore.saveScoutBrief({
      artifactId: "brief-fresh-01",
      id: "brief-fresh-01",
      projectId: "proj-fresh-01",
      cardVersionId: "card-fresh-v1",
      variant: "discover",
      title: "Fresh Audio Brief",
      summary: "Summary",
      transcript: "Transcript",
      status: "ready",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    vi.mocked(dataRepo.getProjectById).mockResolvedValue({
      id: "proj-fresh-01",
      identity: {
        title: "Fresh Project",
        normalizedUrl: "https://example.com",
        medium: "feature",
        currentStage: "concept",
        logline: "Logline",
        creators: [],
        originalUrl: "https://example.com",
      },
      publishedCardId: "card-fresh-v1",
      audioStale: false,
      nomination: {
        reason: "test",
        submittedByUid: "u1",
        nominatorRole: "fan",
        initialLinks: [],
        createdAt: new Date().toISOString(),
      },
      creatorClaim: { status: "unclaimed" },
      metrics: { watchCount: 0, payCount: 0, cityDemandCount: 0, backCount: 0, pathwayVotes: [0, 0, 0], cities: {} },
      publicationStatus: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = new Request("http://localhost:3000/api/scout-briefs/brief-fresh-01/audio");
    const response = await GET(request, {
      params: Promise.resolve({ artifactId: "brief-fresh-01" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Audio-Stale")).toBe("false");
    expect(response.headers.get("X-Audio-Card-Version")).toBe("card-fresh-v1");
    expect(response.headers.get("Cache-Control")).toContain("public");
  });

  it("R8.5: Historical records remain byte-stable while corrections publish non-destructively", () => {
    // Audit verified that no existing fixture files or contract files are altered during audit
    const originalFixturePath = path.resolve(process.cwd(), "contracts/fixtures/junichiro-card.json");
    const originalContent = fs.readFileSync(originalFixturePath, "utf-8");
    const originalHash = require("crypto").createHash("sha256").update(originalContent).digest("hex");

    // Run audit
    runLegacyAudit();

    // Re-verify hash remains identical
    const afterContent = fs.readFileSync(originalFixturePath, "utf-8");
    const afterHash = require("crypto").createHash("sha256").update(afterContent).digest("hex");

    expect(afterHash).toBe(originalHash);
  });
});
