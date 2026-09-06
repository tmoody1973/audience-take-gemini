import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { createSocialStore, takeUpvoteId, SocialError } from "@/lib/social/store";
import { POST, DELETE } from "@/app/api/takes/[takeId]/upvote/route";
import { ScoutSocialPanel } from "@/features/social/scout-social-panel";
import { getScoutCardFixture } from "@/features/scout-card/data";
import * as socialRoute from "@/lib/social/route";
import { RATE_LIMITS } from "@/lib/trust/rate-limit";

const mocks = vi.hoisted(() => ({
  socialCommand: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({ hasFirebaseClientConfig: () => true }));
vi.mock("@/lib/firebase/client", () => ({
  getClientAuth: () => ({}),
  getClientFirestore: () => ({}),
}));
vi.mock("@/features/social/client", () => ({ socialCommand: mocks.socialCommand }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: { uid: string } | null) => void) => {
    callback({ uid: "fan-1" });
    return vi.fn();
  },
}));

vi.mock("firebase/firestore", () => ({
  collection: (...parts: unknown[]) => ({ kind: "collection", parts }),
  doc: (...parts: unknown[]) => ({ kind: "doc", parts, id: parts[parts.length - 1] }),
  query: (col: any) => col,
  where: () => ({}),
  onSnapshot: (ref: any, callback: (snapshot: any) => void) => {
    if (ref?.parts?.includes("projects")) {
      callback({
        data: () => ({ takeCount: 2, demoTakeCount: 0 }),
      });
    } else if (ref?.parts?.includes("takes")) {
      callback({
        docs: [
          {
            id: "take-low",
            data: () => ({
              id: "take-low",
              projectId: "proj-1",
              uid: "fan-low",
              displayName: "Low Signal Scout",
              whyItShouldGrow: "Take with 2 upvotes",
              upvoteCount: 2,
              active: true,
              replyCount: 0,
            }),
          },
          {
            id: "take-high",
            data: () => ({
              id: "take-high",
              projectId: "proj-1",
              uid: "fan-high",
              displayName: "High Signal Scout",
              whyItShouldGrow: "Take with 10 upvotes",
              upvoteCount: 10,
              active: true,
              replyCount: 0,
            }),
          },
        ],
      });
    } else if (ref?.parts?.includes("takeUpvotes")) {
      const docId = ref?.parts?.[ref.parts.length - 1];
      callback({
        data: () => ({
          active: docId === "take-high_fan-1",
        }),
      });
    } else {
      callback({
        data: () => ({}),
        docs: [],
      });
    }
    return vi.fn();
  },
}));

afterEach(() => {
  cleanup();
  mocks.socialCommand.mockReset();
});

function createMockDb(initial: {
  projects?: Record<string, any>;
  takes?: Record<string, any>;
  takeUpvotes?: Record<string, any>;
} = {}) {
  const collections: Record<string, Map<string, any>> = {
    projects: new Map(Object.entries(initial.projects ?? {})),
    takes: new Map(Object.entries(initial.takes ?? {})),
    takeUpvotes: new Map(Object.entries(initial.takeUpvotes ?? {})),
  };

  const getDoc = (colName: string, id: string) => {
    const col = collections[colName];
    const data = col ? col.get(id) : undefined;
    return {
      id,
      exists: data !== undefined,
      data: () => (data ? { ...data } : undefined),
    };
  };

  const setDoc = (colName: string, id: string, data: any, options?: { merge?: boolean }) => {
    if (!collections[colName]) collections[colName] = new Map();
    const col = collections[colName];
    if (options?.merge && col.has(id)) {
      col.set(id, { ...col.get(id), ...data });
    } else {
      col.set(id, { ...data });
    }
  };

  const makeDocRef = (colName: string, id: string) => ({
    id,
    get: async () => getDoc(colName, id),
    set: async (data: any, options?: any) => setDoc(colName, id, data, options),
  });

  const db: any = {
    collection: (colName: string) => ({
      doc: (id: string) => makeDocRef(colName, id),
      where: () => ({
        limit: () => ({
          get: async () => ({ empty: true, docs: [] }),
        }),
      }),
    }),
    runTransaction: async (cb: (tx: any) => Promise<any>) => {
      const tx = {
        get: async (ref: any) => {
          if (ref && typeof ref.get === "function") return ref.get();
          return { exists: false, data: () => undefined };
        },
        set: (ref: any, data: any, options?: any) => ref.set(data, options),
        update: (ref: any, data: any) => ref.set(data, { merge: true }),
      };
      return cb(tx);
    },
    _collections: collections,
  };

  return { db, collections };
}

