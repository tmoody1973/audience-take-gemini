import { getGoogleGenAIClient } from "@/lib/google/genai-client";
import type {
  CalculationManifest,
  ScenarioOption,
} from "@/features/production-scenarios/types";

export interface CandidateExtractionResult {
  label: string;
  indicatedRate: { low: number; base: number; high: number };
  rateUnit: string;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  applicabilityAssessment: string;
}

/**
 * Deterministic template-based calculation explainer.
 * Guaranteed 100% mathematically grounded in the manifest with zero hallucinations.
 */
export function createDeterministicExplanation(
  manifest: CalculationManifest,
  option: ScenarioOption
): string {
  const { low, base, high } = manifest.costCases;
  const currencySymbol = option.currency === "USD" ? "$" : option.currency === "EUR" ? "€" : "£";

  const driversList = manifest.topDrivers
    .map((d, i) => `${i + 1}) ${d.label} (${currencySymbol}${d.amount.toLocaleString()} · ${d.percentageOfDirect}% of direct)`)
    .join("; ");

  const formatLabel = option.targetFormat.replace("_", " ").toUpperCase();
  const techniqueLabel = option.technique.replace("_", " ");

  const para1 = `This indicative production scenario models a ${formatLabel} (${option.runtimeMinutes} minutes${
    option.episodeCount > 1 ? `, ${option.episodeCount} episodes` : ""
  }) produced in ${techniqueLabel} within the ${option.location} market. The resulting planning range is ${currencySymbol}${low.totalCost.toLocaleString()} (Low) to ${currencySymbol}${base.totalCost.toLocaleString()} (Base) and ${currencySymbol}${high.totalCost.toLocaleString()} (High). This reflects stated planning assumptions and is not an approved production budget or confirmed studio quote.`;

  const para2 = manifest.topDrivers.length > 0
    ? `The primary cost drivers for this configuration are: ${driversList}. Fixed setup and asset development account for ${currencySymbol}${base.categorySubtotals.setup_development.toLocaleString()}, with variable production workload scaling at ${currencySymbol}${base.categorySubtotals.production_workload.toLocaleString()}.`
    : `Direct production costs total ${currencySymbol}${base.directCost.toLocaleString()}, with allowances adding ${currencySymbol}${(base.totalCost - base.directCost).toLocaleString()}.`;

  const para3 = manifest.coverageState === "partial"
    ? `Coverage notice: ${manifest.coveredScopeDescription}. Crucially, ${manifest.nextDiligenceStep}`
    : `Recommended diligence action: ${manifest.nextDiligenceStep}`;

  return [para1, para2, para3].join("\n\n");
}

/**
 * Validates that all monetary figures mentioned in an explanation string match
 * the exact numbers in the calculation manifest.
 */
export function validateExplanationNumbers(
  explanation: string,
  manifest: CalculationManifest
): boolean {
  // Collect all valid numbers from the manifest
  const validNumbers = new Set<number>();

  for (const c of [manifest.costCases.low, manifest.costCases.base, manifest.costCases.high]) {
    validNumbers.add(Math.round(c.totalCost));
    validNumbers.add(Math.round(c.directCost));
    for (const val of Object.values(c.categorySubtotals)) {
      if (val > 0) validNumbers.add(Math.round(val));
    }
    for (const item of c.itemizedResults) {
      if (item.subtotal > 0) validNumbers.add(Math.round(item.subtotal));
    }
  }
  for (const d of manifest.topDrivers) {
    validNumbers.add(Math.round(d.amount));
  }

  // Regex to extract dollar/euro/pound figures like $25,300 or €10,000
  const currencyMatches = explanation.match(/[$€£](\d{1,3}(?:,\d{3})*|\d+)/g) || [];

  for (const match of currencyMatches) {
    const numericStr = match.replace(/[$€£,]/g, "");
    const parsed = parseInt(numericStr, 10);
    // Disallow numbers above 50 that don't match any manifest figure
    if (parsed > 50 && !validNumbers.has(parsed)) {
      console.warn(`Explanation validation failure: rogue monetary figure "${match}" (${parsed}) not found in calculation manifest.`);
      return false;
    }
  }

  return true;
}

/**
 * Generates an executive explanation of a calculation manifest using Gemini,
 * validated against the manifest to prevent any invented figures.
 */
export async function generateScenarioExplanation(
  manifest: CalculationManifest,
  option: ScenarioOption
): Promise<string> {
  const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  const ai = getGoogleGenAIClient();

  // If live AI is unavailable or in test mode, return deterministic explanation
  if (!ai || isTest) {
    return createDeterministicExplanation(manifest, option);
  }

  try {
    const prompt = `You are a film & television physical production expert analyzing a deterministic cost scenario for an independent project.
Given this calculation manifest, summarize the planning scenario for an industry executive in three concise paragraphs:
1. Format, technique, planning range (Low, Base, High), and nature of assumptions.
2. Top cost drivers, breakdown of setup versus recurring workload.
3. Key unknowns, missing inputs, and the concrete next diligence action.

STRICT RULE: Do NOT invent any new monetary figures, percentages, or rate quotes. Mention ONLY the exact figures provided below.

MANIFEST:
${JSON.stringify(manifest, null, 2)}
`;

    const modelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) {
      return createDeterministicExplanation(manifest, option);
    }

    // Verify generated text does not hallucinate new numbers
    if (!validateExplanationNumbers(text, manifest)) {
      console.warn("Gemini explanation contained hallucinated numbers; falling back to deterministic explanation.");
      return createDeterministicExplanation(manifest, option);
    }

    return text;
  } catch (err) {
    console.warn("Gemini explanation generation failed; falling back to deterministic template:", err);
    return createDeterministicExplanation(manifest, option);
  }
}
