# @permguard/diff

Semantic authorization diff and CI severity policy evaluation.

    import {
      diffAnalysisResults,
      evaluateCiPolicy,
    } from "@permguard/diff";

    const diff = diffAnalysisResults(baseline, current);
    const policy = evaluateCiPolicy(current, { failOn: "HIGH" });

The package is pure and has no git, filesystem, analyzer, or CI-provider
dependency. Baseline acquisition and command exit codes belong to the CLI.
