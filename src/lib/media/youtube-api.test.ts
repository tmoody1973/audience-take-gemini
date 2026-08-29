import { describe, it, expect } from "vitest";
import { fetchYouTubeVideoDetails, fetchYouTubeTopComments } from "./youtube-api";

describe("YouTube API Client", () => {
  it("fetches video details with valid structure", async () => {
    const details = await fetchYouTubeVideoDetails("VvqQHBjY46w");
    expect(details).not.toBeNull();
    expect(details?.videoId).toBe("VvqQHBjY46w");
    expect(details?.viewCount).toBeGreaterThan(0);
    expect(details?.channelTitle).toBeDefined();
  });

  it("fetches top comments with engagement metrics", async () => {
    const comments = await fetchYouTubeTopComments("VvqQHBjY46w", 10);
    expect(comments).toBeInstanceOf(Array);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0].text).toBeDefined();
    expect(comments[0].likeCount).toBeGreaterThanOrEqual(0);
  });
});
