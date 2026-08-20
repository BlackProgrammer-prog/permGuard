# @permguard/analyzer

TypeScript AST-based static authorization analysis for PermGuard.

```ts
import {
  createAnalyzerProject,
  discoverRouteHandlers,
} from "@permguard/analyzer";

const project = createAnalyzerProject({
  rootDir: process.cwd(),
});

const routes = discoverRouteHandlers(project);
```

The analyzer creates one TypeScript `Program`, exposes its single
`TypeChecker`, selects tsconfig root files, normalizes project-relative paths,
and collects stable syntax diagnostics.

Route Handler discovery recognizes supported HTTP method exports in
`app/**/route.*` and `src/app/**/route.*`, including named export aliases.
Route groups and parallel slots are removed from URL paths; private folders are
ignored.

Server Action and CASL usage discovery are intentionally later phases. Every
pass must reuse the existing project instead of reparsing files.

See `docs/adr/0001-typescript-compiler-api.md` for the AST decision.
