import type {
  AnalysisResult,
  AuthorizationCoverage,
  IssueSeverity,
} from "@permguard/core";

const SEVERITIES: readonly IssueSeverity[] = [
  "CRITICAL",
  "HIGH",
  "WARNING",
  "INFO",
];

function metric(
  name: string,
  value: AuthorizationCoverage[keyof AuthorizationCoverage],
): string {
  return `${name.padEnd(16)} ${value.detected}/${value.expected} (${value.percentage}%)`;
}

export function formatScanSummary(
  analysis: AnalysisResult,
  rootDir: string,
): string {
  const issueCounts = SEVERITIES.map((severity) => {
    const count = analysis.issues.filter(
      (issue) => issue.severity === severity,
    ).length;
    return `${severity}=${count}`;
  }).join(" ");

  return [
    "PermGuard authorization scan",
    `Root: ${rootDir}`,
    "",
    metric("Routes", analysis.coverage.routes),
    metric("Server Actions", analysis.coverage.serverActions),
    metric("Overall", analysis.coverage.overall),
    "",
    `Issues: ${analysis.issues.length} (${issueCounts})`,
    `Graph: ${analysis.graph.nodes.length} nodes, ${analysis.graph.edges.length} edges`,
    "",
    "Coverage measures detected enforcement presence; it does not prove security.",
  ].join("\n");
}
