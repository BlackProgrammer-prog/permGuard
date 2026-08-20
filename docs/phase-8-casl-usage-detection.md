# Phase 8: CASL usage detection

Phase 8 detects statically knowable CASL permission definitions, server-side
authorization checks, and PermGuard React UI usages. It emits existing core
analysis records and does not evaluate permissions or create issues.

## Permission definitions

The pass recognizes import-backed CASL patterns:

- `can()` and `cannot()` destructured from `new AbilityBuilder(...)`
- aliases such as `const { can: allow } = ...`
- callback parameters passed to imported `defineAbility()`
- literal action or subject arrays, expanded into individual permissions

Definition results are `PermissionRecord` values. Inverted `cannot()` rules set
`inverted: true`. A corresponding `PermissionUsage` with kind `definition` is
also emitted.

## Authorization checks

The pass recognizes:

- a type-resolved CASL `ability.can()` call
- `ability.can()` on an ability produced by an imported CASL
  `AbilityBuilder.build()` binding
- imported `ForbiddenError.from(ability).throwUnlessCan()`
- imported PermGuard `requireCan()` from `@permguard/server`

These become `AuthorizationCheck` records and matching `PermissionUsage`
records with kind `check`.

## UI usages

Imported `<Can>` and `useCan()` helpers from `@permguard/react` become
`PermissionUsage` records with kind `ui`. UI usage is never treated as a
server-side authorization boundary.

## Static values and confidence

String literals and arrays containing only string literals are supported.
Dynamic action, subject, or mixed array expressions are skipped rather than
guessed. Import-backed and type-resolved findings use `certain` confidence.

## Intentional limits

- object and class-instance subjects are not converted to subject names yet
- permission aliases and computed values are not evaluated
- custom wrappers around CASL and PermGuard require future configuration support
- checks are not associated with Route Handlers or Server Actions in this phase
- issues such as missing, unknown, and mismatched permissions belong to phase 9

The pass reuses the `AnalyzerProject` program and checker and never reparses a
source file.
