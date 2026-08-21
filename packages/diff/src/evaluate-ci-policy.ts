import type { AnalysisResult, IssueSeverity } from "@permguard/core";
import type { CiPolicyOptions, CiPolicyResult } from "./types.js";

const SEVERITY_RANK: Readonly<Record<IssueSeverity, number>> = {
  INFO: 0,
  WARNING: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function evaluateCiPolicy(
  analysis: AnalysisResult,
  options: CiPolicyOptions,
): CiPolicyResult {
  const threshold = SEVERITY_RANK[options.failOn];
  const blockingIssues = analysis.issues
    .filter((issue) => SEVERITY_RANK[issue.severity] >= threshold)
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    passed: blockingIssues.length === 0,
    failOn: options.failOn,
    blockingIssues,
  };
}
