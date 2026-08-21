import { ANALYSIS_MODEL_VERSION, type AnalysisResult } from "@permguard/core";
import { describe, expect, it } from "vitest";
import type { CliIO } from "./run-cli.js";
import { runCli } from "./run-cli.js";

const analysis: AnalysisResult = {
  modelVersion: ANALYSIS_MODEL_VERSION,
  permissions: [],
  roles: [],
  routes: [],
  serverActions: [],
  httpClientRequests: [],
  authorizationChecks: [],
  usages: [],
  issues: [],
  graph: {
    nodes: [{ id: "route:one", type: "route", label: "GET /api/one" }],
    edges: [],
  },
  coverage: {
    routes: { detected: 1, expected: 2, percentage: 50 },
    serverActions: { detected: 1, expected: 1, percentage: 100 },
    overall: { detected: 2, expected: 3, percentage: 66.67 },
  },
};

function createIO() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const files = new Map<string, string>();
  const io: CliIO = {
    cwd: () => "/workspace",
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
    writeFile: (filePath, value) => files.set(filePath, value),
  };
  return { io, stdout, stderr, files };
}

describe("runCli", () => {
  it("prints a human-readable scan summary", () => {
    const capture = createIO();
    const exitCode = runCli(["scan", "./app"], capture.io, {
      analyze: () => analysis,
    });

    expect(exitCode).toBe(0);
    expect(capture.stdout.join("")).toContain("Routes           1/2 (50%)");
    expect(capture.stdout.join("")).toContain(
      "Coverage measures detected enforcement presence",
    );
  });

  it("prints graph JSON without the rest of the analysis", () => {
    const capture = createIO();
    const exitCode = runCli(["graph"], capture.io, {
      analyze: () => analysis,
    });

    expect(exitCode).toBe(0);
    expect(JSON.parse(capture.stdout.join(""))).toEqual(analysis.graph);
  });

  it("writes JSON scan output to the requested file", () => {
    const capture = createIO();
    const exitCode = runCli(
      ["scan", "--json", "--output", "reports/scan.json"],
      capture.io,
      { analyze: () => analysis },
    );

    expect(exitCode).toBe(0);
    expect(
      JSON.parse(capture.files.get("/workspace/reports/scan.json") ?? ""),
    ).toEqual(analysis);
    expect(capture.stdout.join("")).toContain("Wrote");
  });

  it("renders an offline HTML report", () => {
    const capture = createIO();
    const exitCode = runCli(
      ["report", "--output", "reports/permguard.html"],
      capture.io,
      { analyze: () => analysis },
    );

    expect(exitCode).toBe(0);
    const html = capture.files.get("/workspace/reports/permguard.html") ?? "";
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Authorization overview");
    expect(html).not.toMatch(/<(script|link|img)\b/i);
  });

  it("returns distinct exit codes for invalid arguments and analysis errors", () => {
    const invalid = createIO();
    expect(runCli(["--bad"], invalid.io, { analyze: () => analysis })).toBe(2);

    const failed = createIO();
    expect(
      runCli([], failed.io, {
        analyze: () => {
          throw new Error("tsconfig not found");
        },
      }),
    ).toBe(1);
    expect(failed.stderr.join("")).toContain("tsconfig not found");
  });

  it("shows help without running analysis", () => {
    const capture = createIO();
    let called = false;
    const exitCode = runCli(["--help"], capture.io, {
      analyze: () => {
        called = true;
        return analysis;
      },
    });

    expect(exitCode).toBe(0);
    expect(called).toBe(false);
    expect(capture.stdout.join("")).toContain("Usage: permguard");
  });
});
