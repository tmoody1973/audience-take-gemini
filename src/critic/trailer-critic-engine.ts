/**
 * Audience Take — Independent Multimodal Trailer Critic Engine
 * Analyzes video craft, sound design, pacing, and narrative beats using Gemini 3.7 Flash Video Understanding.
 */

import { getGoogleGenAIClient } from "@/lib/google/genai-client";
import { dataRepo } from "@/services/firestore-repo";
import { fetchYouTubeMetadata } from "@/lib/media/youtube";
import type { TrailerCritic } from "@/domain";

export function validateCriticPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, any>;
  if (typeof d.summary !== "string" || !d.summary.trim()) return false;
  // Limitations is strictly required to enforce truthful methodology disclosure
  if (typeof d.limitations !== "string" || !d.limitations.trim() || d.limitations.trim().length < 10) return false;

  // Modality & methodology invariant: text-only/contextual reading must not claim direct frame inspection or scene beats
  const isContextOnly = /\b(limited\s+to\s+available\s+context|contextual\s+reading|metadata\s+rather\s+than\s+direct|no\s+direct\s+video|text\s+context)\b/i.test(d.limitations);
  const claimsDirectFrames = /\bdirect\s+frame\s+(?:analysis|inspection)\b/i.test(d.summary);
  if (isContextOnly && (claimsDirectFrames || (Array.isArray(d.timestampedBeats) && d.timestampedBeats.length > 0))) {
    return false;
  }

  if (!Array.isArray(d.timestampedBeats)) return false;
  let lastSeconds = -1;
  for (const beat of d.timestampedBeats) {
    if (typeof beat.timestampSeconds !== "number" || beat.timestampSeconds < 0) return false;
    if (beat.timestampSeconds < lastSeconds) return false; // must be chronological
    lastSeconds = beat.timestampSeconds;
    if (typeof beat.label !== "string" || typeof beat.description !== "string") return false;
  }
  if (!d.criticMatrix || typeof d.criticMatrix !== "object") return false;
  for (const key of ["clarity", "toneConsistency", "visualOriginality", "narrativeTension"]) {
    const val = d.criticMatrix[key];
    if (typeof val !== "number" || val < 0 || val > 10) return false;
  }
  return true;
}

