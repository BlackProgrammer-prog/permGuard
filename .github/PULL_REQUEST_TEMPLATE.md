## Summary

Describe the authorization, analyzer, integration, documentation, or maintenance change.

## Verification

- [ ] Focused tests pass
- [ ] `pnpm check` passes
- [ ] `pnpm release:verify` passes when package contents or manifests changed
- [ ] Documentation describes public API or behavior changes
- [ ] No sensitive server rule or credential was added to client output

## Analyzer changes

If detection behavior changed, include a minimal fixture and assert both the finding and its source location. Explain confidence and false-positive tradeoffs.

## Breaking changes

List public API, analysis model, CLI output, or package compatibility changes. Write “None” when not applicable.