describe("Take Upvoting Store", () => {
  it("exports takeUpvoteId helper formatted as `${takeId}_${uid}`", () => {
    expect(takeUpvoteId("take-123", "user-456")).toBe("take-123_user-456");
  });

  it("upvotes a published take (increments upvoteCount to 1, active: true)", async () => {
    const { db, collections } = createMockDb({
      projects: {
        "proj-1": {
          publicationStatus: "published",
          moderationState: "clear",
        },
      },
      takes: {
        "take-1": {
          projectId: "proj-1",
          active: true,
          status: "published",
          whyItShouldGrow: "Needs an anime series adaptation.",
          upvoteCount: 0,
        },
      },
    });

    const store = createSocialStore(db);
    const result = await store.upvoteTake("take-1", "user-1", true);

    expect(result).toEqual({ active: true, upvoteCount: 1 });

    const takeDoc = collections.takes.get("take-1");
    expect(takeDoc.upvoteCount).toBe(1);

    const upvoteDoc = collections.takeUpvotes.get("take-1_user-1");
    expect(upvoteDoc).toBeDefined();
    expect(upvoteDoc.active).toBe(true);
    expect(upvoteDoc.takeId).toBe("take-1");
    expect(upvoteDoc.uid).toBe("user-1");
  });

  it("toggling off with active: false decrements back to 0", async () => {
    const { db, collections } = createMockDb({
      projects: {
        "proj-1": {
          publicationStatus: "published",
          moderationState: "clear",
        },
      },
      takes: {
        "take-1": {
          projectId: "proj-1",
          active: true,
          status: "published",
          whyItShouldGrow: "Needs an anime series adaptation.",
          upvoteCount: 1,
        },
      },
      takeUpvotes: {
        "take-1_user-1": {
          takeId: "take-1",
          projectId: "proj-1",
          uid: "user-1",
          active: true,
        },
      },
    });

    const store = createSocialStore(db);
    const result = await store.upvoteTake("take-1", "user-1", false);

    expect(result).toEqual({ active: false, upvoteCount: 0 });

    const takeDoc = collections.takes.get("take-1");
    expect(takeDoc.upvoteCount).toBe(0);

    const upvoteDoc = collections.takeUpvotes.get("take-1_user-1");
    expect(upvoteDoc.active).toBe(false);
  });

  it("throws SocialError when take does not exist", async () => {
    const { db } = createMockDb({
      projects: {
        "proj-1": {
          publicationStatus: "published",
        },
      },
    });

    const store = createSocialStore(db);
    await expect(store.upvoteTake("nonexistent-take", "user-1", true)).rejects.toThrow(SocialError);
    await expect(store.upvoteTake("nonexistent-take", "user-1", true)).rejects.toMatchObject({
      code: "take_unavailable",
      status: 404,
    });
  });

  it("throws SocialError when take is inactive", async () => {
    const { db } = createMockDb({
      projects: {
        "proj-1": {
          publicationStatus: "published",
        },
      },
      takes: {
        "take-inactive": {
          projectId: "proj-1",
          active: false,
          status: "withdrawn",
        },
      },
    });

    const store = createSocialStore(db);
    await expect(store.upvoteTake("take-inactive", "user-1", true)).rejects.toThrow(SocialError);
    await expect(store.upvoteTake("take-inactive", "user-1", true)).rejects.toMatchObject({
      code: "take_unavailable",
      status: 404,
    });
  });

  it("handles repeated upvote calls idempotently", async () => {
    const { db, collections } = createMockDb({
      projects: {
        "proj-1": {
          publicationStatus: "published",
        },
      },
      takes: {
        "take-1": {
          projectId: "proj-1",
          active: true,
          upvoteCount: 1,
        },
      },
      takeUpvotes: {
        "take-1_user-1": {
          takeId: "take-1",
          projectId: "proj-1",
          uid: "user-1",
          active: true,
        },
      },
    });

    const store = createSocialStore(db);
    const result = await store.upvoteTake("take-1", "user-1", true);
    expect(result).toEqual({ active: true, upvoteCount: 1 });
    expect(collections.takes.get("take-1").upvoteCount).toBe(1);
  });
});

