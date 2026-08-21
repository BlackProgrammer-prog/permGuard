import type {
  AuthorizationCheck,
  RouteRecord,
  ServerActionRecord,
} from "@ironpermjs/core";
import { describe, expect, it } from "vitest";
import { calculateAuthorizationCoverage } from "./calculate-authorization-coverage.js";

const location = { file: "app/actions.ts", line: 1, column: 1 } as const;

function check(id: string): AuthorizationCheck {
  return {
    id,
    kind: "ironpermjs-require-can",
    permission: { action: "read", subject: "Product" },
    location,
    confidence: "certain",
  };
}

function route(id: string, checkIds: readonly string[]): RouteRecord {
  return {
    id,
    method: "GET",
    path: `/${id}`,
    location,
    authorizationCheckIds: checkIds,
  };
}

function action(id: string, checkIds: readonly string[]): ServerActionRecord {
  return {
    id,
    name: id,
    location,
    authorizationCheckIds: checkIds,
  };
}

describe("calculateAuthorizationCoverage", () => {
  it("calculates route, Server Action, and overall metrics", () => {
    const coverage = calculateAuthorizationCoverage({
      routes: [
        route("products", ["read"]),
        route("orders", []),
        route("reports", ["read", "audit"]),
      ],
      serverActions: [
        action("updateProduct", ["write"]),
        action("deleteProduct", []),
      ],
      authorizationChecks: [check("read"), check("audit"), check("write")],
    });

    expect(coverage).toEqual({
      routes: { detected: 2, expected: 3, percentage: 66.67 },
      serverActions: { detected: 1, expected: 2, percentage: 50 },
      overall: { detected: 3, expected: 5, percentage: 60 },
    });
  });

  it("does not count stale or unknown check IDs as enforcement", () => {
    const coverage = calculateAuthorizationCoverage({
      routes: [route("products", ["missing"])],
      serverActions: [action("updateProduct", ["known", "missing"])],
      authorizationChecks: [check("known")],
    });

    expect(coverage.routes).toEqual({
      detected: 0,
      expected: 1,
      percentage: 0,
    });
    expect(coverage.serverActions.detected).toBe(1);
  });

  it("counts a boundary once even when it contains multiple checks", () => {
    const coverage = calculateAuthorizationCoverage({
      routes: [route("products", ["read", "audit", "read"])],
      serverActions: [],
      authorizationChecks: [check("read"), check("audit")],
    });

    expect(coverage.routes).toEqual({
      detected: 1,
      expected: 1,
      percentage: 100,
    });
  });

  it("returns 100 percent for an empty boundary set", () => {
    const coverage = calculateAuthorizationCoverage({
      routes: [],
      serverActions: [],
      authorizationChecks: [],
    });

    expect(coverage).toEqual({
      routes: { detected: 0, expected: 0, percentage: 100 },
      serverActions: { detected: 0, expected: 0, percentage: 100 },
      overall: { detected: 0, expected: 0, percentage: 100 },
    });
  });
});
