# Contributing

Thanks for helping make authorization behavior easier to review.

## Before coding

1. Read `AGENTS.md`, the architecture, and the security model.
2. Search existing issues and pull requests.
3. For analyzer changes, read the AST ADR and relevant phase note.
4. Keep the change inside one clear package boundary.

CASL is the permission engine. Contributions must not recreate CASL rule evaluation.

## Setup

```bash
git clone https://github.com/BlackProgrammer-prog/permGuard.git
cd permGuard
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

Node.js 20, 22, and 24 are tested in CI. The repository pins pnpm through `packageManager`.

## Making changes

- use strict TypeScript and avoid `any`
- keep public APIs small and explicit
- preserve dependency direction toward `core`
- do not put source analysis in graph, reporter, or CLI packages
- parse source once and reuse the analyzer project
- fail closed in server integrations
- treat client checks only as UX
- assign confidence to uncertain findings
- keep output deterministic

## Tests

Run focused tests while developing:

```bash
pnpm vitest run packages/analyzer/src/http-clients/detect-http-client-usage.test.ts
```

Before submitting:

```bash
pnpm check
```

If a package manifest, build output, README, exports, or release script changed:

```bash
pnpm release:verify
```

Analyzer regressions should use realistic fixtures and assert detection, stable IDs, and one-based source locations.

## Documentation

Update the root README or relevant guide when changing:

- public exports
- CLI options or exit codes
- detection behavior or confidence
- analysis model fields
- supported Node, React, Next.js, or TypeScript versions
- release behavior

Record user-visible changes in `CHANGELOG.md`.

## Pull requests

Keep commits reviewable. In the pull request, explain the observable behavior, architectural impact, test evidence, known false positives or negatives, and whether the change affects package compatibility.

By contributing, you agree that your contribution is licensed under MIT.
