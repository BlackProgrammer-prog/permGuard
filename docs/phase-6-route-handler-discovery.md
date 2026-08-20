# Phase 6: Route Handler discovery

Phase 6 discovers Next.js App Router Route Handlers and emits core
`RouteRecord` values. It does not detect authorization checks or report missing
authorization.

## Supported files

- `app/**/route.ts`
- `app/**/route.tsx`
- `app/**/route.js`
- `app/**/route.jsx`
- the same conventions under `src/app`

Private route segments prefixed with `_` are ignored. Route groups such as
`(admin)` and parallel slots such as `@dashboard` are omitted from URL paths.
Dynamic segments such as `[id]`, `[...slug]`, and `[[...slug]]` are retained.

## Supported methods

The pass recognizes the HTTP methods supported by Next.js:

`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`.

It recognizes:

- exported function declarations
- exported variable declarations
- local named export aliases
- named re-exports

Default exports, route segment configuration exports, unsupported HTTP methods,
Pages Router API files, and route files without an HTTP method are ignored.

## Output

Each discovered boundary becomes a deterministic `RouteRecord` containing:

- stable ID
- normalized URL path
- HTTP method
- exact export location
- an empty `authorizationCheckIds` list

The empty authorization list is not a finding. CASL usage detection and missing
authorization findings belong to later phases.

## Extension rule

The pass consumes `AnalyzerProject.sourceFiles` and their existing TypeScript
ASTs. It must not read or parse route source files independently.
