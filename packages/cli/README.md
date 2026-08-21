# @permguard/cli

Thin command-line orchestration over analyzer, coverage, and graph packages.

    pnpm permguard scan .
    pnpm permguard scan . --json
    pnpm permguard graph . --output authorization-graph.json

Options:

- --json emits the complete AnalysisResult for scan
- --output or -o writes output to a file
- --tsconfig selects a TypeScript configuration
- --client-module adds a recognized imported HTTP wrapper and is repeatable

The default human summary includes boundary coverage, issue severity counts,
and graph size. Coverage is detection evidence, not a security guarantee.

Exit codes:

- 0 for help, version, and successful analysis
- 1 for configuration, filesystem, or analysis failures
- 2 for invalid CLI arguments
