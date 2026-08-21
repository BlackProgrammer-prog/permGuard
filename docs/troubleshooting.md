# Troubleshooting

## pnpm is available interactively but not in scripts

When Node and pnpm are installed through nvm, non-login shells may not load them. Locally, use the same login shell as your development session or enable Corepack:

```bash
corepack enable
corepack prepare pnpm@10.15.1 --activate
```

GitHub Actions does not rely on your shell profile; it installs pnpm explicitly.

## No TypeScript configuration found

Run from the application root or specify one:

```bash
permguard scan . --tsconfig ./tsconfig.app.json
```

The path is resolved from the current working directory.

## A valid CASL check was not detected

Prefer direct, imported CASL or PermGuard APIs. Highly dynamic aliases may be intentionally unresolved. Check that:

- the function is imported from CASL or a recognized PermGuard package
- action and subject are string literals or supported literal arrays
- the boundary implementation is included by the selected tsconfig
- generated files are present before analysis

Open an issue with a minimal fixture if a common pattern is missing.

## Axios or a wrapper is not linked to a route

Axios, Axios instances, `fetch`, and `ky` are built in. For an imported wrapper:

```bash
permguard scan . --client-module "@/lib/api-client"
```

Use the exact module specifier from the import. Computed URLs and ambiguous dynamic segments may only produce low-confidence matches.

## CI exits with code 3

The analysis completed, but findings met the configured severity threshold. Read stderr and generate a report:

```bash
permguard report . -o permguard-report.html
```

Exit code 1 instead means configuration, filesystem, baseline, or analysis failure.

## The HTML report opens without styling or data

Regenerate it with the current CLI. The output should be a single self-contained HTML file. Do not extract or copy only part of it.

## A baseline cannot be loaded

Create the baseline with `scan --json`, not `graph --json`. Confirm its `modelVersion` is supported and the JSON was not wrapped in terminal logs.

## npm publication says the scope is unavailable

The package scope must belong to your npm account or organization. The current `@permguard` scope is not assumed to be owned by this repository. Follow [publishing.md](publishing.md) and rename to a verified scope before publication.

## Tarball verification fails

Run:

```bash
pnpm check
pnpm release:verify
```

The verifier reports the package and missing or invalid field. Do not bypass it; fix the manifest, build output, README, LICENSE, version alignment, or workspace dependency.
