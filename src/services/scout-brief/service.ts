import type { ScoutCard } from "@/features/scout-card/types";
import type { ScoutBrief, ScoutBriefJob } from "@/features/scout-brief/types";
import { generateScoutBriefTranscript } from "./gemini-script-generator";
import { countTranscriptWords } from "./script-builder";
import { generateMultiSpeakerAudio } from "./gemini-tts-client";
import { wrapPcmToWav } from "./audio-processor";
import { scoutBriefStore } from "./store";

export async function generateAndPublishScoutBrief(
  card: ScoutCard,
  generationVersion = 1
): Promise<ScoutBrief> {
  const artifactId = `scout-brief-${card.cardVersionId}-g${generationVersion}`;
  const now = new Date().toISOString();

  // 1. Check existing ready artifact for idempotency
  const existing = await scoutBriefStore.getScoutBrief(artifactId);
  if (existing && existing.status === "ready") {
    return existing;
  }

  // 2. Initialize private job lease
  const job: ScoutBriefJob = {
    artifactId,
    projectId: card.projectId,
    cardVersionId: card.cardVersionId,
    runId: card.runId,
    researchVersion: card.researchVersion || 1,
    generationVersion,
    state: "generating_script",
    scriptRequestStartedAt: now,
    updatedAt: now,
  };
  await scoutBriefStore.saveJob(job);

  // 3. Stage 1: Generate & Validate Structured Transcript
  const transcript = await generateScoutBriefTranscript(card);
  const wordCount = countTranscriptWords(transcript.segments);

  job.state = "script_ready";
  job.scriptCompletedAt = new Date().toISOString();
  job.transcript = transcript;
  await scoutBriefStore.saveJob(job);

  // 4. Stage 2: Generate Multi-Speaker Audio (Gemini TTS)
  job.state = "generating_audio";
  job.ttsRequestStartedAt = new Date().toISOString();
  await scoutBriefStore.saveJob(job);

  const ttsResult = await generateMultiSpeakerAudio(transcript);
  job.ttsCompletedAt = new Date().toISOString();

  // 5. Stage 3: Process Audio & Packaging (PCM to WAV)
  const processedAudio = wrapPcmToWav(ttsResult.base64Pcm, ttsResult.sampleRate);
  scoutBriefStore.saveAudioBuffer(artifactId, processedAudio.wavBuffer);

  const storagePath = `public/projects/${card.projectId}/scout-briefs/${card.cardVersionId}/g${generationVersion}.wav`;
  const audioUrl = `/api/scout-briefs/${artifactId}/audio`;

  // 6. Build immutable public ScoutBrief record
  const scoutBrief: ScoutBrief = {
    artifactId,
    projectId: card.projectId,
    cardVersionId: card.cardVersionId,
    runId: card.runId,
    researchVersion: card.researchVersion || 1,
    generationVersion,
    status: "ready",
    visibility: "public",
    language: "en-US",
    title: `${card.title} — Audio Scout Brief`,
    durationMs: processedAudio.durationMs,
    wordCount,
    scriptModelId: "gemini-3.5-flash",
    ttsModelId: "gemini-3.1-flash-tts-preview",
    speakers: [
      { speaker: "Scout", voice: "Kore" },
      { speaker: "Analyst", voice: "Puck" },
    ],
    transcript,
    sourceIds: (card.sourceLedger || []).map((s) => s.id),
    claimIds: ["claim-1", "claim-2", "claim-3"],
    pathwayIds: (card.pathways || []).map((p, idx) => p.id || `pathway-${idx + 1}`),
    storagePath,
    audioUrl,
    mimeType: "audio/wav",
    sizeBytes: processedAudio.sizeBytes,
    sha256: processedAudio.sha256,
    generatedAt: new Date().toISOString(),
  };

  // 7. Save immutable public artifact
  await scoutBriefStore.saveScoutBrief(scoutBrief);

  // 8. Mark job complete
  job.state = "ready";
  job.updatedAt = new Date().toISOString();
  await scoutBriefStore.saveJob(job);

  return scoutBrief;
}
