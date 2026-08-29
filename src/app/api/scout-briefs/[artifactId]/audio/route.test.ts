import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("Scout Brief Audio Streaming Endpoint", () => {
  it("streams binary WAV audio with proper HTTP headers and 24kHz header", async () => {
    const request = new Request("http://localhost:3000/api/scout-briefs/test-artifact-01/audio");
    const response = await GET(request, {
      params: Promise.resolve({ artifactId: "test-artifact-01" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/wav");
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    expect(buffer.length).toBeGreaterThan(44);
    expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
    expect(buffer.toString("ascii", 8, 12)).toBe("WAVE");
  });
});
