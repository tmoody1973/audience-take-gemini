import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/feed/audio-briefs/route";
import { dataRepo } from "@/services/firestore-repo";

describe("Podcast RSS Feed Route", () => {
  it("generates valid RSS 2.0 with audio enclosure tags", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(res.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=600");

    const xml = await res.text();
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("xmlns:itunes=\"http://www.itunes.com/dtds/podcast-1.0.dtd\"");
    expect(xml).toContain("xmlns:atom=\"http://www.w3.org/2005/Atom\"");
    expect(xml).toContain("<enclosure");
    expect(xml).toContain("length=\"2500000\"");
    expect(xml).toContain("type=\"audio/mpeg\"");
    expect(xml).toContain("<itunes:summary>");
    expect(xml).toContain("<itunes:duration>180</itunes:duration>");
    expect(xml).toContain("<itunes:explicit>false</itunes:explicit>");
    expect(xml).toContain("Audience Take Radio");
    expect(xml).toContain("https://audiencetake.com/projects/");
  });

  it("falls back to canonical items if dataRepo has no projects or throws", async () => {
    const spy = vi.spyOn(dataRepo, "getProjects").mockRejectedValueOnce(new Error("DB offline"));
    const res = await GET();
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("Junichiro Jackson");
    expect(xml).toContain("Signal in the Pines");
    expect(xml).toContain("<enclosure url=\"https://audiencetake.com/api/scout-briefs/card-junichiro-v1/audio\"");
    spy.mockRestore();
  });
});
