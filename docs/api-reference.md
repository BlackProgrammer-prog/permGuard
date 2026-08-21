# Public API reference

This page describes the intended public surface. Import from each package root; internal source paths are not public API.

## @permguard/core

`@permguard/core` contains framework-independent model and authorization types. It does not evaluate permissions and does not depend on React, Next.js, the CLI, or reporters.

Important exports:

- `ANALYSIS_MODEL_VERSION`
- `AnalysisResult`
- records for permissions, roles, routes, Server Actions, client requests, checks, usages, issues, graph, and coverage
- `AuthorizationIssue`, `IssueSeverity`, `FindingConfidence`
- `PermissionDescriptor`, `PermissionSnapshot`, and `SourceLocation`
- selected CASL types such as `AnyAbility`, `MongoAbility`, and `RawRuleOf`

Use these types when building a custom reporter or CI integration.

## @permguard/server

### requireCan

```ts
requireCan(ability, action, subject, field?)
```

Delegates denial semantics to CASL's `ForbiddenError.from(ability).throwUnlessCan()`. It returns `void` when allowed and throws when denied.

```ts
import { requireCan } from "@permguard/server";

requireCan(ability, "update", "Product");
```

### isForbiddenError

```ts
isForbiddenError(error: unknown): boolean
```

A type guard for CASL `ForbiddenError`. Use it when a framework adapter should translate authorization denials while rethrowing unexpected failures.

### createPermissionSnapshot

```ts
createPermissionSnapshot(ability, candidates);
```

Evaluates a fixed list of action/subject/optional-field candidates, keeps allowed candidates, preserves order, and removes duplicates. It does not serialize raw CASL rules.

### ForbiddenError

Re-exported from `@casl/ability` for convenience.

## @permguard/react

### AbilityProvider and useAbility

Re-exported from the official `@casl/react` integration.

### Can

```tsx
<Can
  action="update"
  subject="Product"
  field="title"
  not={false}
  fallback={null}
>
  <EditButton />
</Can>
```

Props:

- `action`: action string
- `subject`: CASL subject type or object
- `field`: optional field permission
- `not`: invert the result
- `fallback`: rendered when denied
- `children`: React node or `(isAllowed) => ReactNode`

### useCan

```ts
const allowed = useCan(action, subject, field?);
```

Subscribes through `@casl/react` and reevaluates when the current ability changes.

React APIs are UI controls, not server security boundaries.

## @permguard/next

### createNextAuthorization

```ts
const authorization = createNextAuthorization(resolveAbility);
```

`resolveAbility` can be synchronous or asynchronous and is called once per protected invocation.

Returned methods:

- `requireCan(action, subject, field?)`: resolves an ability, enforces through `@permguard/server`, and returns the ability
- `withAuthorization(permissionTuple, handler, options?)`: wraps a Next.js App Router Route Handler

### withAuthorization options

```ts
{
  onForbidden?: (error) => Response | Promise<Response>
}
```

Only recognized CASL denial errors are translated. Authentication, database, and programmer errors are rethrown.

### forbiddenResponse

Creates the default JSON 403 response:

```json
{ "error": "Forbidden" }
```

### Route types

The package exports `AppRouteHandler`, `PermGuardRouteContext`, `RouteParameters`, and `WithAuthorizationOptions` for typed wrappers.

## @permguard/analyzer

Low-level AST APIs:

- `createAnalyzerProject`
- `discoverRouteHandlers`
- `discoverServerActions`
- `detectCaslUsage`
- `detectHttpClientUsage`
- `detectAuthorizationIssues`
- `calculateAuthorizationCoverage`
- `getSourceLocation`

The recommended high-level entry point is `analyzeProject()` from `@permguard/cli`, which runs passes in the supported order. Low-level APIs are useful for custom tooling and tests.

The project object holds one TypeScript `Program`, `TypeChecker`, stable source list, normalized root, and diagnostics.

## @permguard/graph

### buildAuthorizationGraph

Consumes analysis records and returns a deterministic graph. It never parses source code. Inputs can include permissions, routes, Server Actions, client requests, authorization checks, usages, and roles.

## @permguard/diff

### diffAnalysisResults

```ts
const diff = diffAnalysisResults(before, after);
```

Compares authorization-relevant records and returns semantic additions, removals, and changes.

### evaluateCiPolicy

```ts
const result = evaluateCiPolicy(analysis, { failOn: "HIGH" });
```

Returns the normalized threshold, blocking issues, and `passed`. It does not terminate the process.

## @permguard/reporter

### renderJsonReport

Returns a deterministic JSON representation of an `AnalysisResult`.

### renderHtmlReport

Returns one self-contained static HTML document. Options currently include `projectName`. The output performs no network requests and needs no report server.

## @permguard/cli

### analyzeProject

```ts
const result = analyzeProject({
  rootDir: "/absolute/project/path",
  tsconfigPath: "/absolute/project/tsconfig.json",
  additionalClientModules: ["@/lib/api-client"],
});
```

Runs project creation, boundary discovery, CASL detection, issue detection, HTTP client matching, coverage, and graph construction.

### parseCliArguments and runCli

Exported for programmatic integration and testing. `runCli` supports injected IO and analysis dependencies and returns the intended process exit code without calling `process.exit()`.

## Compatibility

All packages are ESM and require Node.js 20 or newer. React and Next.js are peer dependencies of their integration packages. Public declarations are emitted with strict TypeScript settings.

Pre-1.0 releases may make deliberate API changes. Such changes must be recorded in [CHANGELOG.md](../CHANGELOG.md).
