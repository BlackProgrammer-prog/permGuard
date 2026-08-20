# @permguard/analyzer

TypeScript AST-based static authorization analysis for PermGuard.

```ts
import {
  createAnalyzerProject,
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
```

The analyzer creates one TypeScript `Program`, exposes its single
`TypeChecker`, selects tsconfig root files, normalizes project-relative paths,
and collects stable syntax diagnostics.

Route Handler discovery recognizes supported HTTP method exports in
`app/**/route.*` and `src/app/**/route.*`, including named export aliases.
Route groups and parallel slots are removed from URL paths; private folders are
ignored.

Server Action discovery recognizes file-level and inline `"use server"`
directives on async functions. CASL usage detection recognizes imported CASL
definitions and checks plus PermGuard React UI usages. Every pass must reuse the
existing project instead of reparsing files.

See `docs/adr/0001-typescript-compiler-api.md` for the AST decision.
