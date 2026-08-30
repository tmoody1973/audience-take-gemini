import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { scoutBriefStore } from "@/services/scout-brief/store";
import { generateMultiSpeakerAudio } from "@/services/scout-brief/gemini-tts-client";
import { wrapPcmToWav, generateSyntheticPcm } from "@/services/scout-brief/audio-processor";
import type { ScoutBrief } from "@/features/scout-brief/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await context.params;

  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifactId" }, { status: 400 });
  }

  // 1. Check memory / cached audio buffer
  let audioBuffer = scoutBriefStore.getAudioBuffer(artifactId);

  if (!audioBuffer) {
    // 2. Fetch brief from store or canonical fixture
    let brief: ScoutBrief | null = await scoutBriefStore.getScoutBrief(artifactId);

    if (!brief) {
      try {
        const fixturePath = path.resolve(process.cwd(), "contracts/fixtures/junichiro-scout-brief.json");
        if (fs.existsSync(fixturePath)) {
          const content = fs.readFileSync(fixturePath, "utf-8");
          const json = JSON.parse(content) as ScoutBrief;
          brief = json;
        }
      } catch (err) {
        console.warn("[ScoutBrief API] Fixture read error:", err);
      }
    }

    if (brief && brief.transcript) {
      try {
        const ttsResult = await generateMultiSpeakerAudio(brief.transcript);
        const processed = wrapPcmToWav(ttsResult.base64Pcm, ttsResult.sampleRate);
        audioBuffer = processed.wavBuffer;
        scoutBriefStore.saveAudioBuffer(artifactId, audioBuffer);
      } catch (err) {
        console.warn("[ScoutBrief API] Audio generation error:", err);
      }
    }

    // 3. Fallback: generate synthetic WAV audio only if TTS completely failed
    if (!audioBuffer) {
      const durationSeconds = brief?.durationMs ? brief.durationMs / 1000 : 30;
      const syntheticPcm = generateSyntheticPcm(durationSeconds, 24000);
      const processed = wrapPcmToWav(syntheticPcm, 24000);
      audioBuffer = processed.wavBuffer;
      scoutBriefStore.saveAudioBuffer(artifactId, audioBuffer);
    }
  }

  return new Response(new Uint8Array(audioBuffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(audioBuffer.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
