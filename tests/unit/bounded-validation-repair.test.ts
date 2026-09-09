import { describe, it, expect } from "vitest";
import { validateScoutProposal } from "@/agent/deterministic-validator";
import { repairScoutProposal } from "@/agent/proposal-repair";
import { validSciFiShortProposal } from "../fixtures/sample-proposals";

describe("Bounded Validation Repair Loop", () => {
  it("repairs ungrounded budget assertion and ungrounded buyer claim from Tenchi Galaxy scenario", () => {
    const rawProposal = {
      ...validSciFiShortProposal,
      projectTitle: "Tenchi Galaxy Anime Pilot",
      whyScouted:
        "Tenchi Galaxy is an exciting anime pilot with ambitious hand-drawn visuals. The team is aiming for a $1 million budget through crowdfunding.",
      pathways: [
        {
          ...validSciFiShortProposal.pathways[0],
          title: "Streaming Pilot Pitch",
          mediumFitRationale: "Pitching to Netflix to gauge series acquisition and platform interest.",
        },
        validSciFiShortProposal.pathways[1],
        validSciFiShortProposal.pathways[2],
      ] as [any, any, any],
    };

    // 1. Validate raw proposal — MUST fail due to ungrounded $1 million and Netflix acquisition
    const initialResult = validateScoutProposal(rawProposal);
    expect(initialResult.valid).toBe(false);
    expect(initialResult.errors.some((e) => e.includes("Ungrounded budget or financial assertion"))).toBe(true);
    expect(initialResult.errors.some((e) => e.includes("buyer claim detected") || e.includes("market hype"))).toBe(true);

    // 2. Perform bounded repair
    const repairOutcome = repairScoutProposal(rawProposal, initialResult.errors);
    expect(repairOutcome.repaired).toBe(true);
    expect(repairOutcome.actionsTaken.length).toBeGreaterThan(0);

    // Verify sanitized content
    const repaired = repairOutcome.proposal;
    expect(repaired.whyScouted).not.toContain("$1 million");
    expect(repaired.pathways[0].mediumFitRationale).not.toContain("Netflix");
    expect(repaired.whatWereChecking.some((item: string) => item.includes("Budget claims pending verified documentation"))).toBe(true);
    expect(repaired.whatWereChecking.some((item: string) => item.includes("Buyer and platform acquisition claims pending"))).toBe(true);

    // 3. Re-validate repaired proposal — MUST pass deterministically!
    const revalidatedResult = validateScoutProposal(repaired);
    expect(revalidatedResult.valid).toBe(true);
    expect(revalidatedResult.sanitizedCard).toBeDefined();
    expect(revalidatedResult.sanitizedCard?.whyScouted).not.toContain("$1 million");
    expect(revalidatedResult.sanitizedCard?.pathways[0].mediumFitRationale).not.toContain("Netflix");
  });

  it("repairs ungrounded awards and talent attachments cleanly", () => {
    const rawProposal = {
      ...validSciFiShortProposal,
      whyScouted: "The production won the grand jury prize at Sundance. Florence Pugh is attached to star in the film.",
    };

    const initialResult = validateScoutProposal(rawProposal);
    expect(initialResult.valid).toBe(false);
    expect(initialResult.errors.some((e) => e.includes("Ungrounded award or festival claim"))).toBe(true);
    expect(initialResult.errors.some((e) => e.includes("Ungrounded talent or cast attachment"))).toBe(true);

    const repairOutcome = repairScoutProposal(rawProposal, initialResult.errors);
    expect(repairOutcome.repaired).toBe(true);

    const revalidated = validateScoutProposal(repairOutcome.proposal);
    expect(revalidated.valid).toBe(true);
    expect(revalidated.sanitizedCard).toBeDefined();
    expect(revalidated.sanitizedCard?.whyScouted).not.toContain("Sundance");
    expect(revalidated.sanitizedCard?.whyScouted).not.toContain("Florence Pugh");
  });

  it("truthfully maps failed stage and preserves completed stages in runStateToSnapshot", async () => {
    const { runStateToSnapshot } = await import("@/features/research-progress/research-progress");

    const failedValidationRun = {
      id: "run-tenchi-test",
      projectId: "proj-tenchi",
      currentStep: "failed",
      errorMessage: "Deterministic validation failed: Ungrounded budget or financial assertion",
      stepLogs: [
        { step: "intake", message: "Nomination accepted.", status: "done" },
        { step: "fetching", message: "Fetched source.", status: "done" },
        { step: "classifying", message: "Classified medium.", status: "done" },
        { step: "synthesizing", message: "Synthesized pathways.", status: "done" },
        { step: "validating", message: "Validating proposal...", status: "in_progress" },
        { step: "failed", message: "Agent run halted.", status: "error" },
      ],
    };

    const snapshot = runStateToSnapshot(failedValidationRun);
    expect(snapshot.run.status).toBe("failed");
    // Must NOT reset to Stage 1! Must truthfully show Stage 6 ("Publishing card" / validation) as failed
    expect(snapshot.run.currentStage).toBe(6);
    // Stages 1, 2, 3, 4, 5 were completed prior to stage 6 failure
    expect(snapshot.run.completedStages).toEqual([1, 2, 3, 4, 5]);
    expect(snapshot.run.retryEligible).toBe(true);
    expect(snapshot.run.publicFailureMessage).toBe(
      "Deterministic validation failed: Ungrounded budget or financial assertion"
    );
  });

  it("truthfully maps mid-run failures (e.g. stage 3 fetch failure) without jumping to stage 1 or 6", async () => {
    const { runStateToSnapshot } = await import("@/features/research-progress/research-progress");

    const failedFetchRun = {
      id: "run-fetch-fail",
      projectId: "proj-fetch",
      currentStep: "failed",
      errorMessage: "Network timeout fetching source URL",
      stepLogs: [
        { step: "intake", message: "Nomination accepted.", status: "done" },
        { step: "fetching", message: "Fetching public source...", status: "in_progress" },
        { step: "failed", message: "Agent run halted.", status: "error" },
      ],
    };

    const snapshot = runStateToSnapshot(failedFetchRun);
    expect(snapshot.run.status).toBe("failed");
    expect(snapshot.run.currentStage).toBe(3);
    expect(snapshot.run.completedStages).toEqual([1, 2]);
    expect(snapshot.run.retryEligible).toBe(true);
    expect(snapshot.run.publicFailureMessage).toBe("Network timeout fetching source URL");
  });
});
