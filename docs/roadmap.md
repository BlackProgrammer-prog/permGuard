# Roadmap

The initial 0.1 product roadmap is complete. Work was delivered in dependency order so integrations, analysis, reporting, and CI all consume the same framework-independent model.

- [x] Phase 0: Repository and architecture
- [x] Phase 1: CASL foundation and shared types
- [x] Phase 2: Server helpers
- [x] Phase 3: React integration
- [x] Phase 4: Next.js integration
- [x] Phase 5: Analyzer foundation and AST decision
- [x] Phase 6: Route Handler discovery
- [x] Phase 7: Server Action discovery
- [x] Phase 8: CASL usage detection
- [x] Phase 9: Issue detection
- [x] Phase 10: HTTP client usage and client-to-route matching
- [x] Phase 11: Authorization graph
- [x] Phase 12: Authorization coverage
- [x] Phase 13: CLI
- [x] Phase 14: Offline HTML reporter
- [x] Phase 15: Authorization diff and CI policy
- [x] Phase 16: Hardening, documentation, package verification, and release automation

## Post-0.1 priorities

Future work should be driven by real application fixtures and issue evidence rather than speculative abstraction. Likely areas include:

- richer conditional-rule and role extraction
- more Next.js patterns while keeping server checks explicit
- tested adapters for common project-specific API clients
- model migration guarantees for long-lived baselines
- performance benchmarks for large repositories
- additional framework adapters that consume the same analysis model

A new feature must preserve CASL as the evaluation engine and must not weaken confidence reporting or server authority.
