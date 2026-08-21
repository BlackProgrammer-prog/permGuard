import { ANALYSIS_MODEL_VERSION, type AnalysisResult } from "@ironpermjs/core";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const ARRAY_FIELDS = [
  "permissions",
  "roles",
  "routes",
  "serverActions",
  "httpClientRequests",
  "authorizationChecks",
  "usages",
  "issues",
] as const;

export function parseAnalysisBaseline(value: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Baseline is not valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Baseline must contain an AnalysisResult object.");
  }
  if (parsed.modelVersion !== ANALYSIS_MODEL_VERSION) {
    throw new Error(
      `Unsupported baseline model version. Expected ${ANALYSIS_MODEL_VERSION}.`,
    );
  }
  if (ARRAY_FIELDS.some((field) => !Array.isArray(parsed[field]))) {
    throw new Error("Baseline is missing required AnalysisResult collections.");
  }
  if (!isRecord(parsed.graph) || !isRecord(parsed.coverage)) {
    throw new Error("Baseline is missing graph or coverage data.");
  }

  return parsed as unknown as AnalysisResult;
}
