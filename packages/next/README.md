<p align="center">
  <img src="https://raw.githubusercontent.com/BlackProgrammer-prog/permGuard/main/assets/brand/ironpermjs-icon.png" alt="IronPermJS" width="160" />
</p>

# @ironpermjs/next

Explicit Next.js App Router authorization helpers built on CASL.

## Setup

Create an authorization instance from an application-owned ability resolver:

```ts
import { createNextAuthorization } from "@ironpermjs/next";

export const { requireCan, withAuthorization } =
  createNextAuthorization(getAbility);
```

Use `requireCan()` inside Server Components and Server Actions:

```ts
await requireCan("delete", "Product");
```

Use `withAuthorization()` for Route Handlers:

```ts
export const DELETE = withAuthorization(
  ["delete", "Product"],
  async () => new Response(null, { status: 204 }),
);
```

The resolver runs for every invocation. Authentication and session management
remain application-owned. For conditional CASL rules, load the resource and
authorize its concrete subject before mutation.

React checks and permission snapshots never replace server enforcement.
