import { describe, expect, it } from "vitest";
import { buildAuthorizationGraph } from "./build-authorization-graph.js";
import type { BuildAuthorizationGraphInput } from "./types.js";

const location = {
  file: "app/api/products/route.ts",
  line: 5,
  column: 3,
} as const;

function input(): BuildAuthorizationGraphInput {
  return {
    permissions: [
      {
        id: "rule:read-product",
        action: "read",
        subject: "Product",
        inverted: false,
        location: { file: "src/ability.ts", line: 4, column: 3 },
        confidence: "certain",
      },
    ],
    roles: [{ id: "admin", name: "Admin" }],
    routes: [
      {
        id: "route:GET:/api/products",
        method: "GET",
        path: "/api/products",
        location,
        authorizationCheckIds: ["check:read-product", "missing-check"],
      },
    ],
    serverActions: [
      {
        id: "action:list-products",
        name: "listProducts",
        location: { file: "app/actions.ts", line: 3, column: 1 },
        authorizationCheckIds: ["check:read-product"],
      },
    ],
    httpClientRequests: [
      {
        id: "request:products",
        client: "fetch",
        method: "GET",
        path: "/api/products",
        dynamic: false,
        location: { file: "app/products.tsx", line: 8, column: 9 },
        confidence: "certain",
        routeMatches: [
          { routeId: "route:GET:/api/products", confidence: "certain" },
          { routeId: "missing-route", confidence: "low" },
        ],
      },
    ],
    authorizationChecks: [
      {
        id: "check:read-product",
        kind: "ironpermjs-require-can",
        permission: { action: "read", subject: "Product" },
        location,
        confidence: "certain",
      },
    ],
    usages: [
      {
        id: "usage:ui",
        kind: "ui",
        permission: { action: "read", subject: "Product" },
        location: { file: "app/products.tsx", line: 12, column: 5 },
        confidence: "certain",
      },
    ],
  };
}

describe("buildAuthorizationGraph", () => {
  it("builds permission, resource, boundary, check, component, and file nodes", () => {
    const graph = buildAuthorizationGraph(input());

    expect(graph.nodes.map((node) => node.type)).toEqual(
      expect.arrayContaining([
        "authorization-check",
        "component",
        "file",
        "http-method",
        "permission",
        "resource",
        "role",
        "route",
        "server-action",
      ]),
    );
    expect(graph.nodes).toContainEqual({
      id: "permission:read:Product:",
      type: "permission",
      label: "read Product",
    });
  });

  it("connects only relationships supported by analysis records", () => {
    const graph = buildAuthorizationGraph(input());
    const relations = graph.edges.map(
      (edge) => `${edge.type}|${edge.source}|${edge.target}`,
    );

    expect(relations).toEqual(
      expect.arrayContaining([
        "grants|file:src%2Fability.ts|permission:read:Product:",
        "requires|authorization-check:check%3Aread-product|permission:read:Product:",
        "enforces|route:route%3AGET%3A%2Fapi%2Fproducts|authorization-check:check%3Aread-product",
        "enforces|server-action:action%3Alist-products|authorization-check:check%3Aread-product",
        "invokes|file:app%2Fproducts.tsx|route:route%3AGET%3A%2Fapi%2Fproducts",
        "requires|component:app%2Fproducts.tsx|permission:read:Product:",
      ]),
    );
    expect(relations.some((relation) => relation.includes("missing"))).toBe(
      false,
    );
  });

  it("deduplicates canonical nodes and produces deterministic output", () => {
    const first = buildAuthorizationGraph(input());
    const reversed = input();

    const second = buildAuthorizationGraph({
      ...reversed,
      permissions: [...reversed.permissions].reverse(),
      routes: [...reversed.routes].reverse(),
      usages: [...reversed.usages].reverse(),
    });

    expect(second).toEqual(first);
    expect(
      first.nodes.filter((node) => node.id === "permission:read:Product:"),
    ).toHaveLength(1);
    expect(new Set(first.edges.map((edge) => edge.id)).size).toBe(
      first.edges.length,
    );
  });

  it("keeps roles disconnected when no grant association exists", () => {
    const graph = buildAuthorizationGraph(input());
    const roleId = "role:admin";

    expect(
      graph.edges.some(
        (edge) => edge.source === roleId || edge.target === roleId,
      ),
    ).toBe(false);
  });
});
