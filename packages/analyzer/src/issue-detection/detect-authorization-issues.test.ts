import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { detectCaslUsage } from "../casl-usage/detect-casl-usage.js";
import { createAnalyzerProject } from "../create-analyzer-project.js";
import { discoverRouteHandlers } from "../route-handlers/discover-route-handlers.js";
import { discoverServerActions } from "../server-actions/discover-server-actions.js";
import { detectAuthorizationIssues } from "./detect-authorization-issues.js";
import { permissionCovers } from "./permission-matching.js";

const fixturesDir = fileURLToPath(
  new URL("../../../../fixtures/analyzer/", import.meta.url),
);

function analyzeFixture() {
  const project = createAnalyzerProject({
    rootDir: path.join(fixturesDir, "issue-detection"),
  });
  const caslUsage = detectCaslUsage(project);

  return {
    caslUsage,
    result: detectAuthorizationIssues({
      project,
      routes: discoverRouteHandlers(project),
      serverActions: discoverServerActions(project),
      caslUsage,
    }),
  };
}

describe("detectAuthorizationIssues", () => {
  it("associates checks only with the containing route or Server Action", () => {
    const { result } = analyzeFixture();
    const boundaryChecks = [
      ...result.routes.map((route) => [
        `${route.method} ${route.path}`,
        route.authorizationCheckIds.length,
      ]),
      ...result.serverActions.map((action) => [
        action.name,
        action.authorizationCheckIds.length,
      ]),
    ];

    expect(boundaryChecks).toEqual([
      ["GET /api/products", 1],
      ["POST /api/products", 1],
      ["DELETE /api/products", 0],
      ["GET /api/reports", 1],
      ["updateProduct", 1],
      ["archiveProduct", 0],
    ]);
  });

  it("follows a named route re-export to its implementation body", () => {
    const { caslUsage, result } = analyzeFixture();
    const reportRoute = result.routes.find(
      (route) => route.path === "/api/reports",
    );
    const check = caslUsage.authorizationChecks.find(
      (item) => item.id === reportRoute?.authorizationCheckIds[0],
    );

    expect(check?.location.file).toBe("app/api/reports/handler.ts");
    expect(
      result.issues.some((issue) => issue.title.startsWith("Unable to verify")),
    ).toBe(false);
  });

  it("reports missing authorization at resolved server boundaries", () => {
    const { result } = analyzeFixture();
    const missing = result.issues.filter((issue) =>
      issue.title.startsWith("Missing"),
    );

    expect(
      missing.map((issue) => [issue.title, issue.severity, issue.confidence]),
    ).toEqual([
      ["Missing Server Action authorization", "HIGH", "high"],
      ["Missing route authorization", "HIGH", "high"],
    ]);
  });

  it("reports unknown references and possibly unused rules conservatively", () => {
    const { result } = analyzeFixture();
    const unknown = result.issues.filter(
      (issue) => issue.title === "Unknown permission reference",
    );
    const unused = result.issues.filter(
      (issue) => issue.title === "Possibly unused authorization rule",
    );

    expect(unknown).toHaveLength(2);
    expect(
      unknown.every(
        (issue) =>
          issue.severity === "WARNING" && issue.confidence === "medium",
      ),
    ).toBe(true);
    expect(unused).toHaveLength(1);
    expect(unused[0]?.permission).toEqual({
      action: "publish",
      subject: "Article",
    });
  });
});

describe("permissionCovers", () => {
  it.each([
    [
      { action: "manage", subject: "Product" },
      { action: "delete", subject: "Product" },
    ],
    [
      { action: "read", subject: "all" },
      { action: "read", subject: "Product" },
    ],
    [
      { action: "update", subject: "Product" },
      { action: "update", subject: "Product", field: "status" },
    ],
  ])(
    "treats CASL wildcard definition %j as covering %j",
    (definition, usage) => {
      expect(permissionCovers(definition, usage)).toBe(true);
    },
  );

  it("does not let a field-specific rule cover a subject-wide usage", () => {
    expect(
      permissionCovers(
        { action: "update", subject: "Product", field: "status" },
        { action: "update", subject: "Product" },
      ),
    ).toBe(false);
  });
});
