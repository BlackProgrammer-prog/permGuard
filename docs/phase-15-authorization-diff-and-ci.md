# Phase 15: Authorization diff and CI

Phase 15 compares versioned AnalysisResult snapshots and applies a
CI-provider-independent severity policy.

## Baseline workflow

Create and store a baseline from the base revision:

    pnpm permguard scan . --json --output permguard-baseline.json

Compare a later revision:

    pnpm permguard diff . --baseline permguard-baseline.json
    pnpm permguard diff . --baseline permguard-baseline.json --json

The diff uses semantic permission, route, and Server Action keys instead of
source line numbers. It reports added and removed permissions, boundaries,
enforcement changes, new and resolved issues, and coverage percentage deltas.
Removing recognized enforcement or adding an unprotected boundary is marked
HIGH. Adding a positive permission grant is marked WARNING.

The baseline parser rejects invalid JSON, incomplete snapshots, and unsupported
analysis model versions.

## CI policy

    pnpm permguard scan . --ci
    pnpm permguard scan . --ci --fail-on CRITICAL
    pnpm permguard diff . --baseline permguard-baseline.json --ci --fail-on HIGH

The default CI threshold is HIGH. INFO, WARNING, HIGH, and CRITICAL are valid
thresholds. Issues at or above the threshold block the command.

Exit codes are:

- 0 for successful analysis and a passing policy
- 1 for configuration, filesystem, baseline, or analysis failure
- 2 for invalid CLI arguments
- 3 for a failed CI severity policy

Findings are evaluated from the current result, independently of whether they
are new in the diff. This prevents an existing high-severity issue from being
silently accepted.

## Git and CI boundaries

The diff package has no git or CI-provider dependency. CI systems should create
or retrieve the baseline artifact from the desired base revision. Direct
git-ref materialization is intentionally left outside core analysis logic and
may be added as a CLI adapter later.
