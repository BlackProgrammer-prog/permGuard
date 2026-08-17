# Architecture

PermGuard complements CASL; it does not implement a second permission engine. CASL answers whether an action is allowed, while PermGuard locates definitions, usages, enforcement points, gaps, and changes.

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
- `reporter`: offline HTML and JSON rendering from core models.
- `cli`: orchestration over analyzer, graph, and reporter.

Dependencies flow toward `core`; circular dependencies are not allowed.

## Analyzer decision gate

Before analyzer implementation, an ADR must compare the TypeScript Compiler API, ts-morph, and SWC for TS/TSX support, locations, import resolution, call analysis, maintainability, and deterministic output.
