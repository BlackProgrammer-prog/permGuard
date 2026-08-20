# @permguard/analyzer

TypeScript AST-based static authorization analysis for PermGuard.

```ts
import {
  createAnalyzerProject,
  detectAuthorizationIssues,
  detectCaslUsage,
  discoverRouteHandlers,
  discoverServerActions,
} from "@permguard/analyzer";

const project = createAnalyzerProject({
  rootDir: process.cwd(),
});
const routes = discoverRouteHandlers(project);
const serverActions = discoverServerActions(project);
const caslUsage = detectCaslUsage(project);
const analysis = detectAuthorizationIssues({
  project,
  routes,
  serverActions,
  caslUsage,
});
```

The analyzer creates one TypeScript `Program` and reuses its source files and
`TypeChecker` across every pass. Route Handler and Server Action discovery
produce authorization boundaries. CASL usage detection produces definitions,
checks, and UI usages. Issue detection associates checks with function bodies
and reports missing, unknown, unused, or unverifiable authorization findings.

See `docs/adr/0001-typescript-compiler-api.md` for the AST decision.
