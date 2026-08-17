# Security model

The server is authoritative for every sensitive operation. React checks only control presentation and must never be treated as enforcement.

- Never trust roles, permissions, or decisions supplied by the browser.
- Enforce authorization independently at each sensitive server boundary.
- Fail closed for unknown or invalid authorization state where practical.
- Avoid exposing complete server-side CASL rules when conditions contain sensitive information.
- Send clients only the minimal permission snapshot needed for UI rendering.
- Treat static-analysis coverage as detected enforcement presence, not proof of security.
- Attach confidence to heuristic findings instead of presenting them as certain vulnerabilities.
