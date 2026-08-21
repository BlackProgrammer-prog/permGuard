<p align="center">
  <img src="https://raw.githubusercontent.com/BlackProgrammer-prog/permGuard/main/assets/brand/ironpermjs-icon.png" alt="IronPermJS" width="160" />
</p>

# @ironpermjs/react

Explicit, analyzer-friendly React UI helpers built on `@casl/react`.

```tsx
import { AbilityProvider, Can, useCan } from "@ironpermjs/react";

<AbilityProvider value={ability}>
  <Can action="delete" subject="Product" fallback={<span>Not allowed</span>}>
    <DeleteButton />
  </Can>
</AbilityProvider>;
```

`Can` supports `field`, `not`, `fallback`, and a render-function child. `useCan(action, subject, field?)` subscribes to CASL ability updates through the official CASL React integration.

These checks only control UI. Sensitive operations must call a server-side enforcement helper independently.
