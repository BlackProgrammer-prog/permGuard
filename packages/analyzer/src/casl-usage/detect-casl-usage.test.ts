import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAnalyzerProject } from "../create-analyzer-project.js";
import { detectCaslUsage } from "./detect-casl-usage.js";

const fixturesDir = fileURLToPath(
  new URL("../../../../fixtures/analyzer/", import.meta.url),
);

function detectFixture() {
  const project = createAnalyzerProject({
    rootDir: path.join(fixturesDir, "casl-usage"),
  });

  return detectCaslUsage(project);
}

describe("detectCaslUsage", () => {
  it("detects AbilityBuilder and defineAbility rules including aliases and arrays", () => {
    const result = detectFixture();

    expect(
      result.permissions.map((permission) => ({
        action: permission.action,
        subject: permission.subject,
        inverted: permission.inverted,
      })),
    ).toEqual([
      { action: "read", subject: "Product", inverted: false },
      { action: "update", subject: "Product", inverted: false },
      { action: "delete", subject: "Product", inverted: true },
      { action: "publish", subject: "Article", inverted: false },
      { action: "archive", subject: "Article", inverted: true },
    ]);
    expect(
      result.permissions.every(
        (permission) => permission.confidence === "certain",
      ),
    ).toBe(true);
  });

  it("detects CASL and IronPermJS enforcement calls", () => {
    const result = detectFixture();

    expect(
      result.authorizationChecks.map((check) => [
        check.kind,
        check.permission.action,
        check.permission.subject,
      ]),
    ).toEqual([
      ["casl-can", "read", "Product"],
      ["casl-throw-unless-can", "delete", "Product"],
      ["ironpermjs-require-can", "update", "Product"],
    ]);
  });

  it("records imported React helpers as UI permission usages", () => {
    const result = detectFixture();
    const uiUsages = result.usages.filter((usage) => usage.kind === "ui");

    expect(uiUsages.map((usage) => usage.permission)).toEqual([
      { action: "update", subject: "Product" },
      { action: "delete", subject: "Product", field: "status" },
    ]);
  });

  it("does not treat unrelated can functions or dynamic permissions as CASL usage", () => {
    const result = detectFixture();
    const allPermissions = [
      ...result.permissions,
      ...result.authorizationChecks.map((check) => check.permission),
      ...result.usages.map((usage) => usage.permission),
    ];

    expect(
      allPermissions.some((permission) => permission.action === "fake"),
    ).toBe(false);
    expect(
      allPermissions.some((permission) => permission.action === "local"),
    ).toBe(false);
    expect(
      allPermissions.some(
        (permission) => permission.subject === "DynamicSubject",
      ),
    ).toBe(false);
  });

  it("creates one usage for every detected definition, check, and UI reference", () => {
    const result = detectFixture();

    expect(
      result.usages.filter((usage) => usage.kind === "definition"),
    ).toHaveLength(5);
    expect(
      result.usages.filter((usage) => usage.kind === "check"),
    ).toHaveLength(3);
    expect(result.usages.filter((usage) => usage.kind === "ui")).toHaveLength(
      2,
    );
  });
});
