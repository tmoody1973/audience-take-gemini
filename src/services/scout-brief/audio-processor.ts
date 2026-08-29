import crypto from "crypto";

export interface ProcessedAudioResult {
  wavBuffer: Buffer;
  durationMs: number;
  sizeBytes: number;
  sha256: string;
  mimeType: "audio/wav";
}

/**
 * Creates a standard 44-byte WAV header for mono, 24kHz, 16-bit PCM audio.
 */
export function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // RIFF Chunk Descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  header.write("WAVE", 8);

  // "fmt " Sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // "data" Sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return header;
}

/**
 * Validates and converts raw base64 PCM audio into a standard WAV container.
 */
export function wrapPcmToWav(
  base64Pcm: string,
  sampleRate = 24000,
  minDurationMs = 30000,
  maxDurationMs = 600000
): ProcessedAudioResult {
  if (!base64Pcm || typeof base64Pcm !== "string") {
    throw new Error("Invalid PCM input: base64 string required");
  }

  const pcmBuffer = Buffer.from(base64Pcm, "base64");
  if (pcmBuffer.length === 0) {
    throw new Error("Decoded PCM audio is empty");
  }

  if (pcmBuffer.length % 2 !== 0) {
    throw new Error("PCM audio byte length must be even for 16-bit samples");
  }

  const durationSeconds = pcmBuffer.length / (sampleRate * 1 * 2);
  const durationMs = Math.round(durationSeconds * 1000);

  if (durationMs < minDurationMs || durationMs > maxDurationMs) {
    throw new Error(`Audio duration ${durationMs}ms is outside safe bounds [${minDurationMs}ms, ${maxDurationMs}ms]`);
  }

  const wavHeader = createWavHeader(pcmBuffer.length, sampleRate);
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

  const sha256 = crypto.createHash("sha256").update(wavBuffer).digest("hex");

  return {
    wavBuffer,
    durationMs,
    sizeBytes: wavBuffer.length,
    sha256,
    mimeType: "audio/wav",
  };
}

/**
 * Generates synthetic PCM audio for offline unit testing (fast repeated tone buffer).
 */
export function generateSyntheticPcm(durationSeconds: number, sampleRate = 24000, frequency = 440): string {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const totalBytes = numSamples * 2;
  const buffer = Buffer.alloc(totalBytes);

  // Pre-generate 1 second chunk
  const chunkSamples = Math.min(sampleRate, numSamples);
  const chunkBytes = chunkSamples * 2;
  const chunk = Buffer.alloc(chunkBytes);

  for (let i = 0; i < chunkSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    const int16Sample = Math.floor(sample * 32767);
    chunk.writeInt16LE(int16Sample, i * 2);
  }

  let offset = 0;
  while (offset < totalBytes) {
    const toCopy = Math.min(chunkBytes, totalBytes - offset);
    chunk.copy(buffer, offset, 0, toCopy);
    offset += toCopy;
  }

  return buffer.toString("base64");
}
