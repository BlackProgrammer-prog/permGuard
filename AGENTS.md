# PermGuard — Codex Instructions

## Project Goal

PermGuard is an open-source TypeScript authorization tooling project focused on full-stack applications, starting with Next.js.

PermGuard is **NOT** a new authorization engine.

The project MUST reuse **CASL** for core permission evaluation whenever practical.

Do not reimplement functionality already provided well by CASL.

Our main value is built around CASL:

- Next.js integration
- React integration
- authorization enforcement helpers
- static authorization analysis
- missing permission detection
- permission usage analysis
- authorization graph generation
- authorization coverage
- HTML reports
- permission diff
- CI validation

---

# Core Principle

CASL answers:

> Can this user perform this action on this subject?

PermGuard answers:

> Where are permissions defined, used, enforced, missing, inconsistent, and changing across the application?

PermGuard should complement CASL, not compete with it.

---

# Technology Stack

Use:

```text
TypeScript
Node.js 20+
pnpm
pnpm workspaces
Vitest
CASL
```

Next.js is the first officially supported framework.

React support is required because Next.js uses React.

Avoid adding dependencies unless there is a clear reason.

---

# Authorization Engine

Use CASL as the authorization engine.

Primary dependency:

```text
@casl/ability
```

Potential React integration may use:

```text
@casl/react
```

only if doing so provides a clear advantage.

Before adding another CASL package, inspect whether the required feature can be implemented cleanly using `@casl/ability`.

Do NOT copy CASL source code into this repository.

Do NOT fork CASL logic unnecessarily.

Do NOT recreate:

- Ability
- AbilityBuilder
- can()
- cannot()
- subject matching
- CASL rule evaluation
- CASL condition evaluation

Prefer wrappers and integrations.

---

# Intended Developer Experience

A developer may define authorization using CASL:

```ts
import { AbilityBuilder, createMongoAbility } from "@casl/ability";

export function defineAbilityFor(user: User) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === "admin") {
    can("manage", "all");
  }

  if (user.role === "editor") {
    can("read", "Product");
    can("update", "Product");
  }

  cannot("delete", "Product");

  return build();
}
```

PermGuard should make that authorization easy to use throughout Next.js.

Example server API:

```ts
const ability = await getAbility();

requireCan(ability, "delete", "Product");
```

Example React API:

```tsx
<Can action="delete" subject="Product">
  <DeleteButton />
</Can>
```

Exact APIs may evolve.

Do not introduce abstractions until they provide real value over raw CASL.

---

# Security Model

The server is always authoritative.

Client-side permission checks exist only for UI and UX.

A hidden button does NOT provide authorization security.

Every sensitive server operation must independently enforce authorization.

Never trust permission decisions coming from the browser.

Never trust role or permission lists submitted by the client.

Unknown or invalid authorization states should fail closed where practical.

Avoid sending full server-side CASL rules to the browser when they contain sensitive conditions or data.

Client snapshots must expose only what is required for rendering UI.

---

# Monorepo Structure

Target structure:

```text
packages/
  core/
  server/
  react/
  next/
  analyzer/
  graph/
  reporter/
  cli/

examples/
  next-basic/
  next-advanced/

fixtures/
  analyzer/

docs/
```

Packages may evolve, but maintain clear boundaries.

---

# Package Responsibilities

## packages/core

Shared framework-independent PermGuard types and abstractions around CASL.

May contain:

- shared authorization types
- permission usage records
- analysis model types
- issue types
- graph types
- configuration types
- CASL adapter abstractions where needed

Do not build a competing policy engine here.

Avoid creating wrappers that simply rename CASL APIs without adding value.

---

## packages/server

Server-side helpers.

Examples:

```ts
requireCan();
assertCan();
getAbility();
```

Potential responsibilities:

- standardized Forbidden errors
- server authorization helpers
- safe permission snapshot generation

This package must never depend on React.

---

