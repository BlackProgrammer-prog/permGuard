# PermGuard

PermGuard is authorization tooling for full-stack TypeScript applications. It complements [CASL](https://casl.js.org/) with framework integration, static analysis, coverage, reporting, and CI validation.

Phases 0–9 are complete: repository architecture, CASL-aware integrations, boundary discovery, import-aware CASL usage detection, and conservative authorization issue detection. CASL remains the source of truth for permission evaluation.

## Requirements

- Node.js 20 or newer
- pnpm 10

## Development

```bash
corepack enable
pnpm install
pnpm check
```

See [docs/architecture.md](docs/architecture.md), [docs/security-model.md](docs/security-model.md), [docs/phase-8-casl-usage-detection.md](docs/phase-8-casl-usage-detection.md), [docs/phase-9-issue-detection.md](docs/phase-9-issue-detection.md), and [docs/roadmap.md](docs/roadmap.md).