describe("Take Upvote API Route Handlers", () => {
  it("POST route invokes run with limit and store.upvoteTake(takeId, uid, true)", async () => {
    const mockStore = {
      upvoteTake: vi.fn().mockResolvedValue({ active: true, upvoteCount: 1 }),
    };

    const runSpy = vi.spyOn(socialRoute, "run").mockImplementation(async (_req, action) => {
      const result = await action("user-1", mockStore as any);
      return new Response(JSON.stringify({ ok: true, data: result }), { status: 200 });
    });
    const limitSpy = vi.spyOn(socialRoute, "limit").mockResolvedValue({
      remainingBurst: 5,
      remainingDaily: 39,
      reused: false,
    });

    const req = new Request("http://localhost/api/takes/take-999/upvote", {
      method: "POST",
    });

    const res = await POST(req, {
      params: Promise.resolve({ takeId: "take-999" }),
    });

    expect(runSpy).toHaveBeenCalled();
    expect(limitSpy).toHaveBeenCalledWith("user-1", RATE_LIMITS.take ?? RATE_LIMITS.reply);
    expect(mockStore.upvoteTake).toHaveBeenCalledWith("take-999", "user-1", true);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { active: true, upvoteCount: 1 } });

    runSpy.mockRestore();
    limitSpy.mockRestore();
  });

  it("DELETE route invokes run with limit and store.upvoteTake(takeId, uid, false)", async () => {
    const mockStore = {
      upvoteTake: vi.fn().mockResolvedValue({ active: false, upvoteCount: 0 }),
    };

    const runSpy = vi.spyOn(socialRoute, "run").mockImplementation(async (_req, action) => {
      const result = await action("user-1", mockStore as any);
      return new Response(JSON.stringify({ ok: true, data: result }), { status: 200 });
    });
    const limitSpy = vi.spyOn(socialRoute, "limit").mockResolvedValue({
      remainingBurst: 5,
      remainingDaily: 39,
      reused: false,
    });

    const req = new Request("http://localhost/api/takes/take-999/upvote", {
      method: "DELETE",
    });

    const res = await DELETE(req, {
      params: Promise.resolve({ takeId: "take-999" }),
    });

    expect(runSpy).toHaveBeenCalled();
    expect(limitSpy).toHaveBeenCalledWith("user-1", RATE_LIMITS.take ?? RATE_LIMITS.reply);
    expect(mockStore.upvoteTake).toHaveBeenCalledWith("take-999", "user-1", false);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { active: false, upvoteCount: 0 } });

    runSpy.mockRestore();
    limitSpy.mockRestore();
  });

  it("POST route rejects unauthenticated requests with 401", async () => {
    const req = new Request("http://localhost/api/takes/take-999/upvote", {
      method: "POST",
    });

    const res = await POST(req, {
      params: Promise.resolve({ takeId: "take-999" }),
    });

    expect(res.status).toBe(401);
  });
});

describe("ScoutSocialPanel Upvote UI and Sorting", () => {
  it("renders upvote buttons on takes and sorts by Top Signal", async () => {
    render(React.createElement(ScoutSocialPanel, { card: getScoutCardFixture("complete") }));

    const lowTake = await screen.findByText("Take with 2 upvotes");
    const highTake = await screen.findByText("Take with 10 upvotes");
    expect(lowTake).toBeInTheDocument();
    expect(highTake).toBeInTheDocument();

    const upvoteButtons = screen.getAllByRole("button", { name: "Upvote this Take" });
    expect(upvoteButtons).toHaveLength(2);
    expect(upvoteButtons[0]).toHaveTextContent("▲ 2");
    expect(upvoteButtons[1]).toHaveTextContent("▲ 10");

    const articles = screen.getAllByRole("article");
    expect(articles[0]).toHaveTextContent("Take with 2 upvotes");
    expect(articles[1]).toHaveTextContent("Take with 10 upvotes");

    const topSignalButton = screen.getByRole("button", { name: "Top Signal" });
    fireEvent.click(topSignalButton);

    const sortedArticles = screen.getAllByRole("article");
    expect(sortedArticles[0]).toHaveTextContent("Take with 10 upvotes");
    expect(sortedArticles[1]).toHaveTextContent("Take with 2 upvotes");

    const recentButton = screen.getByRole("button", { name: "Recent" });
    fireEvent.click(recentButton);

    const revertedArticles = screen.getAllByRole("article");
    expect(revertedArticles[0]).toHaveTextContent("Take with 2 upvotes");
    expect(revertedArticles[1]).toHaveTextContent("Take with 10 upvotes");
  });

  it("clicking upvote button triggers POST /api/takes/[takeId]/upvote when active: true", async () => {
    mocks.socialCommand.mockResolvedValue({
      active: true,
      upvoteCount: 3,
    });

    render(React.createElement(ScoutSocialPanel, { card: getScoutCardFixture("complete") }));

    const upvoteButtons = await screen.findAllByRole("button", { name: "Upvote this Take" });
    fireEvent.click(upvoteButtons[0]);

    await waitFor(() => {
      expect(mocks.socialCommand).toHaveBeenCalledWith("/api/takes/take-low/upvote", "POST");
    });
    await waitFor(() => {
      expect(upvoteButtons[0]).toHaveTextContent("▲ 3");
    });
  });

  it("clicking upvote button triggers DELETE /api/takes/[takeId]/upvote when active: false", async () => {
    mocks.socialCommand.mockResolvedValue({
      active: false,
      upvoteCount: 9,
    });

    render(React.createElement(ScoutSocialPanel, { card: getScoutCardFixture("complete") }));

    const upvoteButtons = await screen.findAllByRole("button", { name: "Upvote this Take" });
    fireEvent.click(upvoteButtons[1]);

    await waitFor(() => {
      expect(mocks.socialCommand).toHaveBeenCalledWith("/api/takes/take-high/upvote", "DELETE");
    });
    await waitFor(() => {
      expect(upvoteButtons[1]).toHaveTextContent("▲ 9");
    });
  });
});
