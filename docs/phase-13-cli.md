# Phase 13: CLI

The CLI is a thin orchestration layer over analyzer, graph, and core models. It
creates one analyzer project, runs each analysis pass, calculates coverage, and
builds the graph without implementing analysis rules itself.

## Commands

    permguard scan [root]
    permguard scan [root] --json
    permguard graph [root]
    permguard scan [root] --output permguard.json

The default command is scan and the default root is the current directory.
The tsconfig option selects another TypeScript configuration. Repeat
client-module to recognize imported HTTP wrapper modules.

Human scan output summarizes route, Server Action, and overall coverage, issue
counts by severity, and graph size. JSON scan output serializes the complete
versioned AnalysisResult. The graph command emits only AuthorizationGraph.

## Exit behavior

Help, version, and successful analysis return zero. Invalid CLI arguments return 2. Configuration, filesystem, and analysis failures return 1. Findings do not
change the exit code in this phase; fail-on-severity belongs to the later CI
phase.

## Security interpretation

The summary always states that coverage measures detected enforcement presence
and does not prove security. The CLI does not treat a hidden UI element as
server authorization.
