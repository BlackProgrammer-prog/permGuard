import type { AnalysisResult } from "@ironpermjs/core";
import type { JsonReportOptions } from "./types.js";

export function renderJsonReport(
  analysis: AnalysisResult,
  options: JsonReportOptions = {},
): string {
  return JSON.stringify(
    analysis,
    null,
    options.pretty === false ? undefined : 2,
  );
}
