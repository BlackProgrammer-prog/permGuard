import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AnalysisResult } from "@permguard/core";
import { renderHtmlReport, renderJsonReport } from "@permguard/reporter";
import {
  analyzeProject,
  type AnalyzeProjectOptions,
} from "./analyze-project.js";
import { formatScanSummary } from "./format-summary.js";
import { CliArgumentError, parseCliArguments } from "./parse-arguments.js";

const VERSION = "0.1.0";

const HELP = `Usage: permguard <command> [root] [options]

Commands:
  scan            Analyze authorization and print a summary (default)
  graph           Analyze authorization and print graph JSON
  report          Analyze authorization and render an offline HTML report

Options:
  --json          Print the complete scan result as JSON
  -o, --output    Write output to a file
  --tsconfig      Use a specific tsconfig file
  --client-module Add an imported HTTP client wrapper (repeatable)
  -h, --help      Show this help
  -v, --version   Show the version
`;

export interface CliIO {
  readonly cwd: () => string;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
  readonly writeFile: (filePath: string, value: string) => void;
}

export interface RunCliDependencies {
  readonly analyze: (options: AnalyzeProjectOptions) => AnalysisResult;
}

const defaultIO: CliIO = {
  cwd: () => process.cwd(),
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
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
    const value =
      options.command === "report"
        ? renderHtmlReport(analysis, {
            projectName: path.basename(rootDir),
          })
        : options.command === "graph"
          ? JSON.stringify(analysis.graph, null, 2)
          : options.json
            ? renderJsonReport(analysis)
            : formatScanSummary(analysis, rootDir);
    const output = `${value}\n`;

    if (options.outputPath) {
      const outputPath = path.resolve(io.cwd(), options.outputPath);
      io.writeFile(outputPath, output);
      io.stdout(`Wrote ${outputPath}\n`);
    } else {
      io.stdout(output);
    }
    return 0;
  } catch (error) {
    io.stderr(`permguard: ${errorMessage(error)}\n`);
    return 1;
  }
}
