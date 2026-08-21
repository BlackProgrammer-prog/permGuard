# Phase 14: HTML reporter

The reporter consumes AnalysisResult and performs no source analysis. It
produces deterministic JSON and a self-contained HTML dashboard that opens
directly from disk.

## Dashboard

The HTML report includes overview metrics, roles and CASL rules, Route
Handlers, Server Actions, HTTP client requests, issues, coverage, and graph
node and edge tables. It is responsive and has no JavaScript, CDN, external
font, image, or stylesheet dependency.

All project-controlled strings are HTML escaped. A restrictive Content Security
Policy disables external content and script execution. The report therefore
remains safe to inspect when source paths or finding text contain HTML syntax.

## CLI

    pnpm ironpermjs report . --output reports/ironpermjs.html

Without output, HTML is written to stdout. The scan JSON format remains
available through scan --json.

## Interpretation

Coverage cards always include detected and expected counts. The footer warns
that detected enforcement presence does not prove policy correctness or
application security. The graph is represented as searchable browser tables in
this phase; interactive graph visualization is a possible later enhancement.
