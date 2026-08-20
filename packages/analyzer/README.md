# @permguard/analyzer

TypeScript AST foundation for PermGuard static authorization analysis.

```ts
import { createAnalyzerProject } from "@permguard/analyzer";

const project = createAnalyzerProject({
  rootDir: process.cwd(),
});

for (const file of project.sourceFiles) {
  // Future passes reuse file.sourceFile.
}
```

The analyzer creates one TypeScript `Program`, exposes its single
`TypeChecker`, selects tsconfig root files, normalizes project-relative paths,
and collects stable syntax diagnostics.

Route Handler, Server Action, and CASL usage discovery are intentionally later
phases. They must reuse this project instead of reparsing files.

See `docs/adr/0001-typescript-compiler-api.md` for the AST decision.
