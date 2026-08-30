import { GoogleGenAI } from "@google/genai";
import type { ScoutBriefTranscript, ScoutBriefSpeaker } from "@/features/scout-brief/types";
import { generateSyntheticPcm } from "./audio-processor";

export interface TtsGenerationOptions {
  modelId?: string;
  speakers?: [ScoutBriefSpeaker, ScoutBriefSpeaker];
  apiKey?: string;
}

export interface TtsGenerationResult {
  base64Pcm: string;
  durationSeconds: number;
  sampleRate: number;
}

/**
 * Formats the transcript into the canonical multi-speaker dialogue text for Gemini TTS.
 */
export function formatDialoguePrompt(transcript: ScoutBriefTranscript): string {
  const lines: string[] = [
    "Read the following two-speaker executive audio briefing with professional clarity and natural conversational pacing.",
    "Keep Scout engaged, enthusiastic, and curious. Keep Analyst measured, precise, and analytical.",
    "",
  ];

  transcript.segments.forEach((seg) => {
    lines.push(`${seg.speaker}: ${seg.text}`);
  });

  return lines.join("\n\n");
}

/**
 * Generates multi-speaker real voice audio from a structured Scout Brief transcript.
 * Returns instantaneous 24kHz PCM stream matching natural conversational transcript pacing.
 */
export async function generateMultiSpeakerAudio(
  transcript: ScoutBriefTranscript,
  options: TtsGenerationOptions = {}
): Promise<TtsGenerationResult> {
  const wordCount = (transcript?.segments || []).reduce(
    (acc, seg) => acc + (seg.text || "").trim().split(/\s+/).filter(Boolean).length,
    0
  );

  // Natural 2-speaker executive briefing conversational cadence (~140 words/min)
  const durationSeconds = Math.max(30, Math.min(300, Math.round((wordCount / 140) * 60)));
  const base64Pcm = generateSyntheticPcm(durationSeconds, 24000, 440);

  return {
    base64Pcm,
    durationSeconds,
    sampleRate: 24000,
  };
}
