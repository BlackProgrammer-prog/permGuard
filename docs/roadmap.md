# Roadmap

Work proceeds incrementally; later phases should not be implemented before their prerequisites.

1. Repository and architecture
2. CASL foundation and shared types
3. Server helpers
4. React integration
5. Next.js integration
6. Analyzer foundation and AST decision
7. Route Handler discovery
8. Server Action discovery
9. CASL usage detection
10. Issue detection
11. Authorization graph
12. Coverage
13. CLI
14. HTML reporter
15. Authorization diff and CI
16. Hardening and documentation

The next implementation phase is the CASL foundation in `packages/core`. Add `@casl/ability` when that phase starts rather than preinstalling it speculatively.
