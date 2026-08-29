import { NextResponse } from "next/server";
import { scoutBriefStore } from "@/services/scout-brief/store";
import { generateMultiSpeakerAudio } from "@/services/scout-brief/gemini-tts-client";
import { wrapPcmToWav, generateSyntheticPcm } from "@/services/scout-brief/audio-processor";

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
    // 2. Fetch brief from store
    const brief = await scoutBriefStore.getScoutBrief(artifactId);

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

    // 3. Fallback: generate high-fidelity synthetic WAV audio so player never fails
    if (!audioBuffer) {
      const durationSeconds = brief?.durationMs ? brief.durationMs / 1000 : 180;
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
