import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MyNominationsClient } from "./my-nominations-client";

const authMocks = vi.hoisted(() => ({
  getClientAuth: vi.fn(() => ({ name: "auth" })),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("firebase/auth", () => ({ onAuthStateChanged: authMocks.onAuthStateChanged }));
vi.mock("@/lib/firebase/client", () => ({ getClientAuth: authMocks.getClientAuth }));
vi.mock("@/lib/firebase/config", () => ({ hasFirebaseClientConfig: () => true }));

describe("MyNominationsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {}
  });

  afterEach(cleanup);

  it("shows sign-in prompt when user is not signed in", async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth, next) => {
      next(null);
      return vi.fn();
    });

    render(<MyNominationsClient />);

    expect(screen.getByRole("heading", { name: /Sign in to manage your nominations/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign In \/ Register/i })).toHaveAttribute(
      "href",
      "/sign-in?returnTo=/my-nominations",
    );
  });

  it("renders nominations portfolio for signed-in scout", async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth, next) => {
      next({
        uid: "test-scout-1",
        email: "scout@audiencetake.com",
        displayName: "Tarik Scout",
        getIdToken: vi.fn(() => Promise.resolve("fake-token")),
      });
      return vi.fn();
    });

    // Mock fetch for /api/user/nominations
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/user/nominations") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              ok: true,
              data: {
                nominations: [
                  {
                    id: "nom-test-1",
                    projectId: "proj-1",
                    projectTitle: "Test Indie Short",
                    projectSlug: "test-indie-short",
                    submittedUrl: "https://www.youtube.com/watch?v=12345678901",
                    submissionType: "fan",
                    whyItShouldGrow: "Exceptional visual storytelling and pacing.",
                    suggestedFormat: "Micro-Budget Feature",
                    audienceFit: "Indie festival cinephiles",
                    supportingUrls: ["https://example.com/article"],
                    status: "published",
                    runId: "run-1",
                    currentStage: 6,
                    researchUrl: "/research/run-1",
                    cardUrl: "/projects/test-indie-short",
                    createdAt: "2026-08-28T12:00:00Z",
                    updatedAt: "2026-08-28T12:00:00Z",
                  },
                ],
              },
            }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as unknown as typeof fetch;

    render(<MyNominationsClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Tarik Scout" })).toBeInTheDocument();
    });

    expect(screen.getByText("Test Indie Short")).toBeInTheDocument();
    expect(screen.getAllByText(/PUBLISHED/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /VIEW SCOUT CARD/i })).toHaveAttribute(
      "href",
      "/projects/test-indie-short",
    );
  });

  it("opens edit modal and allows updating context", async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth, next) => {
      next({
        uid: "test-scout-1",
        email: "scout@audiencetake.com",
        displayName: "Tarik Scout",
        getIdToken: vi.fn(() => Promise.resolve("fake-token")),
      });
      return vi.fn();
    });

    global.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/user/nominations") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              ok: true,
              data: {
                nominations: [
                  {
                    id: "nom-test-1",
                    projectId: "proj-1",
                    projectTitle: "Test Indie Short",
                    projectSlug: "test-indie-short",
                    submittedUrl: "https://www.youtube.com/watch?v=12345678901",
                    submissionType: "fan",
                    whyItShouldGrow: "Original thesis statement.",
                    suggestedFormat: "Micro-Budget Feature",
                    audienceFit: "Indie festival cinephiles",
                    supportingUrls: [],
                    status: "in_progress",
                    runId: "run-1",
                    currentStage: 3,
                    researchUrl: "/research/run-1",
                    cardUrl: "/projects/test-indie-short",
                    createdAt: "2026-08-28T12:00:00Z",
                    updatedAt: "2026-08-28T12:00:00Z",
                  },
                ],
              },
            }),
        });
      }
      if (url === "/api/user/nominations/nom-test-1" && opts?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true, data: { updated: true } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as unknown as typeof fetch;

    render(<MyNominationsClient />);

    await waitFor(() => {
      expect(screen.getByText("Test Indie Short")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Edit Context/i }));

    expect(screen.getByRole("heading", { name: /Edit Nomination Context/i })).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(/Explain why this project deserves institutional backing/i);
    fireEvent.change(textarea, { target: { value: "Updated expanded scout thesis statement." } });

    fireEvent.click(screen.getByRole("button", { name: /Save Context Changes/i }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Edit Nomination Context/i })).not.toBeInTheDocument();
    });
  });
});
