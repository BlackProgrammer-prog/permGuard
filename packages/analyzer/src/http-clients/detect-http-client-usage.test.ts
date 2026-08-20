import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAnalyzerProject } from "../create-analyzer-project.js";
import { discoverRouteHandlers } from "../route-handlers/discover-route-handlers.js";
import { detectHttpClientUsage } from "./detect-http-client-usage.js";

const fixtureDir = fileURLToPath(
  new URL("../../../../fixtures/analyzer/http-clients/", import.meta.url),
);

function analyze(includeCustomClient = true) {
  const project = createAnalyzerProject({ rootDir: fixtureDir });
  const routes = discoverRouteHandlers(project);
  const requests = detectHttpClientUsage(project, routes, {
    additionalClientModules: includeCustomClient ? ["@app/api-client"] : [],
  });

  return { requests, routes };
}

describe("detectHttpClientUsage", () => {
  it("detects fetch, Axios, Axios instances, ky, and configured clients", () => {
    const { requests } = analyze();

    expect(
      requests.map((request) => [request.client, request.method, request.path]),
    ).toEqual([
      ["fetch", "GET", "/api/products"],
      ["fetch", "DELETE", "/api/products/:dynamic"],
      ["fetch", "GET", "/api/search"],
      ["fetch", "GET", "/api/:dynamic"],
      ["axios", "POST", "/api/products"],
      ["axios", "PATCH", "/api/products/:dynamic"],
      ["axios", "GET", "/api/users/:dynamic"],
      ["ky", "GET", "/api/products"],
      ["@app/api-client", "DELETE", "/api/products/:dynamic"],
    ]);
  });

  it("matches concrete and dynamic calls to the correct Route Handlers", () => {
    const { requests, routes } = analyze();
    const routeById = new Map(routes.map((route) => [route.id, route]));

    const targets = requests.map((request) => ({
      request: `${request.method} ${request.path}`,
      routes: request.routeMatches.map((match) => {
        const route = routeById.get(match.routeId);
        return `${route?.method} ${route?.path}`;
      }),
    }));

    expect(targets).toContainEqual({
      request: "DELETE /api/products/:dynamic",
      routes: ["DELETE /api/products/[id]"],
    });
    expect(targets).toContainEqual({
      request: "GET /api/users/:dynamic",
      routes: ["GET /api/users/[id]"],
    });
    expect(targets).toContainEqual({
      request: "GET /api/search",
      routes: ["GET /api/search"],
    });
  });

  it("uses lower confidence for dynamic, ambiguous, and configured calls", () => {
    const { requests } = analyze();
    const ambiguous = requests.find(
      (request) => request.path === "/api/:dynamic",
    );
    const configured = requests.find(
      (request) => request.client === "@app/api-client",
    );

    expect(ambiguous?.confidence).toBe("high");
    expect(ambiguous?.routeMatches).toHaveLength(2);
    expect(
      ambiguous?.routeMatches.every((match) => match.confidence === "medium"),
    ).toBe(true);
    expect(configured?.confidence).toBe("medium");
  });

  it("does not detect unconfigured wrappers, shadowed fetch, local objects, external URLs, or opaque URLs", () => {
    const { requests } = analyze(false);

    expect(requests).toHaveLength(8);
    expect(
      requests.some((request) => request.client === "@app/api-client"),
    ).toBe(false);
    expect(
      requests.some(
        (request) => request.location.file === "src/shadowed-fetch.ts",
      ),
    ).toBe(false);
    expect(requests.some((request) => request.path.includes("external"))).toBe(
      false,
    );
  });

  it("produces stable source locations and IDs", () => {
    const { requests } = analyze();

    expect(requests[0]).toMatchObject({
      id: "http-client-request:fetch:GET:/api/products:src/client.ts:9:15",
      location: { file: "src/client.ts", line: 9, column: 15 },
      confidence: "certain",
      dynamic: false,
    });
  });
});
