import { describe, it, expect } from "vitest";
import { dataRepo } from "@/services/firestore-repo";

describe("Firestore Repository & Pulse Engagement", () => {
  it("retrieves seeded projects and filters by medium", async () => {
    const all = await dataRepo.getProjects();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const shorts = await dataRepo.getProjects({ medium: "short" });
    expect(shorts.every((p) => p.identity.medium === "short")).toBe(true);

    const docs = await dataRepo.getProjects({ medium: "documentary" });
    expect(docs.every((p) => p.identity.medium === "documentary")).toBe(true);
  });

  it("handles atomic pulse commitments idempotently and non-negatively", async () => {
    const projectId = "proj-signal-in-the-pines";
    const uid = "test-fan-user-77";

    // Initial state
    const initial = await dataRepo.getProjectById(projectId);
    const initialWatch = initial!.metrics.watchCount;

    // 1. Toggle Watch ON
    const step1 = await dataRepo.updatePulseEngagement(projectId, uid, "toggle_watch");
    expect(step1.userRecord.watch).toBe(true);
    expect(step1.metrics.watchCount).toBe(initialWatch + 1);

    // 2. Toggle Watch OFF
    const step2 = await dataRepo.updatePulseEngagement(projectId, uid, "toggle_watch");
    expect(step2.userRecord.watch).toBe(false);
    expect(step2.metrics.watchCount).toBe(initialWatch);

    // 3. Set City Demand
    const step3 = await dataRepo.updatePulseEngagement(projectId, uid, "set_city", "Milwaukee");
    expect(step3.userRecord.city).toBe("Milwaukee");
    expect(step3.metrics.cities["Milwaukee"]).toBe(1);

    // 4. Vote on Pathway 0
    const step4 = await dataRepo.updatePulseEngagement(projectId, uid, "vote_pathway", undefined, 0);
    expect(step4.userRecord.votedPathwayIndex).toBe(0);

    // 5. Change vote to Pathway 1
    const step5 = await dataRepo.updatePulseEngagement(projectId, uid, "vote_pathway", undefined, 1);
    expect(step5.userRecord.votedPathwayIndex).toBe(1);

    // Invariant: Non-negative counts
    expect(step5.metrics.watchCount).toBeGreaterThanOrEqual(0);
    expect(step5.metrics.payCount).toBeGreaterThanOrEqual(0);
  });
});
