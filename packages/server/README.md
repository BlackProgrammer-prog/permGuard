# @ironpermjs/server

Server-side authorization enforcement helpers built on CASL.

```ts
import { requireCan } from "@ironpermjs/server";

requireCan(ability, "delete", "Product");
```

A denied check throws CASL's native `ForbiddenError`; use `isForbiddenError()` when an adapter needs to map it to an HTTP 403 response.

`createPermissionSnapshot()` evaluates an explicit allowlist of permission candidates and returns only allowed action/subject/field tuples. It never serializes CASL rules or conditions. A snapshot is for client rendering only and cannot replace server enforcement.

This package never depends on React.
