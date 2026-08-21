# Phase 4: Next.js integration

`@ironpermjs/next` supports explicit authorization at the first App Router
boundaries:

- Server Components and Server Actions use async `requireCan()`.
- Route Handlers use `withAuthorization()` for simple permission checks.
- Denied Route Handlers return a minimal JSON 403 response by default.
- Applications can provide a custom forbidden response without exposing CASL
  rules or conditions.

The application owns authentication and the ability resolver. The resolver is
called for every authorization invocation, so abilities are not shared across
requests.

For conditional rules, authorize a concrete CASL subject after loading the
resource. A type-only check such as `delete Product` cannot enforce record-level
conditions such as ownership.

Server Actions and Route Handlers remain independently authoritative. Client UI
checks are not a security boundary.
