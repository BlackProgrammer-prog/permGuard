import { describe, expect, it } from "vitest";
import { CliArgumentError, parseCliArguments } from "./parse-arguments.js";

describe("parseCliArguments", () => {
  it("defaults to scanning the current directory", () => {
    expect(parseCliArguments([])).toEqual({
      command: "scan",
      rootDir: ".",
      json: false,
      ci: false,
      failOn: "HIGH",
      additionalClientModules: [],
    });
  });

  it("parses graph output and repeatable client modules", () => {
    expect(
      parseCliArguments([
        "graph",
        "./app",
        "--output",
        "graph.json",
        "--tsconfig",
        "tsconfig.app.json",
        "--client-module",
        "@/lib/api",
        "--client-module",
        "custom-fetch",
      ]),
    ).toEqual({
      command: "graph",
      rootDir: "./app",
      json: false,
      outputPath: "graph.json",
      tsconfigPath: "tsconfig.app.json",
      ci: false,
      failOn: "HIGH",
      additionalClientModules: ["@/lib/api", "custom-fetch"],
    });
  });

  it("recognizes help, version, and JSON output flags", () => {
    expect(parseCliArguments(["--help"]).command).toBe("help");
    expect(parseCliArguments(["--version"]).command).toBe("version");
    expect(parseCliArguments(["report"]).command).toBe("report");
    expect(parseCliArguments(["scan", "--json"]).json).toBe(true);
  });

  it("parses diff baseline and CI severity", () => {
    expect(
      parseCliArguments([
        "diff",
        "--baseline",
        "baseline.json",
        "--fail-on",
        "warning",
      ]),
    ).toMatchObject({
      command: "diff",
      baselinePath: "baseline.json",
      ci: true,
      failOn: "WARNING",
    });
  });

  it("rejects invalid options, duplicate roots, and missing baselines", () => {
    expect(() => parseCliArguments(["--unknown"])).toThrow(CliArgumentError);
    expect(() => parseCliArguments(["one", "two"])).toThrow(
      "Only one project root",
    );
    expect(() => parseCliArguments(["diff"])).toThrow(
      "diff requires --baseline",
    );
  });
});