export async function analyzeAnyTrailerVideo(
  videoUrl: string,
  title: string = "Independent Screen Project",
  medium: string = "short"
): Promise<TrailerCritic> {
  const criticModel = process.env.AUDIENCE_TAKE_CRITIC_MODEL || "gemini-3.7-flash";
  let criticData: any = null;
  let resolvedTitle = title;
  const ai = getGoogleGenAIClient();

  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    try {
      const ytMeta = await fetchYouTubeMetadata(videoUrl);
      if (ytMeta?.title && (resolvedTitle === "Independent Screen Project" || resolvedTitle.includes("Investigating"))) {
        resolvedTitle = ytMeta.title;
      }
    } catch {
      // ignore
    }
  }

  if (ai) {
    try {

      const systemInstruction = `
You are the Audience Take Senior Cinema & Trailer Critic powered by Google Gemini.
Perform an in-depth craft, pacing, cinematography, and sound design breakdown of this screen project trailer.

STRICT INVARIANTS:
1. Provide timestamped narrative & craft beats (e.g. 0:00, 0:08, 0:15).
2. Evaluate sound design, framing, texture, and emotional arc honestly.
3. Output a 1-10 critic matrix on: clarity, toneConsistency, visualOriginality, narrativeTension.
4. Include explicit AI sampling limitations notice.
`;

      const prompt = `
Analyze this screen trailer using Gemini multimodal video understanding: ${videoUrl}
Project Title: "${resolvedTitle}" (${medium})

Output strictly in JSON matching this schema:
{
  "summary": string,
  "genreAndForm": string,
  "whyItMayConnect": string,
  "timestampedBeats": [ { "timestampSeconds": number, "timestampFormatted": "0:00", "label": string, "description": string } ],
  "craftAnalysis": {
    "cinematography": string,
    "soundAndScore": string,
    "editingAndPacing": string,
    "graphicsAndText": string
  },
  "persuasionAndEmotion": {
    "emotionalArc": string,
    "targetPersona": string,
    "callToAction": string
  },
  "criticMatrix": {
    "clarity": number,
    "toneConsistency": number,
    "visualOriginality": number,
    "narrativeTension": number
  },
  "limitations": string
}
`;

      let observedModality: "text_context_only" | "multimodal_video" = "text_context_only";
      let res: any = null;

      const isEligibleVideo =
        videoUrl.includes("youtube.com") ||
        videoUrl.includes("youtu.be") ||
        videoUrl.endsWith(".mp4") ||
        videoUrl.endsWith(".webm");

      if (isEligibleVideo) {
        try {
          const mediaPart = {
            fileData: {
              fileUri: videoUrl,
              mimeType: "video/mp4",
            },
          };
          res = await ai.models.generateContent({
            model: criticModel,
            contents: [mediaPart, prompt],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });
          observedModality = "multimodal_video";
        } catch (mediaErr) {
          console.warn("[TrailerCritic] Multimodal video attachment failed, falling back to text context:", mediaErr);
        }
      }

      if (!res) {
        res = await ai.models.generateContent({
          model: criticModel,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });
        observedModality = "text_context_only";
      }

      if (res?.text) {
        const parsed = JSON.parse(res.text);
        if (observedModality === "text_context_only") {
          parsed.timestampedBeats = [];
          parsed.limitations = "Analysis grounded in verified project and trailer metadata; direct multimodal video stream was unattached or unavailable.";
          parsed.craftAnalysis = {
            cinematography: "Direct video stream inspection was unavailable; camera framing, lighting, and composition observations cannot be verified without primary video access.",
            soundAndScore: "Direct audio track inspection was unavailable; acoustic mix, sound design, and musical score cannot be verified without primary audio access.",
            editingAndPacing: "Direct video stream inspection was unavailable; shot duration, cut rhythms, and pacing cannot be verified without primary video access.",
            graphicsAndText: "Direct video stream inspection was unavailable; title cards and typography cannot be verified without primary video access.",
          };
        }
        if (validateCriticPayload(parsed)) {
          criticData = parsed;
          criticData.modality = observedModality;
        } else {
          console.warn("[TrailerCritic] Live payload failed runtime schema validation; using unavailable fallback");
        }
      }
    } catch (err: unknown) {
      console.warn("Live Gemini video critic analysis fell back to deterministic fixture", err);
    }
  }

  // Fallback to truthful unavailable state
  if (!criticData) {
    criticData = {
      summary: "Video craft breakdown is currently unavailable for this media source.",
      genreAndForm: `${medium.replace("_", " ")} / Unreviewed`,
      whyItMayConnect: "Media evaluation pending or unavailable.",
      timestampedBeats: [],
      craftAnalysis: {
        cinematography: "Unavailable",
        soundAndScore: "Unavailable",
        editingAndPacing: "Unavailable",
        graphicsAndText: "Unavailable"
      },
      persuasionAndEmotion: {
        emotionalArc: "Unavailable",
        targetPersona: "Unavailable",
        callToAction: "Unavailable"
      },
      criticMatrix: {
        clarity: 0,
        toneConsistency: 0,
        visualOriginality: 0,
        narrativeTension: 0
      },
      limitations: "Video craft analysis could not be completed for this source."
    };
  }

  return {
    id: `critic-adhoc-${Date.now()}`,
    projectId: "adhoc",
    sourceVideoUrl: videoUrl,
    summary: criticData.summary,
    genreAndForm: criticData.genreAndForm,
    whyItMayConnect: criticData.whyItMayConnect,
    timestampedBeats: criticData.timestampedBeats,
    craftAnalysis: criticData.craftAnalysis,
    persuasionAndEmotion: criticData.persuasionAndEmotion,
    criticMatrix: criticData.criticMatrix,
    limitations: criticData.limitations,
    modality: criticData.modality || "text_context_only",
    analyzedAt: new Date().toISOString(),
    model: criticModel,
  };
}

