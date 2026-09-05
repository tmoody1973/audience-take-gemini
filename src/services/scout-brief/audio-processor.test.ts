import { describe, it, expect } from "vitest";
import {
  createWavHeader,
  wrapPcmToWav,
  generateSyntheticPcm,
} from "./audio-processor";

describe("Audio Processor (PCM to WAV Wrapping)", () => {
  it("creates a standard 44-byte WAV header with 24kHz mono 16-bit parameters", () => {
    const dataLength = 48000; // 1 second of 24kHz 16-bit mono PCM
    const header = createWavHeader(dataLength, 24000, 1, 16);

    expect(header.length).toBe(44);
    expect(header.toString("ascii", 0, 4)).toBe("RIFF");
    expect(header.readUInt32LE(4)).toBe(36 + dataLength);
    expect(header.toString("ascii", 8, 12)).toBe("WAVE");
    expect(header.toString("ascii", 12, 16)).toBe("fmt ");
    expect(header.readUInt32LE(16)).toBe(16); // Subchunk1Size
    expect(header.readUInt16LE(20)).toBe(1); // PCM format
    expect(header.readUInt16LE(22)).toBe(1); // Mono
    expect(header.readUInt32LE(24)).toBe(24000); // 24000 Hz
    expect(header.readUInt32LE(28)).toBe(48000); // Byte rate (24000 * 2)
    expect(header.readUInt16LE(32)).toBe(2); // Block align
    expect(header.readUInt16LE(34)).toBe(16); // 16 bits
    expect(header.toString("ascii", 36, 40)).toBe("data");
    expect(header.readUInt32LE(40)).toBe(dataLength);
  });

  it("validates and wraps synthetic PCM audio into a valid WAV file with duration and sha256", () => {
    const durationSeconds = 60;
    const base64Pcm = generateSyntheticPcm(durationSeconds, 24000);

    const result = wrapPcmToWav(base64Pcm, 24000, 30000, 300000);

    expect(result).toBeDefined();
    expect(result.mimeType).toBe("audio/wav");
    expect(result.durationMs).toBe(60000);
    expect(result.sizeBytes).toBe(44 + durationSeconds * 24000 * 2);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.wavBuffer.toString("ascii", 0, 4)).toBe("RIFF");
  });

  it("rejects odd byte lengths and out-of-bound durations", () => {
    // Odd byte length
    const oddBuffer = Buffer.from([1, 2, 3]);
    expect(() => wrapPcmToWav(oddBuffer.toString("base64"))).toThrow("must be even");

    // Too short duration
    const shortPcm = generateSyntheticPcm(5, 24000);
    expect(() => wrapPcmToWav(shortPcm, 24000, 30000, 300000)).toThrow("outside safe bounds");
  });

  it("prevents double RIFF wrapping when input is already a WAV file", () => {
    const rawPcm = generateSyntheticPcm(2, 24000);
    const firstWav = wrapPcmToWav(rawPcm, 24000, 1000, 10000);

    // If firstWav.wavBuffer is passed in again, wrapPcmToWav must NOT add a second 44-byte header!
    const secondWav = wrapPcmToWav(firstWav.wavBuffer.toString("base64"), 24000, 1000, 10000);

    expect(secondWav.sizeBytes).toBe(firstWav.sizeBytes);
    expect(secondWav.wavBuffer.subarray(0, 4).toString("ascii")).toBe("RIFF");
    // Offset 44 must be audio samples, NOT another "RIFF"
    expect(secondWav.wavBuffer.subarray(44, 48).toString("ascii")).not.toBe("RIFF");
  });
});
