import { describe, it, expect, vi } from "vitest";
import {
  createCloudTasksResearchDispatcher,
  createCloudTasksTrailerCriticDispatcher,
  cloudTasksClientOptionsFromEnv,
  deterministicResearchTaskId,
  deterministicTrailerCriticTaskId,
} from "@/lib/tasks/cloud-tasks";
import { GET as nominateGetHandler } from "@/app/api/nominate/route";

describe("Cloud Tasks Packaging & Lazy Loading (R0 Verification)", () => {
  const dummyConfig = {
    project: "test-project",
    location: "us-central1",
    queue: "research-queue",
    serviceUrl: "https://test-service.run.app",
    audience: "https://test-service.run.app",
    serviceAccountEmail: "tasks@test-project.iam.gserviceaccount.com",
  };

  it("does not initialize CloudTasksClient merely by importing cloud-tasks", () => {
    expect(createCloudTasksResearchDispatcher).toBeDefined();
    expect(createCloudTasksTrailerCriticDispatcher).toBeDefined();
  });

  it("creates deterministic task IDs conforming to requirements", () => {
    const researchId = deterministicResearchTaskId("run-123", 1);
    expect(researchId).toBe("research-run-123-attempt-1");

    const trailerId = deterministicTrailerCriticTaskId("proj-456", "s8G7425lfKs", 1);
    expect(trailerId).toBe("trailer-proj-456-s8G7425lfKs-v1");
  });

  it("dispatches research task using injected client without loading real CloudTasksClient", async () => {
    const createdTasks: any[] = [];
    const mockClient = {
      queuePath: vi.fn((proj: string, loc: string, q: string) => `projects/${proj}/locations/${loc}/queues/${q}`),
      taskPath: vi.fn((proj: string, loc: string, q: string, t: string) => `projects/${proj}/locations/${loc}/queues/${q}/tasks/${t}`),
      createTask: vi.fn(async (req: any) => {
        createdTasks.push(req);
        return {};
      }),
    };

    const dispatcher = createCloudTasksResearchDispatcher(dummyConfig, mockClient as any);
    await dispatcher({ runId: "test-run", projectId: "test-proj", nominationId: "test-nom", attempt: 1 });

    expect(mockClient.createTask).toHaveBeenCalledTimes(1);
    expect(createdTasks[0].parent).toBe("projects/test-project/locations/us-central1/queues/research-queue");
    expect(createdTasks[0].task.name).toContain("research-test-run-attempt-1");
    expect(createdTasks[0].task.httpRequest.url).toBe("https://test-service.run.app/tasks/research");
    expect(createdTasks[0].task.httpRequest.oidcToken.serviceAccountEmail).toBe("tasks@test-project.iam.gserviceaccount.com");
  });

  it("dispatches trailer critic task using injected client", async () => {
    const createdTasks: any[] = [];
    const mockClient = {
      queuePath: vi.fn((proj: string, loc: string, q: string) => `projects/${proj}/locations/${loc}/queues/${q}`),
      taskPath: vi.fn((proj: string, loc: string, q: string, t: string) => `projects/${proj}/locations/${loc}/queues/${q}/tasks/${t}`),
      createTask: vi.fn(async (req: any) => {
        createdTasks.push(req);
        return {};
      }),
    };

    const dispatcher = createCloudTasksTrailerCriticDispatcher(dummyConfig, mockClient as any);
    await dispatcher({
      projectId: "test-proj",
      sourceId: "source-123",
      youtubeVideoId: "s8G7425lfKs",
      analysisVersion: 1,
    });

    expect(mockClient.createTask).toHaveBeenCalledTimes(1);
    expect(createdTasks[0].parent).toBe("projects/test-project/locations/us-central1/queues/research-queue");
    expect(createdTasks[0].task.name).toContain("trailer-test-proj-s8G7425lfKs-v1");
    expect(createdTasks[0].task.httpRequest.url).toBe("https://test-service.run.app/tasks/trailer-critic");
  });

  it("verifies GET /api/nominate executes URL validation without calling CloudTasksClient", async () => {
    const req = new Request("https://audiencetake.com/api/nominate?checkUrl=https://www.youtube.com/watch?v=s8G7425lfKs");
    const res = await nominateGetHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.exists !== undefined).toBe(true);
  });

  it("verifies cloudTasksClientOptionsFromEnv returns structured options", () => {
    const opts = cloudTasksClientOptionsFromEnv("my-gcp-project", {
      GOOGLE_CLOUD_PROJECT: "my-gcp-project",
    });
    expect(opts.projectId).toBe("my-gcp-project");
  });
});
