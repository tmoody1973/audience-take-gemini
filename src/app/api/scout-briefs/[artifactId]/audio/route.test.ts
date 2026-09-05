import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { scoutBriefStore } from "@/services/scout-brief/store";
import { createWavHeader } from "@/services/scout-brief/audio-processor";

describe("Scout Brief Audio Streaming Endpoint", () => {
  it("streams binary WAV audio with proper HTTP headers and 24kHz header when artifact exists", async () => {
    // Seed test audio buffer
    const pcm = Buffer.alloc(48000, 1);
    const header = createWavHeader(pcm.length, 24000);
    const wav = Buffer.concat([header, pcm]);
    scoutBriefStore.saveAudioBuffer("test-artifact-01", wav);

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

  it("returns truthful 404 when artifact does not exist (never serves synthetic tone or fake fixture)", async () => {
    const request = new Request("http://localhost:3000/api/scout-briefs/non-existent-artifact/audio");
    const response = await GET(request, {
      params: Promise.resolve({ artifactId: "non-existent-artifact" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("Audio briefing not found");
  });
});