## packages/react

React-specific helpers.

Potential API:

```tsx
<Can />
<PermissionProvider />
```

Hooks may include:

```ts
useCan();
useAbility();
```

Prefer CASL-native behavior where possible.

Do not duplicate `@casl/react` unless PermGuard requires functionality it does not provide.

---

## packages/next

Next.js integration.

Primary targets:

- App Router
- Server Components
- Server Actions
- Route Handlers

Possible APIs:

```ts
withAuthorization();
protectRoute();
getServerAbility();
```

Keep authorization explicit.

Avoid invisible global magic.

---

## packages/analyzer

Static source-code analyzer.

This is a major part of PermGuard.

It should detect authorization usage and problems in application source code.

Examples:

- protected routes
- unprotected routes
- Server Actions
- authorization checks
- unknown permissions
- unused permissions
- inconsistent checks
- possible authorization drift

The analyzer must use a real AST.

Do NOT use regex as the primary parser.

---

# AST Strategy

Before implementing the analyzer, compare:

- TypeScript Compiler API
- ts-morph
- SWC parser

Document the decision.

Requirements:

- TypeScript support
- JSX/TSX support
- source locations
- import resolution
- call-expression analysis
- maintainability
- deterministic output

Do not implement the analyzer before the AST choice is documented.

---

## packages/graph

Build the authorization graph from analyzer output.

The graph should represent more than:

```text
Role -> Permission
```

It should eventually model relationships such as:

```text
Role
  ↓
Permission
  ↓
React Component
  ↓
Server Action
  ↓
Route
```

Possible node types:

- role
- permission
- component
- route
- HTTP method
- server action
- authorization check
- resource
- file

Possible edge types:

- grants
- requires
- enforces
- invokes
- protects
- inherits
- references

Graph construction must consume the internal analysis model.

It must not parse source files independently.

---

## packages/reporter

Generate reports from analyzer output.

Initial formats:

```text
HTML
JSON
```

HTML reports must be static and viewable offline.

The reporter must NOT contain source-code analysis logic.

Architecture:

```text
Source
  ↓
Analyzer
  ↓
Analysis Model
  ↓
Reporter
```

---

## packages/cli

CLI entrypoint.

Potential commands:

```bash
permguard scan
permguard report
permguard graph
permguard diff
```

CLI must orchestrate packages rather than contain business logic.

---

# Internal Analysis Model

Analysis must produce a framework-independent intermediate model.

Conceptually:

```ts
interface AnalysisResult {
  permissions: PermissionRecord[];
  roles: RoleRecord[];

  routes: RouteRecord[];
  serverActions: ServerActionRecord[];

  authorizationChecks: AuthorizationCheck[];

  usages: PermissionUsage[];

  issues: AuthorizationIssue[];

  graph: AuthorizationGraph;

  coverage: AuthorizationCoverage;
}
```

Exact types may change.

The architectural rule must remain:

```text
SOURCE CODE
    ↓
ANALYZER
    ↓
ANALYSIS MODEL
    ↓
CLI / GRAPH / JSON / HTML
```

Never tightly couple analysis to rendering.

---

# Static Analysis Goals

Eventually detect:

## Missing Authorization

Example:

```text
DELETE /api/products/[id]

Authentication: detected
Authorization: missing
```

## Server Action Without Authorization

Example:

```text
deleteProduct()

No authorization enforcement detected.
```

## Unknown Authorization References

Example:

```ts
requireCan(ability, "remove", "Product");
```

when expected project usage is:

```text
delete Product
```

Do not automatically assume this is incorrect unless enough project evidence exists.

Mark uncertain findings appropriately.

---

## Unused Authorization Rules

Rules, subjects, actions, or permission aliases that appear to be defined but never referenced.

Because CASL policies can be dynamic, the analyzer must distinguish:

```text
definite
probable
unknown
```

when necessary.

---

## Authorization Mismatch

