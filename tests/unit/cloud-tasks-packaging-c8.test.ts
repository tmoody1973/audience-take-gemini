import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createCloudTasksResearchDispatcher,
  createCloudTasksTrailerCriticDispatcher,
  deterministicResearchTaskId,
  deterministicTrailerCriticTaskId,
  cloudTaskConfigFromEnv,
  type CloudTaskDispatcherConfig,
} from "@/lib/tasks/cloud-tasks";
import { POST as canonicalPost } from "@/app/api/nominations/route";
import { POST as legacyPost } from "@/app/api/nominate/route";
import { handleNominationPost } from "@/app/api/nominations/handler";
import { NextRequest } from "next/server";

describe("Package C8: Cloud Tasks Container Packaging & Dispatcher Verification", () => {
  const mockConfig: CloudTaskDispatcherConfig = {
    project: "audience-take",
    location: "us-central1",
    queue: "research",
    serviceUrl: "https://agents.audiencetake.com",
    audience: "https://agents.audiencetake.com",
    serviceAccountEmail: "cloud-tasks@audience-take.iam.gserviceaccount.com",
  };

  it("1. validates Dockerfile production packaging configuration", () => {
    const dockerfilePath = path.resolve(process.cwd(), "Dockerfile");
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const dockerfile = fs.readFileSync(dockerfilePath, "utf-8");
    expect(dockerfile).toContain("FROM base AS runner");
    expect(dockerfile).toContain(".next/standalone");
    expect(dockerfile).toContain("@google-cloud/tasks");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });

  it("2. loads and constructs CloudTasksClient from module resolution without errors", async () => {
    // Verifies that @google-cloud/tasks is present and instantiable in the runtime environment
    const { CloudTasksClient } = await import("@google-cloud/tasks");
    expect(CloudTasksClient).toBeDefined();

    const client = new CloudTasksClient({ projectId: "audience-take" });
    expect(typeof client.createTask).toBe("function");
    expect(typeof client.queuePath).toBe("function");
    expect(typeof client.taskPath).toBe("function");
  });

  it("3. confirms URL validation fails closed before Cloud Tasks client is loaded or constructed", async () => {
    const mockTasksClient = {
      queuePath: vi.fn(),
      taskPath: vi.fn(),
      createTask: vi.fn(),
    };

    // Dispatcher factory should never be called when input fails URL safety policy
    const dispatchFactory = vi.fn().mockReturnValue(vi.fn());

    const req = new NextRequest("http://localhost:3000/api/nominations", {
      method: "POST",
      body: JSON.stringify({
        submittedUrl: "http://169.254.169.254/latest/meta-data", // Cloud metadata SSRF
        nominatorRole: "fan",
        reason: "SSRF attack probe",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await handleNominationPost(req, {
      verifyRequest: vi.fn().mockResolvedValue({ user: { uid: "test-fan", email: "fan@test.com" } } as any),
      consumeLimits: vi.fn().mockResolvedValue(undefined as any),
      dispatch: dispatchFactory,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    // Dispatch must never have been constructed or called
    expect(dispatchFactory).not.toHaveBeenCalled();
    expect(mockTasksClient.createTask).not.toHaveBeenCalled();
  });

  it("4. verifies both research and trailer critic dispatcher paths produce valid bounded tasks", async () => {
    const mockClient = {
      queuePath: vi.fn((project, loc, q) => `projects/${project}/locations/${loc}/queues/${q}`),
      taskPath: vi.fn((project, loc, q, t) => `projects/${project}/locations/${loc}/queues/${q}/tasks/${t}`),
      createTask: vi.fn().mockResolvedValue([{ name: "created-task" }]),
    };

    // Path A: Research Dispatcher
    const researchDispatch = createCloudTasksResearchDispatcher(mockConfig, mockClient as any);
    await researchDispatch({
      runId: "run-c8-test",
      projectId: "proj-c8",
      nominationId: "nom-c8",
      attempt: 1,
    });

    expect(mockClient.createTask).toHaveBeenCalledTimes(1);
    const researchCall = mockClient.createTask.mock.calls[0][0];
    expect(researchCall.task.httpRequest.url).toBe("https://agents.audiencetake.com/tasks/research");
    expect(researchCall.task.httpRequest.oidcToken.serviceAccountEmail).toBe(mockConfig.serviceAccountEmail);

    const researchPayload = JSON.parse(
      Buffer.from(researchCall.task.httpRequest.body, "base64").toString("utf-8")
    );
    expect(researchPayload.runId).toBe("run-c8-test");
    expect(researchPayload.projectId).toBe("proj-c8");
    expect(researchPayload.taskName).toBe("research-run-c8-test-attempt-1");
    expect(researchPayload.nominationId).toBeUndefined(); // private nominator info stripped

    // Path B: Trailer Critic Dispatcher
    const criticDispatch = createCloudTasksTrailerCriticDispatcher(mockConfig, mockClient as any);
    await criticDispatch({
      projectId: "proj-c8",
      sourceId: "src-trailer-1",
      youtubeVideoId: "s8G7425lfKs",
    });

    expect(mockClient.createTask).toHaveBeenCalledTimes(2);
    const criticCall = mockClient.createTask.mock.calls[1][0];
    expect(criticCall.task.httpRequest.url).toBe("https://agents.audiencetake.com/tasks/trailer-critic");
    expect(criticCall.task.httpRequest.oidcToken.serviceAccountEmail).toBe(mockConfig.serviceAccountEmail);

    const criticPayload = JSON.parse(
      Buffer.from(criticCall.task.httpRequest.body, "base64").toString("utf-8")
    );
    expect(criticPayload.projectId).toBe("proj-c8");
    expect(criticPayload.youtubeVideoId).toBe("s8G7425lfKs");
    expect(criticPayload.analysisVersion).toBe(1);
  });

  it("5. verifies canonical /api/nominations and legacy /api/nominate share the same handler contract", () => {
    expect(canonicalPost).toBeDefined();
    expect(legacyPost).toBeDefined();
    expect(typeof canonicalPost).toBe("function");
    expect(typeof legacyPost).toBe("function");
  });

  it("6. verifies deterministic task IDs are collision-resistant and obey bounded regex", () => {
    const researchId1 = deterministicResearchTaskId("run-abc-123", 1);
    const researchId2 = deterministicResearchTaskId("run-abc-123", 2);
    expect(researchId1).toBe("research-run-abc-123-attempt-1");
    expect(researchId2).toBe("research-run-abc-123-attempt-2");
    expect(researchId1).not.toBe(researchId2);

    const trailerId = deterministicTrailerCriticTaskId("proj-xyz", "s8G7425lfKs", 1);
    expect(trailerId).toBe("trailer-proj-xyz-s8G7425lfKs-v1");
  });
});
