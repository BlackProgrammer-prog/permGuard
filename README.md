# PermGuard

PermGuard is authorization tooling for full-stack TypeScript applications. It complements [CASL](https://casl.js.org/) with framework integration, static analysis, coverage, reporting, and CI validation.

Phases 0?5 are complete: repository architecture, CASL-aware foundations, server and React helpers, Next.js integration, and the TypeScript AST analyzer foundation. CASL remains the source of truth for permission evaluation.

## Requirements

- Node.js 20 or newer
- pnpm 10

## Development

```bash
corepack enable
pnpm install
pnpm check
```

See [docs/architecture.md](docs/architecture.md), [docs/security-model.md](docs/security-model.md), [docs/phase-5-analyzer-foundation.md](docs/phase-5-analyzer-foundation.md), and [docs/roadmap.md](docs/roadmap.md).
