import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "./analyze-project.js";

const fixtureDir = fileURLToPath(
  new URL("../../../fixtures/analyzer/issue-detection/", import.meta.url),
);

describe("analyzeProject", () => {
  it("orchestrates analyzer, coverage, and graph into one result", () => {
    const result = analyzeProject({ rootDir: fixtureDir });

    expect(result.modelVersion).toBe(2);
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.serverActions.length).toBeGreaterThan(0);
    expect(result.authorizationChecks.length).toBeGreaterThan(0);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.coverage.overall.expected).toBe(
      result.routes.length + result.serverActions.length,
    );
    expect(result.graph.nodes.length).toBeGreaterThan(0);
    expect(result.graph.edges.some((edge) => edge.type === "enforces")).toBe(
      true,
    );
  });
});
