import { describe, expect, it } from "vitest";
import { CliArgumentError, parseCliArguments } from "./parse-arguments.js";

describe("parseCliArguments", () => {
  it("defaults to scanning the current directory", () => {
    expect(parseCliArguments([])).toEqual({
      command: "scan",
      rootDir: ".",
      json: false,
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
      additionalClientModules: ["@/lib/api", "custom-fetch"],
    });
  });

  it("recognizes help, version, and JSON output flags", () => {
    expect(parseCliArguments(["--help"]).command).toBe("help");
    expect(parseCliArguments(["--version"]).command).toBe("version");
    expect(parseCliArguments(["scan", "--json"]).json).toBe(true);
  });

  it("rejects unknown options and duplicate roots", () => {
    expect(() => parseCliArguments(["--unknown"])).toThrow(CliArgumentError);
    expect(() => parseCliArguments(["one", "two"])).toThrow(
      "Only one project root",
    );
  });
});
