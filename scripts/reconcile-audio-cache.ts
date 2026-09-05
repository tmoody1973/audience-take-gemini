/**
 * Audience Take — Reversible Audio Cache Migration & Quarantine Script
 *
 * 1. Audits all cached WAV files in public/audio-cache/
 * 2. Backs up original files to public/audio-cache/legacy-quarantine/
 * 3. Cleans double/nested RIFF headers using extractPcmFromWav + wrapPcmToWav
 * 4. Outputs an auditable contracts/audio-migration-manifest.json with before/after stats
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { extractPcmFromWav, wrapPcmToWav } from "../src/services/scout-brief/audio-processor";

interface MigrationEntry {
  filename: string;
  originalSizeBytes: number;
  originalSha256: string;
  cleanedSizeBytes: number;
  cleanedSha256: string;
  cleanedDurationMs: number;
  hadDoubleRiff: boolean;
}

export function runAudioCacheMigration(): MigrationEntry[] {
  const cacheDir = path.resolve(process.cwd(), "public/audio-cache");
  const quarantineDir = path.resolve(cacheDir, "legacy-quarantine");

  if (!fs.existsSync(cacheDir)) {
    console.log("No public/audio-cache directory found.");
    return [];
  }

  if (!fs.existsSync(quarantineDir)) {
    fs.mkdirSync(quarantineDir, { recursive: true });
  }

  const files = fs.readdirSync(cacheDir).filter((f) => f.endsWith(".wav"));
  const entries: MigrationEntry[] = [];

  for (const file of files) {
    const filePath = path.join(cacheDir, file);
    const quarantinePath = path.join(quarantineDir, file);
    const buffer = fs.readFileSync(filePath);

    const originalSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const hadDoubleRiff =
      buffer.length >= 88 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(44, 48).toString("ascii") === "RIFF";

    // 1. Quarantine original copy if not already quarantined
    if (!fs.existsSync(quarantinePath)) {
      fs.copyFileSync(filePath, quarantinePath);
    }

    // 2. Clean buffer (extract raw PCM samples and re-wrap with exactly one header)
    const pcm = extractPcmFromWav(buffer);
    const cleaned = wrapPcmToWav(pcm.toString("base64"), 24000, 500, 600000);

    // 3. Write cleaned buffer
    fs.writeFileSync(filePath, cleaned.wavBuffer);

    entries.push({
      filename: file,
      originalSizeBytes: buffer.length,
      originalSha256,
      cleanedSizeBytes: cleaned.sizeBytes,
      cleanedSha256: cleaned.sha256,
      cleanedDurationMs: cleaned.durationMs,
      hadDoubleRiff,
    });
  }

  const manifestPath = path.resolve(process.cwd(), "contracts/audio-migration-manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        migrationTimestamp: new Date().toISOString(),
        totalFilesMigrated: entries.length,
        entries,
      },
      null,
      2
    )
  );

  console.log(`Audio migration complete. ${entries.length} files cleaned and backed up to legacy-quarantine/.`);
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAudioCacheMigration();
}