export async function analyzeTrailerVideo(
  projectId: string,
  videoUrl: string
): Promise<TrailerCritic> {
  const project = await dataRepo.getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  const criticModel = process.env.AUDIENCE_TAKE_CRITIC_MODEL || "gemini-3.5-flash";
  let criticData: any = null;
  let resolvedTitle = project.identity.title;
  const ai = getGoogleGenAIClient();

  let ytMeta: any = null;
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    try {
      ytMeta = await fetchYouTubeMetadata(videoUrl);
      if (ytMeta?.title && (resolvedTitle.includes("Investigating") || resolvedTitle === "Independent Screen Project")) {
        resolvedTitle = ytMeta.title;
      }
    } catch {
      // ignore
    }
  }

  if (ai) {
    try {

      const systemInstruction = `
You are the Audience Take Senior Cinema & Trailer Critic powered by Google Gemini.
Perform an in-depth craft, pacing, cinematography, and sound design breakdown of this screen project trailer.

STRICT INVARIANTS:
1. Provide timestamped narrative & craft beats (e.g. 0:00, 0:08, 0:15).
2. Evaluate sound design, framing, texture, and emotional arc honestly.
3. Output a 1-10 critic matrix on: clarity, toneConsistency, visualOriginality, narrativeTension.
4. Include explicit AI sampling limitations notice.
`;

      const contextLines: string[] = [
        `Project Title: "${resolvedTitle}"`,
        `Medium / Form: ${project.identity.medium}`,
        `Current Stage: ${project.identity.currentStage || "in production"}`,
        project.identity.creators?.length ? `Creators: ${project.identity.creators.join(", ")}` : "",
        project.identity.logline ? `Verified Logline: "${project.identity.logline}"` : "",
        ytMeta?.authorName ? `Channel / Publisher: ${ytMeta.authorName}` : "",
      ].filter(Boolean);

      const prompt = `
Analyze this screen trailer using Gemini contextual video understanding: ${videoUrl}

<verified_project_context>
${contextLines.join("\n")}
</verified_project_context>

IMPORTANT EVALUATION DIRECTIVES:
1. Ground your craft analysis strictly in the verified project medium and genre described above. If direct video stream bytes are unattached, perform contextual craft analysis and explicitly state in "limitations" that analysis is grounded in verified metadata rather than direct frame inspection.
2. Deconstruct timestamped narrative & audiovisual beats (e.g. 0:00, 0:15, 0:30) observing actual visual progression and audio cues.
3. Assess pacing, tone consistency, and audience connectivity honestly without empty hype.

Output strictly in JSON matching this schema:
{
  "summary": string,
  "genreAndForm": string,
  "whyItMayConnect": string,
  "timestampedBeats": [ { "timestampSeconds": number, "timestampFormatted": "0:00", "label": string, "description": string } ],
  "craftAnalysis": {
    "cinematography": string,
    "soundAndScore": string,
    "editingAndPacing": string,
    "graphicsAndText": string
  },
  "persuasionAndEmotion": {
    "emotionalArc": string,
    "targetPersona": string,
    "callToAction": string
  },
  "criticMatrix": {
    "clarity": number,
    "toneConsistency": number,
    "visualOriginality": number,
    "narrativeTension": number
  },
  "limitations": string
}
`;

      let observedModality: "text_context_only" | "multimodal_video" = "text_context_only";
      let res: any = null;

      const isEligibleVideo =
        videoUrl.includes("youtube.com") ||
        videoUrl.includes("youtu.be") ||
        videoUrl.endsWith(".mp4") ||
        videoUrl.endsWith(".webm");

      if (isEligibleVideo) {
        try {
          const mediaPart = {
            fileData: {
              fileUri: videoUrl,
              mimeType: "video/mp4",
            },
          };
          res = await ai.models.generateContent({
            model: criticModel,
            contents: [mediaPart, prompt],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });
          observedModality = "multimodal_video";
        } catch (mediaErr) {
          console.warn("[TrailerCritic] Multimodal video attachment failed, falling back to text context:", mediaErr);
        }
      }

      if (!res) {
        res = await ai.models.generateContent({
          model: criticModel,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });
        observedModality = "text_context_only";
      }

      if (res?.text) {
        const parsed = JSON.parse(res.text);
        if (observedModality === "text_context_only") {
          parsed.timestampedBeats = [];
          parsed.limitations = "Analysis grounded in verified project and trailer metadata; direct multimodal video stream was unattached or unavailable.";
          parsed.craftAnalysis = {
            cinematography: "Direct video stream inspection was unavailable; camera framing, lighting, and composition observations cannot be verified without primary video access.",
            soundAndScore: "Direct audio track inspection was unavailable; acoustic mix, sound design, and musical score cannot be verified without primary audio access.",
            editingAndPacing: "Direct video stream inspection was unavailable; shot duration, cut rhythms, and pacing cannot be verified without primary video access.",
            graphicsAndText: "Direct video stream inspection was unavailable; title cards and typography cannot be verified without primary video access.",
          };
        }
        if (validateCriticPayload(parsed)) {
          criticData = parsed;
          criticData.modality = observedModality;
        } else {
          console.warn("[TrailerCritic] Live payload failed runtime schema validation; using unavailable fallback");
        }
      }
    } catch (err: unknown) {
      console.warn("Live Gemini video critic analysis fell back to deterministic fixture", err);
    }
  }

  // Fallback to truthful unavailable state
  if (!criticData) {
    criticData = {
      summary: "Trailer craft breakdown is currently unavailable for this media source.",
      genreAndForm: `${project.identity.medium.replace("_", " ")} / Unreviewed`,
      whyItMayConnect: "Media evaluation pending or unavailable.",
      timestampedBeats: [],
      craftAnalysis: {
        cinematography: "Unavailable",
        soundAndScore: "Unavailable",
        editingAndPacing: "Unavailable",
        graphicsAndText: "Unavailable"
      },
      persuasionAndEmotion: {
        emotionalArc: "Unavailable",
        targetPersona: "Unavailable",
        callToAction: "Unavailable"
      },
      criticMatrix: {
        clarity: 0,
        toneConsistency: 0,
        visualOriginality: 0,
        narrativeTension: 0
      },
      limitations: "Video craft analysis could not be completed for this source."
    };
  }

  const criticRecord: TrailerCritic = {
    id: `critic-${project.id}-${Date.now()}`,
    projectId: project.id,
    sourceVideoUrl: videoUrl,
    summary: criticData.summary,
    genreAndForm: criticData.genreAndForm,
    whyItMayConnect: criticData.whyItMayConnect,
    timestampedBeats: criticData.timestampedBeats,
    craftAnalysis: criticData.craftAnalysis,
    persuasionAndEmotion: criticData.persuasionAndEmotion,
    criticMatrix: criticData.criticMatrix,
    limitations: criticData.limitations,
    modality: criticData.modality || "text_context_only",
    analyzedAt: new Date().toISOString(),
    model: criticModel,
  };

  await dataRepo.saveTrailerCritic(criticRecord);
  return criticRecord;
}
