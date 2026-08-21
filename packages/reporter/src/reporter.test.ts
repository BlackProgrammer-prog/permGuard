import { ANALYSIS_MODEL_VERSION, type AnalysisResult } from "@permguard/core";
import { describe, expect, it } from "vitest";
import { renderHtmlReport } from "./render-html-report.js";
import { renderJsonReport } from "./render-json-report.js";

const location = {
  file: "app/<products>/route.ts",
  line: 7,
  column: 2,
} as const;

function analysis(): AnalysisResult {
  return {
    modelVersion: ANALYSIS_MODEL_VERSION,
    permissions: [
      {
        id: "permission:read",
        action: "read",
        subject: "Product",
        inverted: false,
        location,
        confidence: "certain",
      },
    ],
    roles: [{ id: "admin", name: "Admin" }],
    routes: [
      {
        id: "route:products",
        method: "GET",
        path: "/api/<products>",
        location,
        authorizationCheckIds: ["check:read"],
      },
      {
        id: "route:missing",
        method: "DELETE",
        path: "/api/products/[id]",
        location,
        authorizationCheckIds: ["stale"],
      },
    ],
    serverActions: [
      {
        id: "action:update",
        name: "updateProduct",
        location,
        authorizationCheckIds: [],
      },
    ],
    httpClientRequests: [],
    authorizationChecks: [
      {
        id: "check:read",
        kind: "permguard-require-can",
        permission: { action: "read", subject: "Product" },
        location,
        confidence: "certain",
      },
    ],
    usages: [],
    issues: [
      {
        id: "issue:unsafe",
        severity: "HIGH",
        confidence: "high",
        title: "<script>alert(1)</script>",
        explanation: "Missing & dangerous",
        location,
      },
    ],
    graph: {
      nodes: [{ id: "route:products", type: "route", label: "GET products" }],
      edges: [],
    },
    coverage: {
      routes: { detected: 1, expected: 2, percentage: 50 },
      serverActions: { detected: 0, expected: 1, percentage: 0 },
      overall: { detected: 1, expected: 3, percentage: 33.33 },
    },
  };
}

describe("@permguard/reporter", () => {
  it("renders every offline dashboard section", () => {
    const html = renderHtmlReport(analysis(), {
      title: "Security report",
      projectName: "Storefront",
    });

    for (const section of [
      "Authorization overview",
      "Roles and abilities",
      "Route Handlers",
      "Server Actions",
      "HTTP client requests",
      "Issues",
      "Authorization graph",
    ]) {
      expect(html).toContain(section);
    }
    expect(html).toContain("Storefront");
    expect(html).toContain("33.33%");
    expect(html).not.toMatch(/<(script|link|img)\b/i);
    expect(html).not.toMatch(/https?:\/\//i);
  });

  it("escapes project-controlled content before inserting it into HTML", () => {
    const html = renderHtmlReport(analysis());

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Missing &amp; dangerous");
    expect(html).toContain("/api/&lt;products&gt;");
  });

  it("treats stale check IDs as missing enforcement", () => {
    const html = renderHtmlReport(analysis());
    const detected = html.match(/class="badge protected"/g) ?? [];
    const missing = html.match(/class="badge missing"/g) ?? [];

    expect(detected).toHaveLength(1);
    expect(missing).toHaveLength(2);
  });

  it("renders pretty or compact JSON without changing the model", () => {
    const value = analysis();
    const pretty = renderJsonReport(value);
    const compact = renderJsonReport(value, { pretty: false });

    expect(JSON.parse(pretty)).toEqual(value);
    expect(JSON.parse(compact)).toEqual(value);
    expect(pretty).toContain("\n");
    expect(compact).not.toContain("\n");
  });
});
