import type { AuthorizationDiff } from "@permguard/diff";

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function formatDiffSummary(diff: AuthorizationDiff): string {
  const lines = [
    "PermGuard authorization diff",
    "",
    `Routes coverage: ${diff.coverage.routes.before}% -> ${diff.coverage.routes.after}% (${signed(diff.coverage.routes.delta)})`,
    `Server Actions coverage: ${diff.coverage.serverActions.before}% -> ${diff.coverage.serverActions.after}% (${signed(diff.coverage.serverActions.delta)})`,
    `Overall coverage: ${diff.coverage.overall.before}% -> ${diff.coverage.overall.after}% (${signed(diff.coverage.overall.delta)})`,
    "",
    `Changes: ${diff.changes.length}`,
  ];

  if (diff.changes.length === 0) {
    lines.push("No authorization-relevant changes detected.");
  } else {
    for (const change of diff.changes) {
      const marker =
        change.kind === "added" ? "+" : change.kind === "removed" ? "-" : "~";
      const severity = change.severity ? ` [${change.severity}]` : "";
      lines.push(`${marker}${severity} ${change.summary}`);
    }
  }

  return lines.join("\n");
}
