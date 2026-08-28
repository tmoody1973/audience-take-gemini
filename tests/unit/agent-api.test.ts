import { describe, it, expect } from "vitest";
import { POST as nominateHandler } from "@/app/api/nominate/route";
import { POST as agentRunHandler, GET as agentGetHandler } from "@/app/api/agent/run/route";

describe("Scout Agent API End-to-End Handlers", () => {
  it("processes nomination intake and executes research run via API handlers", async () => {
    const uniqueUrl = `https://www.youtube.com/watch?v=s8G7425lfKs&t=${Date.now()}`;

    // 1. Submit Nomination
    const nomReq = new Request("http://localhost:3000/api/nominate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectUrl: uniqueUrl,
        nominatorRole: "fan",
        reason: "Exceptional indie animated project exploring rich urban mythology.",
        supportingLinks: [],
      }),
    });

    const nomRes = await nominateHandler(nomReq);
    const nomData = await nomRes.json();

    expect(nomRes.status).toBe(200);
    expect(nomData.success).toBe(true);
    expect(nomData.runId).toBeDefined();
    expect(nomData.projectId).toBeDefined();

    // 2. Query Initial Run State
    const getReq = new Request(`http://localhost:3000/api/agent/run?runId=${nomData.runId}`);
    const getRes = await agentGetHandler(getReq);
    const getData = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getData.run.currentStep).toBe("fetching");

    // 3. Trigger Agent Run Execution
    const runReq = new Request("http://localhost:3000/api/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: nomData.runId }),
    });

    const runRes = await agentRunHandler(runReq);
    const runData = await runRes.json();

    expect(runRes.status).toBe(200);
    expect(runData.success).toBe(true);
    expect(runData.run.currentStep).toBe("complete");
    expect(runData.run.progressPercent).toBe(100);
    expect(runData.run.cardId).toBeDefined();
  });
});
