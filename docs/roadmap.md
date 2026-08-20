# Roadmap

Work proceeds incrementally; later phases should not be implemented before their prerequisites.

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
- [ ] Phase 10: HTTP client usage discovery and client-to-route matching
- [ ] Phase 11: Authorization graph
- [ ] Phase 12: Coverage
- [ ] Phase 13: CLI
- [ ] Phase 14: HTML reporter
- [ ] Phase 15: Authorization diff and CI
- [ ] Phase 16: Hardening and documentation

The next implementation phase is HTTP client usage discovery and
client-to-route matching. Source files must not be reparsed by analysis passes.

Phase 10 will discover calls made through native `fetch`, Axios, and configured
HTTP client wrappers, then match statically knowable method/path pairs to Route
Handlers. Dynamic URLs and wrapper resolution must carry confidence instead of
being presented as certain matches.
