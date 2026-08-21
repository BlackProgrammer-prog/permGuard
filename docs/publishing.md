# Publishing IronPermJS to npm

IronPermJS is a fixed-version monorepo: all nine public packages use the same version and are released together.

## Important: choose an npm scope you own

The repository currently names packages `@ironpermjs/*`. The `@ironpermjs` scope is already associated with another product on npm. Public publication will fail unless your npm account is a member of that organization.

Before the first release, choose one of these paths:

1. Prove that your npm account owns or has publish access to `@ironpermjs`.
2. Rename every `@ironpermjs/*` package and internal import to a scope you own, such as your npm organization.
3. Use unscoped package names only after checking every name individually.

Do not publish with a borrowed or ambiguous scope. After renaming, run `pnpm install`, `pnpm check`, and `pnpm release:verify`.

## What is already automated

Each package declares:

- public npm access
- the npm public registry
- provenance generation
- Node.js 20+ compatibility
- repository, package directory, homepage, issues, keywords, and MIT license
- only `dist` as ordinary package payload

`scripts/release-packages.mjs`:

1. packs packages in dependency order with pnpm
2. converts `workspace:*` dependencies to real release versions
3. inspects each tarball
4. rejects missing README, LICENSE, JavaScript, declarations, or CLI binary
5. rejects leaked `workspace:` protocols
6. rejects mixed versions or incorrect publishing metadata
7. requires a matching npm scope and Git tag before real publication
8. publishes the tarballs with npm

The npm CLI publishes packed tarballs rather than workspace directories so trusted publishing and pnpm workspace dependency rewriting both work correctly.

## Local release checks

```bash
pnpm check
pnpm release:verify
pnpm release:smoke
pnpm release:dry-run
```

Generated tarballs are written to `.release/` and ignored by Git. The smoke test installs them in an isolated temporary project, runs the CLI, imports all nine packages, and removes the temporary directory.

`release:dry-run` invokes `npm publish --dry-run` for every exact tarball. It does not publish.

## Versioning

All package versions must match. Before a release:

1. choose a SemVer version
2. update `version` in all nine `packages/*/package.json` files
3. update internal release notes in `CHANGELOG.md`
4. run `pnpm install` to refresh the lockfile when needed
5. run the complete checks
6. commit the version change
7. tag the commit as `vX.Y.Z`

A package name and version cannot be reused on npm, even after unpublishing. Never retry a partially published version; diagnose, increment the version, and release again.

## Bootstrap the packages

npm trusted publishers are normally configured on an existing package. The first publication may therefore need to be performed by a maintainer using npm authentication and required 2FA.

Before bootstrapping:

```bash
npm whoami
npm access ls-packages
pnpm release:dry-run
```

Inspect every tarball in `.release/`. Publish in this dependency order:

1. core
2. server
3. react
4. next
5. analyzer
6. graph
7. diff
8. reporter
9. cli

Use the generated tarballs, public access, and your normal secure npm authentication. Do not place a long-lived npm token in the repository.

## Configure npm trusted publishing

After every package exists:

1. open each package on npm
2. open package settings and Trusted Publisher
3. choose GitHub Actions
4. set organization/user to `BlackProgrammer-prog`
5. set repository to `IronPermJS`
6. set workflow filename to `publish.yml`
7. leave the environment blank unless the workflow is changed to use one
8. repeat for all nine packages

Trusted publisher values must exactly match the repository and workflow.

The workflow uses:

- a GitHub-hosted runner
- Node.js 24
- npm 11.5.1 or newer
- `permissions: id-token: write`
- no long-lived `NPM_TOKEN`

## Configure the GitHub repository

Create a repository Actions variable:

```text
NPM_SCOPE=@your-owned-scope
```

It must exactly match the scope in every public package name. The release script intentionally fails when it is missing or mismatched.

Recommended repository settings:

- default branch protection requiring the `CI` checks
- pull requests before merge
- no force pushes to the default branch
- release workflow approval if your team uses protected environments
- secret scanning and dependency alerts enabled
- tags created only from reviewed default-branch commits

## Publish from GitHub

1. ensure CI is green on the release commit
2. create tag `vX.Y.Z`
3. create a GitHub Release for that exact tag
4. publish the GitHub Release
5. watch the `Publish packages` workflow
6. verify provenance and package contents on npm
7. install the CLI in a clean test project

The workflow rejects a tag that does not equal the package version.

## Post-release smoke test

```bash
mkdir ironpermjs-smoke
cd ironpermjs-smoke
pnpm init
pnpm add -D @your-scope/cli
pnpm exec ironpermjs --version
pnpm exec ironpermjs --help
```

For runtime packages, import each installed package from a minimal ESM script and run Node.

## Recovery

### One package published, later package failed

Do not republish the same version after changing contents. Fix the cause, increment every package version, document the partial release, and publish the new version.

### OIDC authentication failed

Confirm:

- npm CLI is at least 11.5.1
- Node is at least 22.14
- `id-token: write` is present
- the runner is GitHub-hosted
- npm Trusted Publisher uses `publish.yml`
- organization, repository, and optional environment match exactly

### Scope validation failed

The GitHub `NPM_SCOPE` variable does not match package names. Either correct the variable or complete the package rename. Do not bypass the check.
