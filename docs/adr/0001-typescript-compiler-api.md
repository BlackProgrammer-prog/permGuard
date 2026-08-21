# ADR 0001: Use the TypeScript Compiler API for static analysis

- Status: Accepted
- Date: 2026-08-20

## Context

IronPermJS needs a real AST foundation for TypeScript and TSX. Later passes must
recognize imports, resolve symbols, inspect call expressions, report exact source
locations, and produce deterministic results without parsing the same file for
each pass.

The candidates required by the project are the TypeScript Compiler API,
ts-morph, and SWC.

## Decision drivers

- TypeScript and TSX parsing
- exact source locations
- import and symbol resolution
- call-expression analysis
- maintainability
- deterministic output
- parse-once architecture
- dependency and runtime cost

## Options considered

### TypeScript Compiler API

The compiler API exposes a project-level `Program`, its `SourceFile` ASTs, and
a `TypeChecker`. It uses the same parser and module resolution behavior as
TypeScript itself.

Advantages:

- native TS and TSX support
- direct symbol, alias, and import resolution through `TypeChecker`
- precise positions through `SourceFile.getLineAndCharacterOfPosition()`
- no additional parser dependency because IronPermJS already uses TypeScript
- one `Program` can be shared by all analysis passes
- deterministic traversal and sorting remain under IronPermJS's control

Tradeoffs:

- lower-level and more verbose than ts-morph
- the compiler API can change between TypeScript releases
- contributors need familiarity with `SyntaxKind`, type guards, and symbols

### ts-morph

ts-morph wraps the TypeScript compiler API with higher-level navigation and
project helpers.

Advantages:

- ergonomic traversal and node APIs
- convenient project and source-file management
- access to the underlying compiler nodes when needed

Tradeoffs:

- adds a dependency and wrapper layer over the API IronPermJS ultimately needs
- increases memory and abstraction overhead
- wrapper coverage and behavior become another compatibility surface
- dropping to compiler nodes may still be necessary for advanced resolution

### SWC

SWC provides a fast TypeScript/TSX parser and a typed AST.

Advantages:

- high parsing performance
- straightforward synchronous and asynchronous parsing APIs
- useful when syntax-only throughput dominates

Tradeoffs:

- does not provide TypeScript's project-wide `Program` and `TypeChecker`
- import and symbol resolution would require a separate implementation
- native binary distribution adds platform complexity
- using a second semantic model would make CASL import recognition harder

## Decision

Use the TypeScript Compiler API.

Phase 5 creates exactly one `Program`, selects application root files from the
parsed tsconfig, sorts them by project-relative POSIX path, and shares their ASTs
and the single `TypeChecker` with later passes.

The public analyzer result remains framework-independent. TypeScript AST objects
are confined to the analyzer's project context and are not added to
`@ironpermjs/core` analysis records.

## Consequences

- `typescript` is a runtime dependency of `@ironpermjs/analyzer`.
- Analysis passes must not call `ts.createSourceFile()` independently.
- Future passes receive the existing analyzer project and reuse its
  `SourceFile` objects.
- Syntax diagnostics are collected without preventing analysis.
- Configuration errors fail early with a dedicated error.
- Performance work should benchmark the compiler API implementation before
  reconsidering SWC.
