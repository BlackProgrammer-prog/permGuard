# @permguard/core

Framework-independent types shared by PermGuard packages.

It exports the versioned analysis model, permission descriptors, issues, confidence and severity types, graph types, and coverage types. CASL types are re-exported only where they help packages share signatures; permission evaluation remains owned by `@casl/ability`.

```ts
import type {
  AnalysisResult,
  AuthorizationIssue,
  PermissionDescriptor,
} from "@permguard/core";
```

This package must not depend on React, Next.js, the CLI, or reporters.
