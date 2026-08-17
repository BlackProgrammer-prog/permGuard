# PermGuard

PermGuard is authorization tooling for full-stack TypeScript applications. It complements [CASL](https://casl.js.org/) with framework integration, static analysis, coverage, reporting, and CI validation.

The repository is currently in **Phase 0: repository and architecture**. No authorization engine is implemented here; CASL will remain the source of truth for permission evaluation.

## Requirements

- Node.js 20 or newer
- pnpm 10

## Development

```bash
corepack enable
pnpm install
pnpm check
```

See [docs/architecture.md](docs/architecture.md), [docs/security-model.md](docs/security-model.md), and [docs/roadmap.md](docs/roadmap.md).
