import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAnalyzerProject } from "../create-analyzer-project.js";
import { discoverRouteHandlers } from "./discover-route-handlers.js";
import { getRoutePath } from "./route-path.js";

const fixturesDir = fileURLToPath(
  new URL("../../../../fixtures/analyzer/", import.meta.url),
);

function createFixtureProject(name: string) {
  return createAnalyzerProject({
    rootDir: path.join(fixturesDir, name),
  });
}

describe("discoverRouteHandlers", () => {
  it("discovers supported exported HTTP methods in stable order", () => {
    const routes = discoverRouteHandlers(
      createFixtureProject("route-handlers"),
    );

    expect(routes.map((route) => [route.path, route.method])).toEqual([
      ["/", "HEAD"],
      ["/api/products/[id]", "GET"],
      ["/api/products/[id]", "PATCH"],
      ["/api/products/[id]", "DELETE"],
      ["/reports", "POST"],
      ["/settings", "OPTIONS"],
    ]);
    expect(
      routes.every((route) => route.authorizationCheckIds.length === 0),
    ).toBe(true);
  });

  it("supports direct, variable, alias, and re-export declarations", () => {
    const routes = discoverRouteHandlers(
      createFixtureProject("route-handlers"),
    );
    const byMethod = new Map(routes.map((route) => [route.method, route]));

    expect(byMethod.get("GET")?.location).toMatchObject({
      file: "app/api/products/[id]/route.ts",
      line: 1,
    });
    expect(byMethod.get("DELETE")?.location).toMatchObject({
      file: "app/api/products/[id]/route.ts",
      line: 5,
    });
    expect(byMethod.get("PATCH")?.location).toMatchObject({
      file: "app/api/products/[id]/route.ts",
      line: 8,
    });
    expect(byMethod.get("POST")?.location).toMatchObject({
      file: "app/(admin)/reports/route.tsx",
      line: 1,
    });
  });

  it("ignores unsupported exports, private folders, and Pages Router files", () => {
    const routes = discoverRouteHandlers(
      createFixtureProject("route-handlers"),
    );

    expect(routes.some((route) => route.method === "CONNECT")).toBe(false);
    expect(
      routes.some((route) => route.location.file.includes("_private")),
    ).toBe(false);
    expect(
      routes.some((route) => route.location.file.includes("pages/api")),
    ).toBe(false);
    expect(routes.some((route) => route.path === "/api/no-method")).toBe(false);
  });

  it("supports the optional src/app directory", () => {
    const routes = discoverRouteHandlers(
      createFixtureProject("route-handlers-src"),
    );

    expect(routes).toEqual([
      {
        id: "next-route:GET:/health:src/app/health/route.ts",
        path: "/health",
        method: "GET",
        location: {
          file: "src/app/health/route.ts",
          line: 3,
          column: 25,
        },
        authorizationCheckIds: [],
      },
    ]);
  });
});

describe("getRoutePath", () => {
  it.each([
    ["app/route.ts", "/"],
    ["app/(admin)/reports/route.tsx", "/reports"],
    ["app/@slot/(group)/settings/route.ts", "/settings"],
    ["app/blog/[slug]/route.ts", "/blog/[slug]"],
    ["src/app/docs/[[...slug]]/route.ts", "/docs/[[...slug]]"],
  ])("maps %s to %s", (filePath, expected) => {
    expect(getRoutePath(filePath)).toBe(expected);
  });

  it.each([
    "pages/api/products.ts",
    "app/products/page.tsx",
    "app/_private/route.ts",
    "src/features/route.ts",
  ])("ignores non-route file %s", (filePath) => {
    expect(getRoutePath(filePath)).toBeUndefined();
  });
});
