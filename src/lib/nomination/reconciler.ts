import type { NominationStore, PendingDispatchRun } from "./store";
import type { ResearchDispatcher } from "./service";

export type ReconcileOptions = {
  maxAttempts?: number;
  now?: () => number;
};

export type ReconcileSummary = {
  scanned: number;
  dispatched: string[];
  failedTerminal: string[];
  retriedLater: string[];
};

export async function reconcilePendingDispatches(
  dependencies: {
    store: NominationStore;
    dispatcher: ResearchDispatcher;
  },
  options: ReconcileOptions = {}
): Promise<ReconcileSummary> {
  const maxAttempts = options.maxAttempts ?? 3;
  const summary: ReconcileSummary = {
    scanned: 0,
    dispatched: [],
    failedTerminal: [],
    retriedLater: [],
  };

  if (!dependencies.store.getPendingOrRetryableRuns) {
    return summary;
  }

  const runs: PendingDispatchRun[] = await dependencies.store.getPendingOrRetryableRuns();
  summary.scanned = runs.length;

  for (const run of runs) {
    const currentAttempt = run.attempt || 1;
    if (currentAttempt >= maxAttempts) {
      // Retries already exhausted
      const terminalReason = `Automatic dispatch retries exhausted (${currentAttempt}/${maxAttempts} attempts).`;
      if (dependencies.store.markTerminalDispatchFailure) {
        await dependencies.store.markTerminalDispatchFailure(run.runId, terminalReason);
      }
      summary.failedTerminal.push(run.runId);
      continue;
    }

    const nextAttempt = currentAttempt + 1;
    const taskName = `research-${run.runId}-attempt-${nextAttempt}`;
    try {
      await dependencies.dispatcher({
        runId: run.runId,
        projectId: run.projectId,
        nominationId: run.nominationId,
        attempt: nextAttempt,
      });
      await dependencies.store.markDispatched(run.runId, taskName);
      summary.dispatched.push(run.runId);
    } catch (dispatchError: unknown) {
      const errorMsg = dispatchError instanceof Error ? dispatchError.message : String(dispatchError);
      if (nextAttempt >= maxAttempts) {
        const terminalReason = `Dispatch failed on final attempt (${nextAttempt}/${maxAttempts}): ${errorMsg}`;
        if (dependencies.store.markTerminalDispatchFailure) {
          await dependencies.store.markTerminalDispatchFailure(run.runId, terminalReason);
        }
        summary.failedTerminal.push(run.runId);
      } else {
        const retryReason = `Dispatch retry attempt ${nextAttempt} failed: ${errorMsg}. Queued for next recovery window.`;
        if (dependencies.store.recordDispatchRetry) {
          await dependencies.store.recordDispatchRetry(run.runId, nextAttempt, retryReason);
        }
        summary.retriedLater.push(run.runId);
      }
    }
  }

  return summary;
}
