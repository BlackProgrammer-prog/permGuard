# @ironpermjs/cli

Thin command-line orchestration over analyzer, coverage, and graph packages.

    pnpm ironpermjs scan .
    pnpm ironpermjs scan . --json
    pnpm ironpermjs graph . --output authorization-graph.json
    pnpm ironpermjs report . --output ironpermjs-report.html
    pnpm ironpermjs scan . --json --output baseline.json
    pnpm ironpermjs diff . --baseline baseline.json
    pnpm ironpermjs scan . --ci --fail-on HIGH

Options:

- --json emits the complete AnalysisResult for scan
- --output or -o writes output to a file
- --tsconfig selects a TypeScript configuration
- --client-module adds a recognized imported HTTP wrapper and is repeatable
- --baseline selects an AnalysisResult snapshot for diff
- --ci enables severity policy evaluation
- --fail-on sets INFO, WARNING, HIGH, or CRITICAL

The default human summary includes boundary coverage, issue severity counts,
and graph size. Coverage is detection evidence, not a security guarantee.

Exit codes:

- 0 for help, version, and successful analysis
- 1 for configuration, filesystem, or analysis failures
- 2 for invalid CLI arguments
- 3 when the CI severity policy fails
