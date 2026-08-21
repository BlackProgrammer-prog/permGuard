# Next.js advanced patterns

Use this directory as a review checklist after completing `next-basic`.

## Conditional CASL rules

When a rule depends on resource data, load the resource first and authorize a concrete CASL subject:

```ts
import { subject } from "@casl/ability";
import { requireCan } from "@ironpermjs/server";

const ability = defineAbilityFor(await requireUser());
const order = await orders.findById(orderId);

requireCan(ability, "update", subject("Order", order));
await orders.update(orderId, input);
```

A subject-name-only check cannot evaluate ownership conditions.

## Minimal client snapshots

Do not serialize sensitive server rules merely to render UI. Evaluate a fixed candidate list:

```ts
import { createPermissionSnapshot } from "@ironpermjs/server";

const snapshot = createPermissionSnapshot(ability, [
  { action: "read", subject: "Order" },
  { action: "refund", subject: "Order" },
]);
```

The snapshot is UI data, not authorization proof.

## API client wrappers

Built-in analysis supports Axios, Axios instances, fetch, and ky. Register an imported wrapper:

```bash
ironpermjs scan . --client-module "@/lib/api-client"
```

## Review order

1. authenticate on the server
2. validate input
3. load conditional subjects
4. enforce with CASL before side effects
5. keep client checks minimal
6. scan and review confidence
7. preserve an analysis baseline for semantic diff
