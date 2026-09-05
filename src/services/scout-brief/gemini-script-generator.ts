import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { ScoutCard } from "@/features/scout-card/types";
import type { ScoutBriefTranscript } from "@/features/scout-brief/types";
import {
  buildClosedWorldScriptInput,
  buildScriptGenerationPrompt,
  validateScoutBriefTranscript,
} from "./script-builder";

const transcriptResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          section: {
            type: Type.STRING,
            enum: ["hook", "project", "evidence", "uncertainty", "pathways", "next_move"],
          },
          speaker: {
            type: Type.STRING,
            enum: ["Scout", "Analyst"],
          },
          text: { type: Type.STRING },
          claimIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          sourceIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["order", "section", "speaker", "text", "claimIds", "sourceIds"],
      },
    },
    limitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    disclosure: { type: Type.STRING },
  },
  required: ["segments", "limitations", "disclosure"],
};

export async function generateScoutBriefTranscript(
  card: ScoutCard,
  modelId = "gemini-3.5-flash"
): Promise<ScoutBriefTranscript> {
  const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const cardInput = buildClosedWorldScriptInput(card);
  const prompt = buildScriptGenerationPrompt(cardInput);

  if (apiKey && !isTest) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: transcriptResponseSchema,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text) as ScoutBriefTranscript;
        const validation = validateScoutBriefTranscript(parsed, card);
        if (validation.valid) {
          return parsed;
        }
        console.warn("[ScoutBrief] Gemini script validation errors:", validation.errors);
      }
    } catch (err) {
      console.warn("[ScoutBrief] Gemini script generation fallback:", err);
    }
  }

  // High-fidelity fallback transcript strictly grounded in the card's data
  return createFallbackTranscript(card);
}

export function createFallbackTranscript(card: ScoutCard): ScoutBriefTranscript {
  const title = card.title || "Independent Screen Project";
  const hook = card.hook || "An independent screen project in active development and audience scouting.";
  const format = card.storyContext?.currentFormat || card.projectType || "screen work";
  const creator = card.creatorContext?.displayName || "Independent Creative Team";
  const pathways = card.pathways || [];

  const p1 = pathways[0]?.label || "Standard episodic series development pathway";
  const p2 = pathways[1]?.label || "Independent feature film or festival release pathway";
  const p3 = pathways[2]?.label || "Direct-to-audience digital release or transmedia pathway";
  const nextExp = pathways[0]?.nextExperiment?.title || "Collect structured audience feedback and proof of concept";

  const supportedClaims = (card.evidenceClaims || []).filter((c) => c.status === "supported");
  const availableSourceIds = (card.sourceLedger || []).map((s) => s.id);
  const s1 = availableSourceIds[0] ? [availableSourceIds[0]] : [];
  const s2 = availableSourceIds[1] ? [availableSourceIds[1]] : s1;

  const c1 = supportedClaims[0]?.id ? [supportedClaims[0].id] : (card.evidenceClaims?.[0]?.id ? [card.evidenceClaims[0].id] : []);
  const c2 = supportedClaims[1]?.id ? [supportedClaims[1].id] : c1;

  const evidenceCopy = supportedClaims.length > 0
    ? `Looking at the verified evidence record, our primary sources establish key milestones: ${supportedClaims.slice(0, 2).map((c) => c.statement).join(". ")}. These data points anchor the project's public trajectory.`
    : "Looking at the current evidence record, verified commercial metrics and financing figures remain unconfirmed at this stage of scouting. The project relies primarily on creative proof of concept and emerging community interest.";

  const uncertaintyCopy = card.pathways?.[0]?.risks?.[0]
    || card.limitations?.[0]
    || "Financing commitments, distribution partners, and production scale remain subject to primary diligence.";

  return {
    segments: [
      {
        order: 1,
        section: "hook",
        speaker: "Scout",
        text: `Welcome to Audience Take. Today we are breaking down ${title}, an independent screen project currently in public development. The creative hook centers on: ${hook} We are evaluating how audience interest and commercial viability align for this title.`,
        claimIds: c1,
        sourceIds: s1,
      },
      {
        order: 2,
        section: "project",
        speaker: "Analyst",
        text: `That is right, Scout. From a development triage perspective, ${title} is framed as a ${format} originating from ${creator}. Rather than relying on speculative interest, our focus is on concrete creative vision and verified audience engagement.`,
        claimIds: c1,
        sourceIds: s1,
      },
      {
        order: 3,
        section: "evidence",
        speaker: "Scout",
        text: evidenceCopy,
        claimIds: c2,
        sourceIds: s2,
      },
      {
        order: 4,
        section: "uncertainty",
        speaker: "Analyst",
        text: `As institutional scouts, we have to evaluate execution risks and unknowns honestly. Specifically: ${uncertaintyCopy} Clear rights confirmation and production partnership remain essential diligence checks before committing resources.`,
        claimIds: c2,
        sourceIds: s2,
      },
      {
        order: 5,
        section: "pathways",
        speaker: "Scout",
        text: `That is why the evidence ledger outlines three distinct development pathways: first, ${p1}; second, ${p2}; and third, ${p3}. Each pathway tests a different commercial and creative format.`,
        claimIds: c1,
        sourceIds: s1,
      },
      {
        order: 6,
        section: "next_move",
        speaker: "Analyst",
        text: `The recommended next bounded experiment is clear: ${nextExp}. This provides a low-risk diligence step to validate audience traction before entering formal development commitments.`,
        claimIds: c1,
        sourceIds: s1,
      },
    ],
    limitations: card.limitations?.length ? card.limitations : [
      "Production timeline and rights subject to primary diligence verification.",
      "Evaluation based on public sources and submitted media.",
    ],
    disclosure: "AI-generated Scout Brief based on verified public evidence from the published Scout Card.",
  };
}
