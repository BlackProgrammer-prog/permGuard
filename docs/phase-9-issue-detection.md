# Phase 9: Issue detection

Phase 9 associates recognized authorization checks with Next.js Route Handlers
and Server Actions, then creates conservative authorization issues from the
analysis records produced by earlier phases.

## Boundary association

A check is associated only when its source location is inside the resolved
function body. Being in the same file is not sufficient. Named re-exports are
resolved through the shared TypeScript `TypeChecker`, allowing a Route Handler
export to link to a function implemented in another project source file.

The pass returns new `RouteRecord` and `ServerActionRecord` values with stable,
sorted `authorizationCheckIds`. Input records are not mutated.

## Findings

### Missing route authorization

- severity: `HIGH`
- confidence: `high`

Emitted when a resolved Route Handler body has no recognized server-side
authorization check.

### Missing Server Action authorization

- severity: `HIGH`
- confidence: `high`

Emitted when a resolved Server Action body has no recognized server-side
authorization check.

### Unable to verify authorization

- severity: `WARNING`
- confidence: `low`

Emitted instead of a missing-authorization claim when the implementation body
cannot be resolved.

### Unknown permission reference

- severity: `WARNING`
- confidence: `medium`

Emitted only when at least one static CASL rule exists and a check or UI usage
is not covered by any detected rule. CASL `manage` actions, `all` subjects, and
field-wide definitions are treated as wildcards.

### Possibly unused authorization rule

- severity: `INFO`
- confidence: `medium`

Emitted when a detected rule covers no detected check or UI usage. The wording
is deliberately probabilistic because dynamic calls may not be statically
visible.

## Security interpretation

UI usages never satisfy a Route Handler or Server Action boundary. A detected
check measures recognized enforcement presence, not policy correctness. A
project may intentionally expose public routes; configuration for declaring
public boundaries is a later extension.

## Intentional limits

- custom authorization wrappers are not recognized without future configuration
- checks performed indirectly inside called helper functions are not followed
- a bare `ability.can()` call is recognized as a check, but control-flow proof is
  not attempted yet
- client/server permission mismatch requires the client-to-route relationships
  planned for phase 10
- dynamic policies can make unknown and unused findings incomplete
