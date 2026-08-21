# Phase 12: Authorization coverage

Authorization coverage measures recognized server-side enforcement at expected
boundaries. It does not prove that a policy is correct or that an application
is secure.

## Metrics

The analyzer reports separate metrics for Route Handlers and Server Actions,
plus an overall metric. Each contains detected, expected, and percentage.

A boundary is detected only when at least one of its authorizationCheckIds
refers to an AuthorizationCheck in the analysis model. Unknown or stale IDs do
not count. Multiple checks inside one boundary still count as one protected
boundary.

Percentages are rounded to two decimal places. An empty category reports 100
percent because it has no uncovered expected boundaries. Consumers should
display the detected and expected counts alongside the percentage to avoid
misinterpretation.

## Security interpretation

Coverage answers whether recognized enforcement is present at discovered
boundaries. It does not validate permission correctness, control flow, CASL
conditions, authentication, data filtering, or runtime behavior. Public
boundaries are currently included because the configuration model cannot yet
declare them explicitly.