Example:

```text
Client:
delete Product

Server:
update Product
```

Report potentially inconsistent authorization.

---

## Authorization Drift

Detect changes where authorization behavior becomes inconsistent between layers or between repository revisions.

Do not overclaim certainty.

---

# Authorization Coverage

Coverage should answer:

> At expected authorization boundaries, how many contain a recognized authorization check?

Possible report:

```text
Routes             92%
Server Actions     84%
Sensitive Actions  91%
Overall            89%
```

Never claim:

```text
100% coverage = secure
```

Coverage measures detected enforcement presence, not policy correctness.

---

# HTML Dashboard

The static HTML report should eventually include:

```text
Overview
Roles
Abilities
Routes
Server Actions
Issues
Coverage
Authorization Graph
```

Possible overview:

```text
Authorization Health

Routes             31
Protected Routes   28

Server Actions     19
Protected Actions  17

Issues              5
```

Do not build a backend service just for the report.

The report must be openable directly from disk.

---

# Issue Severity

Support:

```text
INFO
WARNING
HIGH
CRITICAL
```

Findings must include:

- title
- explanation
- file
- line/column when available
- confidence
- severity
- related authorization rule where possible

Example:

```text
HIGH

Missing authorization

app/api/products/[id]/route.ts:23

DELETE handler does not contain a recognized
authorization enforcement call.
```

---

# Confidence Levels

Static analysis is imperfect.

Every finding that is not certain should include confidence.

Suggested model:

```text
certain
high
medium
low
```

Avoid presenting heuristic findings as guaranteed vulnerabilities.

---

# CASL Awareness

The analyzer should understand common CASL patterns.

Examples:

```ts
ability.can("delete", "Product");
```

```ts
ForbiddenError.from(ability).throwUnlessCan("delete", "Product");
```

```ts
can("read", "Product");
```

when inside recognized CASL ability-definition code.

Do not assume every function named `can()` belongs to CASL.

Use imports and AST resolution where practical.

---

# Next.js Awareness

The analyzer should eventually understand:

```text
app/**/route.ts
app/**/route.tsx

Server Actions

"use server"

Server Components

Client Components

middleware/proxy where relevant
```

Do not attempt full Next.js framework support in the first analyzer version.

Start with Route Handlers and Server Actions.

---

# Diff Support

Eventually:

```bash
permguard diff
```

Compare authorization-relevant changes.

Examples:

```text
+ manager can delete Product

- editor can publish Article

+ DELETE /api/orders/[id]
  no authorization detected
```

Keep git integration separate from core analyzer logic where possible.

---

# CI Mode

Eventually support:

```bash
permguard scan --ci
```

Allow configuration such as:

```text
fail on HIGH
fail on CRITICAL
```

Return non-zero exit status when configured thresholds are exceeded.

Remain CI-provider independent.

Do not require GitHub Actions.

---

# Configuration

Potential config:

```text
permguard.config.ts
```

Example:

```ts
export default defineConfig({
  framework: "next",

  authorization: {
    provider: "casl",
  },

  analyzer: {
    serverActions: true,
    routeHandlers: true,
  },
});
```

Keep configuration small.

Do not introduce configuration options before the implementation needs them.

---

# Dependency Rules

Dependency direction should remain simple.

Conceptually:

```text
core

server    -> core
react     -> core
next      -> core/server/react as required

analyzer  -> core
graph     -> core
reporter  -> core
cli       -> analyzer/graph/reporter
```

Avoid circular dependencies.

`core` must never depend on:

- React
- Next.js
- CLI
- reporter

`analyzer` must never depend on:

- HTML reporter
- CLI

`graph` must not parse application source directly.

---

# Development Rules

Work incrementally.

Do not implement multiple roadmap phases in one task unless explicitly requested.

Before modifying code:

1. inspect repository
2. read this AGENTS.md
3. inspect relevant docs
4. inspect package boundaries
5. inspect existing tests
6. understand existing public APIs

