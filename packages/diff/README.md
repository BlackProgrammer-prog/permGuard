<p align="center">
  <img src="https://raw.githubusercontent.com/BlackProgrammer-prog/permGuard/main/assets/brand/ironpermjs-icon.png" alt="IronPermJS" width="160" />
</p>

# @ironpermjs/diff

Semantic authorization diff and CI severity policy evaluation.

    import {
      diffAnalysisResults,
      evaluateCiPolicy,
    } from "@ironpermjs/diff";

    const diff = diffAnalysisResults(baseline, current);
    const policy = evaluateCiPolicy(current, { failOn: "HIGH" });

The package is pure and has no git, filesystem, analyzer, or CI-provider
dependency. Baseline acquisition and command exit codes belong to the CLI.
