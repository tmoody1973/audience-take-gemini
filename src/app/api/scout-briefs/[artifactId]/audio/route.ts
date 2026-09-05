import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { scoutBriefStore } from "@/services/scout-brief/store";
import { generateMultiSpeakerAudio } from "@/services/scout-brief/gemini-tts-client";
import { wrapPcmToWav } from "@/services/scout-brief/audio-processor";
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
    audioBuffer = scoutBriefStore.getAudioBuffer(`scout-brief-${artifactId}-g1`);
  }

  if (!audioBuffer) {
    const directPath = path.resolve(process.cwd(), `public/audio-cache/${artifactId}.wav`);
    const prefixedPath = path.resolve(process.cwd(), `public/audio-cache/scout-brief-${artifactId}-g1.wav`);
    const legacyPath = path.resolve(process.cwd(), `public/audio-cache/${artifactId.replace("-pro-g1", "-g1").replace("-discover-g1", "-g1")}.wav`);
    const targetPath = fs.existsSync(directPath)
      ? directPath
      : (fs.existsSync(prefixedPath) ? prefixedPath : (fs.existsSync(legacyPath) ? legacyPath : null));

    if (targetPath) {
      try {
        audioBuffer = fs.readFileSync(targetPath);
        scoutBriefStore.saveAudioBuffer(artifactId, audioBuffer);
      } catch {}
    }
  }

  if (!audioBuffer) {
    // 2. Fetch brief from store (by direct ID or by cardVersionId) or canonical fixture
    let brief: ScoutBrief | null = await scoutBriefStore.getScoutBrief(artifactId);
    if (!brief) {
      brief = await scoutBriefStore.getScoutBriefByCardVersion(artifactId);
    }

    if (brief && brief.transcript) {
      try {
        const ttsResult = await generateMultiSpeakerAudio(brief.transcript);
        if (ttsResult && ttsResult.base64Pcm) {
          const processed = wrapPcmToWav(ttsResult.base64Pcm, ttsResult.sampleRate);
          audioBuffer = processed.wavBuffer;
          scoutBriefStore.saveAudioBuffer(artifactId, audioBuffer);
        }
      } catch (err) {
        console.warn("[ScoutBrief API] Audio generation error:", err);
      }
    }
  }

  if (!audioBuffer) {
    return NextResponse.json(
      { error: "Audio briefing not found or not yet generated" },
      { status: 404 }
    );
  }

  const range = request.headers.get("range");
  const totalLength = audioBuffer.length;

  if (range && range.startsWith("bytes=")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10) || 0;
    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

    if (start >= totalLength || end >= totalLength || start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${totalLength}` },
      });
    }

    const chunk = audioBuffer.subarray(start, end + 1);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Range": `bytes ${start}-${end}/${totalLength}`,
        "Content-Length": String(chunk.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
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
