import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchYouTubeVideoDetails,
  fetchYouTubeTopComments,
  fetchYouTubeCommentsStructured,
} from "./youtube-api";

describe("YouTube API Client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches video details with valid structure when API returns data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            snippet: {
              title: "Independent Animated Trailer",
              description: "A proof of concept trailer",
              channelTitle: "Studio Alpha",
              publishedAt: "2025-01-01T00:00:00Z",
              tags: ["animation", "indie"],
            },
            statistics: {
              viewCount: "50000",
              likeCount: "4200",
              commentCount: "350",
            },
          },
        ],
      }),
    } as any);

    const details = await fetchYouTubeVideoDetails("test-vid-123", "dummy-key");
    expect(details).not.toBeNull();
    expect(details?.videoId).toBe("test-vid-123");
    expect(details?.title).toBe("Independent Animated Trailer");
    expect(details?.viewCount).toBe(50000);
    expect(details?.channelTitle).toBe("Studio Alpha");
  });

  it("returns null when video ID is missing or API key is absent without fabricating data", async () => {
    const details = await fetchYouTubeVideoDetails("", "");
    expect(details).toBeNull();

    const noKeyDetails = await fetchYouTubeVideoDetails("test-vid-123", "");
    expect(noKeyDetails).toBeNull();
  });

  it("fetches top comments with engagement metrics when comments are available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "yt-c1",
            snippet: {
              totalReplyCount: 5,
              topLevelComment: {
                snippet: {
                  authorDisplayName: "FilmEnthusiast",
                  textDisplay: "Incredible pacing and sound design!",
                  likeCount: 42,
                  publishedAt: "2025-01-02T12:00:00Z",
                },
              },
            },
          },
        ],
      }),
    } as any);

    const comments = await fetchYouTubeTopComments("test-vid-123", 10, "dummy-key");
    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe("yt-c1");
    expect(comments[0].authorName).toBe("FilmEnthusiast");
    expect(comments[0].likeCount).toBe(42);
  });

  it("returns structured unavailable/disabled state when comments are turned off or absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as any);

    const result = await fetchYouTubeCommentsStructured("disabled-vid", 10, "dummy-key");
    expect(result.status).toBe("disabled");
    expect(result.comments).toEqual([]);
    expect(result.reason).toContain("disabled or restricted");
  });
});
