import type {
  AnalysisResult,
  CoverageMetric,
  SourceLocation,
} from "@permguard/core";
import type { HtmlReportOptions } from "./types.js";

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function location(value: SourceLocation): string {
  return `${escapeHtml(value.file)}:${value.line}:${value.column}`;
}

function emptyRow(columns: number, label = "No records detected"): string {
  return `<tr><td class="empty" colspan="${columns}">${label}</td></tr>`;
}

function coverageCard(label: string, metric: CoverageMetric): string {
  return `<article class="metric">
    <span>${escapeHtml(label)}</span>
    <strong>${metric.percentage}%</strong>
    <small>${metric.detected} of ${metric.expected} boundaries</small>
    <div class="bar" aria-label="${escapeHtml(label)} coverage ${metric.percentage}%">
      <i style="width:${Math.min(100, Math.max(0, metric.percentage))}%"></i>
    </div>
  </article>`;
}

function status(protectedBoundary: boolean): string {
  return protectedBoundary
    ? '<span class="badge protected">Detected</span>'
    : '<span class="badge missing">Missing</span>';
}

export function renderHtmlReport(
  analysis: AnalysisResult,
  options: HtmlReportOptions = {},
): string {
  const title = options.title ?? "PermGuard Authorization Report";
  const projectName = options.projectName ?? "Project";
  const knownChecks = new Set(
    analysis.authorizationChecks.map((check) => check.id),
  );
  const hasCheck = (ids: readonly string[]) =>
    ids.some((id) => knownChecks.has(id));

  const permissionRows = analysis.permissions
    .map(
      (permission) => `<tr>
        <td>${permission.inverted ? "cannot" : "can"}</td>
        <td><code>${escapeHtml(permission.action)}</code></td>
        <td><code>${escapeHtml(permission.subject)}</code></td>
        <td>${escapeHtml(permission.field ?? "-")}</td>
        <td>${location(permission.location)}</td>
      </tr>`,
    )
    .join("");

  const roleRows = analysis.roles
    .map(
      (role) =>
        `<tr><td>${escapeHtml(role.name)}</td><td><code>${escapeHtml(role.id)}</code></td></tr>`,
    )
    .join("");

  const routeRows = analysis.routes
    .map(
      (route) => `<tr>
        <td><span class="method">${escapeHtml(route.method)}</span></td>
        <td><code>${escapeHtml(route.path)}</code></td>
        <td>${status(hasCheck(route.authorizationCheckIds))}</td>
        <td>${route.authorizationCheckIds.length}</td>
        <td>${location(route.location)}</td>
      </tr>`,
    )
    .join("");

  const actionRows = analysis.serverActions
    .map(
      (action) => `<tr>
        <td><code>${escapeHtml(action.name)}</code></td>
        <td>${status(hasCheck(action.authorizationCheckIds))}</td>
        <td>${action.authorizationCheckIds.length}</td>
        <td>${location(action.location)}</td>
      </tr>`,
    )
    .join("");

  const requestRows = analysis.httpClientRequests
    .map(
      (request) => `<tr>
        <td>${escapeHtml(request.client)}</td>
        <td><span class="method">${escapeHtml(request.method)}</span></td>
        <td><code>${escapeHtml(request.path)}</code></td>
        <td>${request.routeMatches.length}</td>
        <td>${escapeHtml(request.confidence)}</td>
        <td>${location(request.location)}</td>
      </tr>`,
    )
    .join("");

  const issueRows = analysis.issues
    .map(
      (issue) => `<tr>
        <td><span class="badge severity-${issue.severity.toLowerCase()}">${issue.severity}</span></td>
        <td><strong>${escapeHtml(issue.title)}</strong><br><small>${escapeHtml(issue.explanation)}</small></td>
        <td>${escapeHtml(issue.confidence)}</td>
        <td>${location(issue.location)}</td>
      </tr>`,
    )
    .join("");

  const nodeRows = analysis.graph.nodes
    .map(
      (node) =>
        `<tr><td><code>${escapeHtml(node.id)}</code></td><td>${escapeHtml(node.type)}</td><td>${escapeHtml(node.label)}</td></tr>`,
    )
    .join("");
  const edgeRows = analysis.graph.edges
    .map(
      (edge) =>
        `<tr><td>${escapeHtml(edge.type)}</td><td><code>${escapeHtml(edge.source)}</code></td><td><code>${escapeHtml(edge.target)}</code></td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${escapeHtml(title)}</title>
<style>
:root{color-scheme:dark;--bg:#09111f;--panel:#111c2e;--line:#263550;--text:#e8eef8;--muted:#9eb0c9;--accent:#6ee7b7;--danger:#fb7185;--warn:#fbbf24}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.55 ui-sans-serif,system-ui,sans-serif}
header,main,footer{width:min(1180px,calc(100% - 32px));margin:auto}header{padding:48px 0 22px}h1{font-size:32px;margin:0 0 6px}h2{font-size:20px;margin:0 0 16px}h3{font-size:15px;margin:22px 0 10px}.muted,small{color:var(--muted)}
nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}nav a{color:var(--text);text-decoration:none;border:1px solid var(--line);padding:7px 11px;border-radius:999px}
section{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px;margin:0 0 18px;overflow:hidden}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.metric{background:#0c1627;border:1px solid var(--line);border-radius:11px;padding:16px}.metric span,.metric small{display:block}.metric strong{font-size:28px}.bar{height:6px;background:#263550;border-radius:9px;margin-top:12px;overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.summary div{background:#0c1627;padding:12px;border-radius:9px}.summary strong{display:block;font-size:22px}
.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:680px}th,td{text-align:left;border-bottom:1px solid var(--line);padding:10px 9px;vertical-align:top}th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}code{color:#c4b5fd}.badge,.method{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700}.protected{background:#064e3b;color:#a7f3d0}.missing,.severity-critical,.severity-high{background:#4c0519;color:#fecdd3}.severity-warning{background:#422006;color:#fde68a}.severity-info{background:#172554;color:#bfdbfe}.method{background:#1e293b;color:#dbeafe}.empty{text-align:center;color:var(--muted);padding:24px}footer{padding:8px 0 48px;color:var(--muted)}
@media(max-width:760px){.metrics,.summary{grid-template-columns:1fr}header{padding-top:28px}}
</style>
</head>
<body>
<header>
  <p class="muted">PermGuard - Analysis model v${analysis.modelVersion}</p>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(projectName)} - Static authorization analysis</p>
  <nav aria-label="Report sections">
    <a href="#overview">Overview</a><a href="#abilities">Abilities</a>
    <a href="#routes">Routes</a><a href="#actions">Server Actions</a>
    <a href="#issues">Issues</a><a href="#graph">Graph</a>
  </nav>
</header>
<main>
<section id="overview">
  <h2>Authorization overview</h2>
  <div class="metrics">
    ${coverageCard("Routes", analysis.coverage.routes)}
    ${coverageCard("Server Actions", analysis.coverage.serverActions)}
    ${coverageCard("Overall", analysis.coverage.overall)}
  </div>
  <div class="summary">
    <div><strong>${analysis.routes.length}</strong><span>Routes</span></div>
    <div><strong>${analysis.serverActions.length}</strong><span>Server Actions</span></div>
    <div><strong>${analysis.issues.length}</strong><span>Issues</span></div>
    <div><strong>${analysis.authorizationChecks.length}</strong><span>Checks</span></div>
  </div>
</section>
<section id="abilities">
  <h2>Roles and abilities</h2>
  <h3>Roles</h3><div class="table-wrap"><table><thead><tr><th>Name</th><th>ID</th></tr></thead><tbody>${roleRows || emptyRow(2)}</tbody></table></div>
  <h3>CASL rules</h3><div class="table-wrap"><table><thead><tr><th>Effect</th><th>Action</th><th>Subject</th><th>Field</th><th>Source</th></tr></thead><tbody>${permissionRows || emptyRow(5)}</tbody></table></div>
</section>
<section id="routes">
  <h2>Route Handlers</h2>
  <div class="table-wrap"><table><thead><tr><th>Method</th><th>Path</th><th>Enforcement</th><th>Checks</th><th>Source</th></tr></thead><tbody>${routeRows || emptyRow(5)}</tbody></table></div>
</section>
<section id="actions">
  <h2>Server Actions</h2>
  <div class="table-wrap"><table><thead><tr><th>Name</th><th>Enforcement</th><th>Checks</th><th>Source</th></tr></thead><tbody>${actionRows || emptyRow(4)}</tbody></table></div>
</section>
<section id="requests">
  <h2>HTTP client requests</h2>
  <div class="table-wrap"><table><thead><tr><th>Client</th><th>Method</th><th>Path</th><th>Route matches</th><th>Confidence</th><th>Source</th></tr></thead><tbody>${requestRows || emptyRow(6)}</tbody></table></div>
</section>
<section id="issues">
  <h2>Issues</h2>
  <div class="table-wrap"><table><thead><tr><th>Severity</th><th>Finding</th><th>Confidence</th><th>Source</th></tr></thead><tbody>${issueRows || emptyRow(4, "No issues detected")}</tbody></table></div>
</section>
<section id="graph">
  <h2>Authorization graph</h2>
  <p class="muted">${analysis.graph.nodes.length} nodes - ${analysis.graph.edges.length} edges</p>
  <h3>Nodes</h3><div class="table-wrap"><table><thead><tr><th>ID</th><th>Type</th><th>Label</th></tr></thead><tbody>${nodeRows || emptyRow(3)}</tbody></table></div>
  <h3>Edges</h3><div class="table-wrap"><table><thead><tr><th>Type</th><th>Source</th><th>Target</th></tr></thead><tbody>${edgeRows || emptyRow(3)}</tbody></table></div>
</section>
</main>
<footer>Coverage measures recognized enforcement presence, not policy correctness. A 100% result does not prove that an application is secure.</footer>
</body>
</html>`;
}
