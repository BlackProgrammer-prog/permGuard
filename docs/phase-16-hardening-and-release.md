# Phase 16: hardening, documentation, and release

Phase 16 turns the completed feature set into a package set that can be reviewed, installed, and released safely.

## Delivered

### Package hardening

All nine public package manifests now declare repository and package directory, homepage, issue tracker, keywords, Node compatibility, public registry access, provenance, and an independent MIT license file.

The CLI reads its version from the installed package manifest, removing a source/version drift risk.

### Exact artifact verification

`scripts/release-packages.mjs` packs workspaces in dependency order. It verifies the artifacts that npm will receive rather than only source directories.

Validation covers:

- uniform versions
- public registry/access metadata
- repository metadata
- Node engine
- README and LICENSE
- ESM JavaScript and TypeScript declarations
- CLI binary
- absence of leaked `workspace:` dependency protocols

Real publication also requires a clean tracked worktree, Node 22.14+, npm 11.5.1+, explicit publish confirmation, an owned scope, and a tag matching the package version.

### CI and supply chain

GitHub CI tests Node 20, 22, and 24 and verifies tarballs on Node 24. Publishing is triggered by a GitHub Release and uses npm trusted publishing through GitHub OIDC, package provenance, and no long-lived npm token.

Dependabot, issue forms, pull-request guidance, security reporting, and a release checklist complete the maintenance baseline.

### Documentation

The documentation now includes a project overview, end-to-end tutorial, CLI reference, public API reference, troubleshooting, npm publishing, release checklist, contributor guide, security policy, changelog, and copy-ready Next.js examples.

## Scope decision

The code currently uses `@permguard/*`, but that npm scope is already associated with a different product. Publication remains intentionally blocked until the maintainer confirms access or renames packages to a scope they own. This is an external namespace decision, not something repository automation can safely guess.

## Verification contract

Every change should pass:

```bash
pnpm check
pnpm release:verify
pnpm release:smoke
```

Before a release, also run:

```bash
pnpm release:dry-run
```

These checks complement review; they do not claim that static analysis proves an application secure.
