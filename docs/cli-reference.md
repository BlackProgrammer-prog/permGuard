# CLI reference

The `permguard` command orchestrates analysis, graph construction, reporting, diffing, and CI policy. It does not contain the detection logic itself.

## Installation

```bash
pnpm add -D @permguard/cli
pnpm exec permguard --help
```

The default command is `scan`, and the default root is the current directory.

## Command syntax

```text
permguard <command> [root] [options]
```

### scan

Analyze a project and print a compact human-readable summary:

```bash
permguard scan .
permguard .
```

Emit the full `AnalysisResult` JSON:

```bash
permguard scan . --json
permguard scan . --json --output analysis.json
```

### graph

Write the authorization graph as JSON:

```bash
permguard graph . --output authorization-graph.json
```

The graph includes stable nodes and edges for permissions, routes, methods, Server Actions, authorization checks, files, resources, and discovered HTTP client calls.

### report

Render a self-contained offline HTML dashboard:

```bash
permguard report . --output permguard-report.html
```

The report contains overview metrics, boundaries, issues, coverage, permissions, usages, and the authorization graph. It can be opened directly from disk.

### diff

Compare the current project with a previous versioned `AnalysisResult`:

```bash
permguard diff . --baseline analysis-main.json
permguard diff . --baseline analysis-main.json --json
```

Create a suitable baseline with:

```bash
permguard scan . --json --output analysis-main.json
```

A malformed baseline or incompatible model is treated as an analysis error.

## Shared options

| Option                   | Meaning                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `--json`                 | Print machine-readable output where supported              |
| `-o, --output <path>`    | Write output and create parent directories                 |
| `--tsconfig <path>`      | Use a specific TypeScript configuration                    |
| `--client-module <name>` | Add a recognized imported HTTP wrapper; repeatable         |
| `--ci`                   | Enable CI policy with default threshold `HIGH`             |
| `--fail-on <severity>`   | Enable CI and set `INFO`, `WARNING`, `HIGH`, or `CRITICAL` |
| `--baseline <path>`      | Baseline JSON; valid only with `diff`                      |
| `-h, --help`             | Print help                                                 |
| `-v, --version`          | Print the installed package version                        |

Relative paths are resolved from the process working directory.

## Custom HTTP clients

Built-in detection covers `fetch`, Axios, Axios instances, and `ky`. If a project wraps an imported client:

```ts
import api from "@/lib/api-client";

await api.delete("/products/42");
```

register the exact import specifier:

```bash
permguard scan . --client-module "@/lib/api-client"
```

Repeat the option for more than one wrapper. A configured module raises recognition, but dynamic method or URL resolution may still reduce confidence.

## Exit codes

| Code | Meaning                                                 |
| ---- | ------------------------------------------------------- |
| `0`  | Command completed and CI policy passed                  |
| `1`  | Configuration, filesystem, baseline, or analysis error  |
| `2`  | Invalid command-line arguments                          |
| `3`  | Analysis completed, but the configured CI policy failed |

Do not collapse every non-zero result into “security issue.” Code 1 means the scan itself did not complete reliably.

## CI examples

Fail on high-impact findings:

```bash
permguard scan . --ci --fail-on HIGH
```

Fail on every reported severity:

```bash
permguard scan . --ci --fail-on INFO
```

Keep the offline report as a CI artifact even when policy fails:

```yaml
- run: pnpm exec permguard report . -o permguard-report.html
  if: always()
```

## Performance model

PermGuard creates one TypeScript `Program` and one `TypeChecker` per scan. Discovery passes reuse parsed `SourceFile` instances. Use `--tsconfig` to avoid analyzing generated or unrelated source that your application does not compile.

## Output stability

The analysis model has a `modelVersion`. Collections and stable identifiers are deterministic for the same source and configuration. Consumers should still validate `modelVersion` before loading a baseline produced by another PermGuard release.
