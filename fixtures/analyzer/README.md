# Analyzer fixtures

Analyzer regression-test inputs belong here. Fixtures are not example applications.

- `foundation-basic`: valid TS/TSX files with a resolvable local import.
- `foundation-invalid`: invalid TypeScript used to verify syntax diagnostics.
- `route-handlers`: App Router methods, aliases, groups, slots, and ignored
  private or Pages Router files.
- `route-handlers-src`: the optional `src/app` convention.

Each discovery phase should add focused fixture projects instead of turning
existing fixtures into general-purpose examples.
