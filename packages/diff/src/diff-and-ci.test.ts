import { ANALYSIS_MODEL_VERSION, type AnalysisResult } from "@ironpermjs/core";
import { describe, expect, it } from "vitest";
import { diffAnalysisResults } from "./diff-analysis-results.js";
import { evaluateCiPolicy } from "./evaluate-ci-policy.js";

const location = { file: "app/api/route.ts", line: 1, column: 1 } as const;

function result(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    modelVersion: ANALYSIS_MODEL_VERSION,
    permissions: [],
    roles: [],
    routes: [],
    serverActions: [],
    httpClientRequests: [],
    authorizationChecks: [],
    usages: [],
    issues: [],
    graph: { nodes: [], edges: [] },
    coverage: {
      routes: { detected: 0, expected: 0, percentage: 100 },
      serverActions: { detected: 0, expected: 0, percentage: 100 },
      overall: { detected: 0, expected: 0, percentage: 100 },
    },
    ...overrides,
  };
}

const readCheck = {
  id: "check:read",
  kind: "ironpermjs-require-can",
  permission: { action: "read", subject: "Product" },
  location,
  confidence: "certain",
} as const;

describe("diffAnalysisResults", () => {
  it("detects permission, boundary enforcement, issue, and coverage changes", () => {
    const baseline = result({
      routes: [
        {
          id: "route:products",
          method: "GET",
          path: "/api/products",
          location,
          authorizationCheckIds: ["check:read"],
        },
      ],
      authorizationChecks: [readCheck],
      issues: [
        {
          id: "old-warning",
          severity: "WARNING",
          confidence: "medium",
          title: "Old warning",
          explanation: "Resolved",
          location,
        },
      ],
      coverage: {
        routes: { detected: 1, expected: 1, percentage: 100 },
        serverActions: { detected: 0, expected: 0, percentage: 100 },
        overall: { detected: 1, expected: 1, percentage: 100 },
      },
    });
    const current = result({
      permissions: [
        {
          id: "rule:manage",
          action: "manage",
          subject: "all",
          inverted: false,
          location,
          confidence: "certain",
        },
      ],
      routes: [
        {
          id: "route:products:moved",
          method: "GET",
          path: "/api/products",
          location: { ...location, line: 20 },
          authorizationCheckIds: [],
        },
      ],
      issues: [
        {
          id: "missing-products",
          severity: "HIGH",
          confidence: "high",
          title: "Missing authorization",
          explanation: "No recognized check",
          location,
        },
      ],
      coverage: {
        routes: { detected: 0, expected: 1, percentage: 0 },
        serverActions: { detected: 0, expected: 0, percentage: 100 },
        overall: { detected: 0, expected: 1, percentage: 0 },
      },
    });

    const diff = diffAnalysisResults(baseline, current);

    expect(diff.changes.map((change) => change.summary)).toEqual(
      expect.arrayContaining([
        "Added can manage all",
        "GET /api/products authorization enforcement removed",
        "New HIGH issue: Missing authorization",
        "Resolved WARNING issue: Old warning",
      ]),
    );
    expect(
      diff.changes.find((change) =>
        change.summary.includes("enforcement removed"),
      )?.severity,
    ).toBe("HIGH");
    expect(diff.coverage.overall).toEqual({
      before: 100,
      after: 0,
      delta: -100,
    });
  });

  it("reports newly added unprotected boundaries as high risk", () => {
    const current = result({
      routes: [
        {
          id: "route:delete",
          method: "DELETE",
          path: "/api/products/[id]",
          location,
          authorizationCheckIds: [],
        },
      ],
    });

    const diff = diffAnalysisResults(result(), current);
    expect(diff.changes).toContainEqual(
      expect.objectContaining({
        kind: "added",
        entityType: "route",
        severity: "HIGH",
      }),
    );
  });

  it("ignores source movement when semantic permission and route keys match", () => {
    const permission = {
      id: "rule:read",
      action: "read",
      subject: "Product",
      inverted: false,
      location,
      confidence: "certain",
    } as const;
    const route = {
      id: "route:read",
      method: "GET",
      path: "/api/products",
      location,
      authorizationCheckIds: ["check:read"],
    } as const;
    const baseline = result({
      permissions: [permission],
      routes: [route],
      authorizationChecks: [readCheck],
    });
    const current = result({
      permissions: [
        {
          ...permission,
          id: "rule:read:moved",
          location: { ...location, line: 40 },
        },
      ],
      routes: [
        {
          ...route,
          id: "route:read:moved",
          location: { ...location, line: 50 },
        },
      ],
      authorizationChecks: [readCheck],
    });

    expect(diffAnalysisResults(baseline, current).changes).toEqual([]);
  });
});

describe("evaluateCiPolicy", () => {
  const analysis = result({
    issues: [
      {
        id: "info",
        severity: "INFO",
        confidence: "certain",
        title: "Info",
        explanation: "Info",
        location,
      },
      {
        id: "high",
        severity: "HIGH",
        confidence: "high",
        title: "High",
        explanation: "High",
        location,
      },
      {
        id: "critical",
        severity: "CRITICAL",
        confidence: "certain",
        title: "Critical",
        explanation: "Critical",
        location,
      },
    ],
  });

  it("fails on issues at or above the configured threshold", () => {
    const policy = evaluateCiPolicy(analysis, { failOn: "HIGH" });

    expect(policy.passed).toBe(false);
    expect(policy.blockingIssues.map((issue) => issue.id)).toEqual([
      "critical",
      "high",
    ]);
  });

  it("passes when no issue reaches the configured threshold", () => {
    const policy = evaluateCiPolicy(result({ issues: [analysis.issues[0]!] }), {
      failOn: "WARNING",
    });

    expect(policy).toMatchObject({ passed: true, blockingIssues: [] });
  });
});
