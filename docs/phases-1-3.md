# Phases 1?3

## Phase 1: CASL foundation and shared types

`@permguard/core` contains the framework-independent contracts consumed by future analyzer, graph, reporter, and CLI packages:

- versioned `AnalysisResult`
- permission, role, route, Server Action, usage, and authorization-check records
- issue severity and confidence
- graph nodes and edges
- authorization coverage
- serializable permission snapshots

It does not wrap or replace CASL evaluation.

## Phase 2: server helpers

`@permguard/server` exposes:

- `requireCan(ability, ...permission)`
- `isForbiddenError(error)`
- CASL's native `ForbiddenError`
- `createPermissionSnapshot(ability, candidates)`

`requireCan` delegates directly to `ForbiddenError.from(ability).throwUnlessCan()`. Adapters may translate this error to their framework's 403 response, but the base package stays framework-independent.

Snapshots accept an explicit set of candidates, deduplicate allowed entries, and expose no CASL rule conditions. They are deliberately insufficient as a server security boundary.

## Phase 3: React integration

`@permguard/react` reuses the official `@casl/react` Provider and reactive hook. It adds:

- `<Can action subject />`, whose explicit props are easy for static analysis to recognize
- `useCan(action, subject, field?)`
- fallback, inverted, and render-function UI modes

Ability updates trigger UI updates through CASL's own subscription mechanism. UI checks are never authoritative.
