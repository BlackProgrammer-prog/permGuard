import { describe, expect, expectTypeOf, it } from "vitest";
import {
  ANALYSIS_MODEL_VERSION,
  type AuthorizationIssue,
  type PermissionSnapshot,
} from "./index.js";

describe("@permguard/core", () => {
  it("exposes a stable analysis model version", () => {
    expect(ANALYSIS_MODEL_VERSION).toBe(1);
  });

  it("keeps findings and snapshots serializable", () => {
    const issue: AuthorizationIssue = {
      id: "missing-route-auth",
      severity: "HIGH",
      confidence: "certain",
      title: "Missing authorization",
      explanation: "No recognized authorization check was found.",
      location: { file: "app/api/products/route.ts", line: 12, column: 1 },
      permission: { action: "delete", subject: "Product" },
    };
    const snapshot: PermissionSnapshot = {
      version: 1,
      permissions: [{ action: "read", subject: "Product" }],
    };

    expect(JSON.parse(JSON.stringify({ issue, snapshot }))).toEqual({
      issue,
      snapshot,
    });
    expectTypeOf(snapshot.version).toEqualTypeOf<1>();
  });
});
