# Phase 7: Server Action discovery

Phase 7 discovers Next.js Server Functions marked with the `"use server"`
directive and emits core `ServerActionRecord` values. Next.js commonly calls
these functions Server Actions when they are passed to a client component or a
form.

## Supported conventions

The pass recognizes:

- exported async function declarations in a file-level `"use server"` module
- exported async arrow functions and function expressions in such a module
- local async functions exposed through a named export alias
- named async function declarations with an inline `"use server"` directive
- async arrow functions and function expressions assigned to an identifier with
  an inline directive

Directive prologues may contain another directive before `"use server"`.

## Output

Each action becomes a deterministic `ServerActionRecord` containing a stable
ID, its exported or local name, its exact source location, and an empty
`authorizationCheckIds` list.

The empty authorization list is not a security finding. CASL usage and missing
authorization detection belong to later phases.

## Intentional limits

- Functions must be async, as required for server functions.
- A file-level directive only marks exports declared in that file or local
  functions exposed through named aliases.
- Cross-file re-exports are not followed yet because reporting them safely
  requires symbol resolution and provenance handling.
- The pass discovers marked server boundaries; it does not prove that an inline
  server function is passed to a form or client component.

## Extension rule

The pass traverses the ASTs already owned by `AnalyzerProject`. It does not read
or parse source files again.
