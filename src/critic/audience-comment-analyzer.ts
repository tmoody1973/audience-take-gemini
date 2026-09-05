import { getGoogleGenAIClient } from "@/lib/google/genai-client";
import type { YouTubeCommentItem } from "@/lib/media/youtube-api";

export interface FandomDnaAnalysis {
  characterAndLoreObsessions: string[];
  merchandiseDemandSignals: string[];
  toneAndWritingReception: {
    praise: string[];
    critiques: string[];
  };
  demographicAndFandomComps: string[];
  organicVsBrigadedFlag: "organic_broad_base" | "concentrated_cult" | "brigaded_fandom" | "insufficient_sample";
  audienceResonanceSummary: string;
  sentimentScore: number; // 0-100
  sampleSize: number;
  samplingLimitations?: string;
  analyzedAt: string;
}

export async function analyzeAudienceComments(
  comments: YouTubeCommentItem[],
  projectTitle: string = "Independent Screen Project",
  genre: string = "Independent Screen Narrative"
): Promise<FandomDnaAnalysis> {
  const honestAbstention: FandomDnaAnalysis = {
    characterAndLoreObsessions: [],
    merchandiseDemandSignals: [],
    toneAndWritingReception: {
      praise: [],
      critiques: [],
    },
    demographicAndFandomComps: [],
    organicVsBrigadedFlag: "insufficient_sample",
    audienceResonanceSummary: "Insufficient public audience comments available for grounded fandom analysis.",
    sentimentScore: 0,
    sampleSize: 0,
    samplingLimitations: "No public comments available to sample.",
    analyzedAt: new Date().toISOString(),
  };

  if (!comments || comments.length === 0) {
    return honestAbstention;
  }

  const ai = getGoogleGenAIClient();
  if (!ai) {
    return honestAbstention;
  }

  const commentCorpus = comments
    .slice(0, 50)
    .map((c, i) => `[${i + 1}] (${c.authorName}, +${c.likeCount} likes): "${c.text}"`)
    .join("\n");

  const prompt = `You are the Lead Audience Intelligence Analyst at Audience Take.
Analyze the following YouTube public audience comments for the independent screen project:
Project: "${projectTitle}"
Genre: "${genre}"

COMMENTS CORPUS:
${commentCorpus}

Provide a rigorous, unbiased Fandom DNA analysis in JSON format with this exact schema:
{
  "characterAndLoreObsessions": ["string", "string", "string"],
  "merchandiseDemandSignals": ["string", "string", "string"],
  "toneAndWritingReception": {
    "praise": ["string", "string"],
    "critiques": ["string"]
  },
  "demographicAndFandomComps": ["string", "string", "string", "string"],
  "organicVsBrigadedFlag": "organic_broad_base" | "concentrated_cult" | "brigaded_fandom",
  "audienceResonanceSummary": "string (2-3 sentences evaluating true fan passion vs commercial scale)",
  "sentimentScore": number (0 to 100)
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      const sampleSlice = comments.slice(0, 50);
      return {
        characterAndLoreObsessions: Array.isArray(parsed.characterAndLoreObsessions) ? parsed.characterAndLoreObsessions : [],
        merchandiseDemandSignals: Array.isArray(parsed.merchandiseDemandSignals) ? parsed.merchandiseDemandSignals : [],
        toneAndWritingReception: {
          praise: Array.isArray(parsed.toneAndWritingReception?.praise) ? parsed.toneAndWritingReception.praise : [],
          critiques: Array.isArray(parsed.toneAndWritingReception?.critiques) ? parsed.toneAndWritingReception.critiques : [],
        },
        demographicAndFandomComps: Array.isArray(parsed.demographicAndFandomComps) ? parsed.demographicAndFandomComps : [],
        organicVsBrigadedFlag: ["organic_broad_base", "concentrated_cult", "brigaded_fandom"].includes(parsed.organicVsBrigadedFlag)
          ? parsed.organicVsBrigadedFlag
          : "concentrated_cult",
        audienceResonanceSummary: typeof parsed.audienceResonanceSummary === "string"
          ? parsed.audienceResonanceSummary
          : "Audience sentiment analyzed from public comment sample.",
        sentimentScore: typeof parsed.sentimentScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.sentimentScore))) : 0,
        sampleSize: sampleSlice.length,
        samplingLimitations: `Analysis based on a sample of ${sampleSlice.length} public YouTube comments; does not represent total market demographics.`,
        analyzedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("Gemini audience comment analysis error, abstaining from ungrounded claims:", err);
  }

  return honestAbstention;
}
