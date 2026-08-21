# Phase 5: analyzer foundation

Phase 5 establishes the project-level AST context used by every later analysis
pass. It does not detect routes, Server Actions, CASL calls, or issues.

## Pipeline

1. Read and validate the target `tsconfig.json`.
2. Let TypeScript resolve the configured root file names and compiler options.
3. Create exactly one `Program`.
4. Select the configured root `SourceFile` objects from that program.
5. Normalize paths relative to the analyzed project and sort them.
6. Create one `TypeChecker` for import and symbol resolution.
7. Collect stable syntax diagnostics without throwing away recoverable ASTs.

The resulting `AnalyzerProject` is an internal analysis context. Future passes
consume it and write framework-independent records into the core
`AnalysisResult`.

## Main APIs

- `createAnalyzerProject(options)`: creates the parse-once context.
- `getSourceLocation(file, position)`: converts zero-based compiler positions
  into one-based IronPermJS locations.
- `AnalyzerConfigError`: reports unreadable or invalid tsconfig files.
- `AnalyzerProject.sourceFiles`: deterministic application root files.
- `AnalyzerProject.checker`: shared symbol and import resolver.

## Extension rule

A new analysis pass loops over `project.sourceFiles`, traverses each existing
`file.sourceFile` with TypeScript node guards, and uses `project.checker` when
names must be proven to originate from a specific import.

A pass must not call `createSourceFile()` or create another `Program`.
