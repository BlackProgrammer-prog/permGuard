# Architecture

IronPermJS complements CASL; it does not implement a second permission engine. CASL answers whether an action is allowed, while IronPermJS locates definitions, usages, enforcement points, gaps, and changes.

## Data flow

```text
application source -> analyzer -> analysis model -> graph / JSON / HTML / CLI
```

Source is parsed once into a framework-independent analysis model. Graph and reporter packages consume that model and never parse application source themselves.

## Package boundaries

- `core`: shared types and models; no framework, renderer, or CLI dependencies.
- `server`: server-only enforcement helpers around CASL.
- `react`: UI integration; never a security boundary.
- `next`: explicit Next.js integration using core/server/react where appropriate.
- `analyzer`: AST parsing and analysis; depends only on core.
- `graph`: graph construction from core models.
- `diff`: semantic AnalysisResult comparison and CI severity policy.
- `reporter`: offline HTML and JSON rendering from core models.
- `cli`: orchestration over analyzer, graph, and reporter.

Dependencies flow toward `core`; circular dependencies are not allowed.

## Analyzer AST

The analyzer uses one TypeScript Compiler API `Program` and one `TypeChecker`
per analyzed project. Every discovery and detection pass must reuse those parsed
`SourceFile` objects. The decision and tradeoffs are recorded in
[`ADR 0001`](adr/0001-typescript-compiler-api.md).
