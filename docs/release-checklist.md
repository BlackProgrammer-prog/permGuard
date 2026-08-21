# Release checklist

Use this checklist for every fixed-version monorepo release.

## Before the release

- [ ] npm scope ownership is confirmed.
- [ ] Every package has the same SemVer version.
- [ ] `CHANGELOG.md` describes user-visible changes.
- [ ] Public API and compatibility documentation are current.
- [ ] No secret, token, generated report, or private fixture is tracked.
- [ ] `pnpm install --frozen-lockfile` succeeds.
- [ ] `pnpm check` succeeds on a clean worktree.
- [ ] `pnpm release:verify` verifies all nine tarballs.
- [ ] `pnpm release:smoke` installs and imports all nine tarballs.
- [ ] `pnpm release:dry-run` succeeds.
- [ ] A tarball was manually inspected.

## GitHub and npm

- [ ] Repository variable `NPM_SCOPE` matches package names.
- [ ] Trusted Publisher points to `BlackProgrammer-prog/permGuard` and `publish.yml`.
- [ ] Trusted Publisher is configured for every package.
- [ ] Required CI checks pass on the release commit.
- [ ] Tag is exactly `vX.Y.Z`.
- [ ] GitHub Release uses the same tag and changelog notes.

## After publication

- [ ] All nine packages show the expected version.
- [ ] npm shows provenance for every package.
- [ ] The CLI installs in a clean directory.
- [ ] `permguard --version` matches the release.
- [ ] `permguard --help` runs.
- [ ] A small project can be scanned.
- [ ] Documentation install commands use the published scope.
