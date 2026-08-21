# Getting started

This tutorial adds CASL authorization to a Next.js App Router project, enforces it on the server, renders permission-aware UI, and audits the result with PermGuard.

## 1. Install the smallest useful set

For a Next.js application with React UI and static analysis:

```bash
pnpm add @casl/ability @permguard/server @permguard/next
pnpm add @permguard/react
pnpm add -D @permguard/cli
```

You can omit `@permguard/react` when the browser does not need permission-aware UI.

## 2. Define application permission vocabulary

Keep action and subject names small and stable:

```ts
// src/auth/types.ts
import type { MongoAbility } from "@casl/ability";

export type AppAction =
  "manage" | "create" | "read" | "update" | "delete" | "publish";

export type AppSubject = "all" | "Product" | "Order";
export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export interface CurrentUser {
  id: string;
  role: "admin" | "editor" | "viewer";
}
```

Do not accept these types as proof that a browser-supplied action is authorized. They only improve developer feedback.

## 3. Build abilities with CASL

```ts
// src/auth/ability.ts
import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import type { AppAbility, CurrentUser } from "./types";

export function defineAbilityFor(user: CurrentUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility,
  );

  if (user.role === "admin") {
    can("manage", "all");
  }

  if (user.role === "editor") {
    can("read", "Product");
    can("update", "Product");
    can("publish", "Product");
  }

  if (user.role === "viewer") {
    can("read", "Product");
  }

  cannot("delete", "Product");

  return build();
}
```

CASL remains responsible for ordering, matching, conditions, fields, `can()`, and `cannot()`.

## 4. Connect the authenticated session

Authentication is application-owned. Adapt your existing session library:

```ts
// src/auth/session.ts
import type { CurrentUser } from "./types";

export async function requireUser(): Promise<CurrentUser> {
  const user = await readUserFromYourSession();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  return {
    id: user.id,
    role: user.role,
  };
}
```

Validate session data on the server. Never trust a role submitted by the client.

## 5. Create the Next.js integration

```ts
// src/auth/authorization.ts
import { createNextAuthorization } from "@permguard/next";
import { defineAbilityFor } from "./ability";
import { requireUser } from "./session";

export const { requireCan, withAuthorization } = createNextAuthorization(
  async () => defineAbilityFor(await requireUser()),
);
```

This resolver is called for each protected operation. It does not cache abilities globally.

## 6. Protect Route Handlers

```ts
// app/api/products/[id]/route.ts
import { withAuthorization } from "@/auth/authorization";

export const DELETE = withAuthorization(
  ["delete", "Product"],
  async (_request, { params }) => {
    const { id } = await params;
    await products.delete(id);
    return new Response(null, { status: 204 });
  },
);
```

The default denied response is JSON with HTTP status 403. Customize it when needed:

```ts
export const PATCH = withAuthorization(
  ["update", "Product"],
  updateProductHandler,
  {
    onForbidden: () =>
      Response.json({ code: "PRODUCT_UPDATE_DENIED" }, { status: 403 }),
  },
);
```

Authentication errors or unexpected resolver failures are rethrown; only CASL `ForbiddenError` becomes a forbidden response.

## 7. Protect Server Actions

```ts
// app/products/actions.ts
"use server";

import { requireCan } from "@/auth/authorization";

export async function publishProduct(productId: string) {
  await requireCan("publish", "Product");

  // Validate input and load data before mutating it.
  await products.publish(productId);
}
```

For conditional CASL rules, load the subject and use the lower-level server helper with a concrete CASL subject:

```ts
import { subject } from "@casl/ability";
import { requireCan } from "@permguard/server";

const user = await requireUser();
const ability = defineAbilityFor(user);
const product = await products.findById(productId);

requireCan(ability, "update", subject("Product", product));
await products.update(productId, input);
```

## 8. Add React checks safely

The browser only needs enough permission information to render the current screen. Do not serialize sensitive rules or backend-only conditions.

For a client-side ability that is already safe to expose:

```tsx
"use client";

import { AbilityProvider, Can } from "@permguard/react";
import type { AppAbility } from "@/auth/types";

export function ProductToolbar({ ability }: { ability: AppAbility }) {
  return (
    <AbilityProvider value={ability}>
      <Can action="publish" subject="Product" fallback={null}>
        <button type="submit">Publish</button>
      </Can>
    </AbilityProvider>
  );
}
```

Even when the button is hidden, the Route Handler or Server Action must perform its own server-side check.

Use `createPermissionSnapshot()` when only a small fixed candidate set is needed:

```ts
import { createPermissionSnapshot } from "@permguard/server";

const snapshot = createPermissionSnapshot(ability, [
  { action: "read", subject: "Product" },
  { action: "update", subject: "Product" },
  { action: "publish", subject: "Product" },
]);
```

The helper returns only candidates that CASL allows and removes duplicates.

## 9. Run the analyzer

Build the project or ensure its `tsconfig.json` includes the relevant source, then run:

```bash
pnpm exec permguard scan .
```

Machine-readable result:

```bash
pnpm exec permguard scan . --json --output .permguard/baseline.json
```

Offline dashboard:

```bash
pnpm exec permguard report . --output .permguard/report.html
```

Open the HTML file directly. It has no backend and sends no project data to a service.

## 10. Add CI policy

```json
{
  "scripts": {
    "authorization:check": "permguard scan . --ci --fail-on HIGH",
    "authorization:report": "permguard report . -o .permguard/report.html"
  }
}
```

`INFO`, `WARNING`, `HIGH`, and `CRITICAL` are supported thresholds. The CLI exits with code 3 only for a policy failure, which distinguishes it from configuration or analysis errors.

## 11. Review findings

For each issue, inspect:

- severity: workflow urgency
- confidence: certainty of the static evidence
- file and location: where review should begin
- related permission: action and subject when available
- explanation: why the analyzer produced the finding

A high-confidence finding still requires developer review. A low-confidence finding is not a vulnerability claim.

## 12. Track authorization drift

Save a reviewed JSON scan from your default branch:

```bash
permguard scan . --json -o authorization-baseline.json
```

Compare later changes:

```bash
permguard diff . --baseline authorization-baseline.json
```

The diff compares authorization-relevant model records rather than raw source text.

## Next steps

- Read the [CLI reference](cli-reference.md).
- Review the [security model](security-model.md).
- See the [API reference](api-reference.md).
- Configure [trusted npm publishing](publishing.md) if you maintain PermGuard.
