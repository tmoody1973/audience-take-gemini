import { GoogleGenAI } from "@google/genai";

/**
 * Creates a unified Google GenAI client supporting both Vertex AI and Gemini Developer API.
 * - When GOOGLE_GENAI_USE_VERTEXAI="true" or deployed on GCP (Cloud Run), connects via Vertex AI.
 * - When GEMINI_API_KEY is present, connects via Gemini API.
 */
export function getGoogleGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  const useVertex =
    process.env.GOOGLE_GENAI_USE_VERTEXAI === "true" ||
    process.env.USE_VERTEX_AI === "true";
  const project =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.PROJECT_ID ||
    "test-app-mkark4";
  const location =
    process.env.GOOGLE_CLOUD_LOCATION ||
    process.env.GCP_LOCATION ||
    process.env.GOOGLE_CLOUD_REGION ||
    "northamerica-northeast1";

  if (useVertex) {
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  if (apiKey && apiKey !== "AIzaDummyApiKeyForTesting" && !apiKey.startsWith("demo_")) {
    return new GoogleGenAI({ apiKey });
  }

  // Auto-detect GCP Cloud Run environment to use Vertex AI with default credentials
  if (process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT) {
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  return null;
}
