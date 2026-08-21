# Next.js basic example

This copy-ready example shows the smallest explicit Next.js App Router integration:

- CASL owns the permission policy
- the application owns authentication
- one resolver creates a fresh ability per operation
- a Route Handler and Server Action enforce on the server

## Files

```text
src/
  auth/
    types.ts
    ability.ts
    session.ts
    authorization.ts
app/
  api/products/[id]/route.ts
  products/actions.ts
```

Copy these files into an existing Next.js project and adapt the `@/` alias if necessary.

Install:

```bash
pnpm add @casl/ability @permguard/next
```

Replace the demonstration body in `requireUser()` with your authenticated server session. The example intentionally does not implement login, a database, or browser-controlled roles.

Run an authorization audit after integrating:

```bash
pnpm add -D @permguard/cli
pnpm exec permguard scan .
pnpm exec permguard report . -o permguard-report.html
```

The endpoint returns demonstration JSON instead of mutating storage, so copying it cannot delete real data accidentally.
