import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AnalysisResult } from "@permguard/core";
import { diffAnalysisResults, evaluateCiPolicy } from "@permguard/diff";
import { renderHtmlReport, renderJsonReport } from "@permguard/reporter";
import {
  analyzeProject,
  type AnalyzeProjectOptions,
} from "./analyze-project.js";
import { formatDiffSummary } from "./format-diff-summary.js";
import { formatScanSummary } from "./format-summary.js";
import { parseAnalysisBaseline } from "./parse-baseline.js";
import { CliArgumentError, parseCliArguments } from "./parse-arguments.js";

const VERSION = "0.1.0";

const HELP = `Usage: permguard <command> [root] [options]

Commands:
  scan            Analyze authorization and print a summary (default)
  graph           Analyze authorization and print graph JSON
  report          Analyze authorization and render an offline HTML report
  diff            Compare current analysis with a JSON baseline

Options:
  --json          Print the complete scan result as JSON
  -o, --output    Write output to a file
  --tsconfig      Use a specific tsconfig file
  --client-module Add an imported HTTP client wrapper (repeatable)
  --baseline      Baseline AnalysisResult JSON for diff
  --ci            Enable CI policy (defaults to fail on HIGH)
  --fail-on       INFO, WARNING, HIGH, or CRITICAL
  -h, --help      Show this help
  -v, --version   Show the version
`;

export interface CliIO {
  readonly cwd: () => string;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
  readonly readFile: (filePath: string) => string;
  readonly writeFile: (filePath: string, value: string) => void;
}

export interface RunCliDependencies {
  readonly analyze: (options: AnalyzeProjectOptions) => AnalysisResult;
}

const defaultIO: CliIO = {
  cwd: () => process.cwd(),
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
  readFile: (filePath) => readFileSync(filePath, "utf8"),
  writeFile: (filePath, value) => {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, value, "utf8");
  },
};

const defaultDependencies: RunCliDependencies = {
  analyze: analyzeProject,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function runCli(
  args: readonly string[],
  io: CliIO = defaultIO,
  dependencies: RunCliDependencies = defaultDependencies,
): number {
  let options;
  try {
    options = parseCliArguments(args);
  } catch (error) {
    io.stderr(`permguard: ${errorMessage(error)}\n`);
    return error instanceof CliArgumentError ? 2 : 1;
  }

  if (options.command === "help") {
    io.stdout(HELP);
    return 0;
  }
  if (options.command === "version") {
    io.stdout(`${VERSION}\n`);
    return 0;
  }

  const rootDir = path.resolve(io.cwd(), options.rootDir);
  try {
    const analysis = dependencies.analyze({
      rootDir,
      ...(options.tsconfigPath
        ? { tsconfigPath: path.resolve(io.cwd(), options.tsconfigPath) }
        : {}),
      additionalClientModules: options.additionalClientModules,
    });
    let value: string;
    if (options.command === "diff") {
      if (!options.baselinePath) {
        throw new Error("diff requires a baseline.");
      }
      const baselinePath = path.resolve(io.cwd(), options.baselinePath);
      const baseline = parseAnalysisBaseline(io.readFile(baselinePath));
      const diff = diffAnalysisResults(baseline, analysis);
      value = options.json
        ? JSON.stringify(diff, null, 2)
        : formatDiffSummary(diff);
    } else if (options.command === "report") {
      value = renderHtmlReport(analysis, {
        projectName: path.basename(rootDir),
      });
    } else if (options.command === "graph") {
      value = JSON.stringify(analysis.graph, null, 2);
    } else {
      value = options.json
        ? renderJsonReport(analysis)
        : formatScanSummary(analysis, rootDir);
    }

    const output = `${value}\n`;
    if (options.outputPath) {
      const outputPath = path.resolve(io.cwd(), options.outputPath);
      io.writeFile(outputPath, output);
      io.stdout(`Wrote ${outputPath}\n`);
    } else {
      io.stdout(output);
    }

    if (options.ci) {
      const policy = evaluateCiPolicy(analysis, {
        failOn: options.failOn,
      });
      if (!policy.passed) {
        io.stderr(
          `CI policy failed: ${policy.blockingIssues.length} issue(s) at ${policy.failOn} or above.\n`,
        );
        for (const issue of policy.blockingIssues) {
          io.stderr(
            `- ${issue.severity} ${issue.title} (${issue.location.file}:${issue.location.line})\n`,
          );
        }
        return 3;
      }
    }
    return 0;
  } catch (error) {
    io.stderr(`permguard: ${errorMessage(error)}\n`);
    return 1;
  }
}
