# @ironpermjs/analyzer

TypeScript AST-based static authorization analysis for IronPermJS.

```ts
import {
  calculateAuthorizationCoverage,
  createAnalyzerProject,
  detectAuthorizationIssues,
  detectCaslUsage,
  discoverRouteHandlers,
  discoverServerActions,
} from "@ironpermjs/analyzer";

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
const coverage = calculateAuthorizationCoverage({
  routes: analysis.routes,
  serverActions: analysis.serverActions,
  authorizationChecks: caslUsage.authorizationChecks,
});
```

The analyzer creates one TypeScript `Program` and reuses its source files and
`TypeChecker` across every pass. Route Handler and Server Action discovery
produce authorization boundaries. CASL usage detection produces definitions,
checks, and UI usages. Issue detection associates checks with function bodies
and reports missing, unknown, unused, or unverifiable authorization findings.
Coverage measures recognized server-side enforcement presence and does not
claim that the discovered policy is correct or secure.

See `docs/adr/0001-typescript-compiler-api.md` for the AST decision.
