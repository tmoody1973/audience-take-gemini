/**
 * Audience Take — Independent Multimodal Trailer Critic Engine
 * Analyzes video craft, sound design, pacing, and narrative beats using Gemini 3.7 Flash Video Understanding.
 */

import { getGoogleGenAIClient } from "@/lib/google/genai-client";
import { dataRepo } from "@/services/firestore-repo";
import { fetchYouTubeMetadata } from "@/lib/media/youtube";
import type { TrailerCritic } from "@/domain";

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

      const res = await ai.models.generateContent({
        model: criticModel,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      if (res.text) {
        criticData = JSON.parse(res.text);
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

  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    try {
      const ytMeta = await fetchYouTubeMetadata(videoUrl);
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

      const prompt = `
Analyze this screen trailer using Gemini multimodal video understanding: ${videoUrl}
Project: "${resolvedTitle}" (${project.identity.medium})

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

      const res = await ai.models.generateContent({
        model: criticModel,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      if (res.text) {
        criticData = JSON.parse(res.text);
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
    analyzedAt: new Date().toISOString(),
    model: criticModel,
  };

  await dataRepo.saveTrailerCritic(criticRecord);
  return criticRecord;
}