Then briefly state what will change.

---

# After Every Implementation

Run available:

```text
format
lint
typecheck
tests
```

Run focused tests first.

Run the full test suite when practical.

Inspect git diff afterward.

Report:

- files changed
- dependencies added
- tests executed
- typecheck status
- known limitations

Never hide failing tests.

---

# Code Quality

Use strict TypeScript.

Avoid `any`.

If `any` is unavoidable, explain why in code or surrounding architecture.

Prefer:

- small modules
- explicit types
- pure functions
- deterministic outputs
- stable public interfaces
- dependency injection where actually useful

Avoid:

- unnecessary inheritance
- huge service classes
- global mutable state
- speculative abstractions
- excessive generics
- clever type tricks that hurt readability
- dependency-heavy architecture

---

# Public API Philosophy

PermGuard APIs should feel small and obvious.

Good:

```ts
requireCan(ability, "delete", "Product");
```

Bad:

```ts
AuthorizationRuntimePolicyExecutionCoordinator
  .create(...)
  .resolve(...)
  .evaluate(...)
```

Avoid enterprise-style naming.

Developer experience matters.

---

# Performance

Correctness and architecture come first.

However the analyzer may eventually process large repositories.

Avoid obviously inefficient designs such as reparsing the same source file repeatedly.

Prefer:

```text
parse once
build model
run multiple analysis passes
```

Performance optimization should be benchmark-driven.

---

# Testing Strategy

Use Vitest.

Each package should contain unit tests where appropriate.

The analyzer should also use fixture projects.

Example:

```text
fixtures/analyzer/

  protected-route/
  missing-route-auth/
  protected-server-action/
  missing-server-action-auth/
  casl-basic/
```

Fixtures should represent real TypeScript/Next.js source code.

Analyzer regression tests should verify both:

- detected issues
- source locations

---

# Example Applications

Maintain example applications separately from analyzer fixtures.

```text
examples/

  next-basic/
  next-dashboard/
```

Examples demonstrate actual developer usage.

Fixtures exist specifically for automated analyzer tests.

Do not mix the two purposes.

---

# Documentation

Maintain:

```text
docs/architecture.md
docs/security-model.md
docs/roadmap.md
```

Important architecture decisions can use:

```text
docs/adr/
```

Only create ADRs for meaningful decisions.

Do not document trivial implementation choices.

---

# Non-Goals

Do NOT build:

- authentication
- login system
- OAuth provider
- identity provider
- user database
- Keycloak alternative
- CASL alternative
- cloud authorization service
- SaaS dashboard
- enterprise IAM
- policy database
- graphical policy editor
- Kubernetes components
- microservices platform

PermGuard analyzes and integrates authorization.

It does not own user identity.

---

# Roadmap

Follow approximately:

```text
Phase 0
Repository and architecture

Phase 1
CASL foundation and shared types

Phase 2
Server helpers

Phase 3
React integration

Phase 4
Next.js integration

Phase 5
Analyzer foundation

Phase 6
Route Handler discovery

Phase 7
Server Action discovery

Phase 8
CASL usage detection

Phase 9
Issue detection

Phase 10
Authorization graph

Phase 11
Coverage

Phase 12
CLI

Phase 13
HTML reporter

Phase 14
Authorization diff and CI

Phase 15
Hardening and documentation
```

Do not skip ahead.

---

# Important Final Rule

Whenever existing CASL functionality solves a problem cleanly:

**USE CASL.**

Before writing authorization engine code from scratch, check whether CASL already provides it.

PermGuard should spend its engineering effort on what CASL does not primarily solve:

```text
Integration
Enforcement consistency
Static analysis
Visualization
Coverage
Auditing
Diff
CI
```

When uncertain whether to implement something ourselves or use CASL, prefer CASL unless doing so would compromise PermGuard's analyzer or framework-integration architecture.
