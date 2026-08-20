import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAnalyzerProject } from "../create-analyzer-project.js";
import { discoverServerActions } from "./discover-server-actions.js";

const fixtureDir = fileURLToPath(
  new URL("../../../../fixtures/analyzer/server-actions/", import.meta.url),
);

function createFixtureProject() {
  return createAnalyzerProject({ rootDir: fixtureDir });
}

describe("discoverServerActions", () => {
  it("discovers file-level and inline server actions in stable source order", () => {
    const actions = discoverServerActions(createFixtureProject());

    expect(actions.map((action) => action.name)).toEqual([
      "createProduct",
      "deleteProduct",
      "publishProduct",
      "updateProduct",
      "saveDraft",
    ]);
    expect(
      actions.every((action) => action.authorizationCheckIds.length === 0),
    ).toBe(true);
  });

  it("records exact action locations and stable IDs", () => {
    const actions = discoverServerActions(createFixtureProject());
    const createProduct = actions.find(
      (action) => action.name === "createProduct",
    );
    const updateProduct = actions.find(
      (action) => action.name === "updateProduct",
    );

    expect(createProduct).toEqual({
      id: "next-server-action:createProduct:app/actions.ts:3:23",
      name: "createProduct",
      location: { file: "app/actions.ts", line: 3, column: 23 },
      authorizationCheckIds: [],
    });
    expect(updateProduct?.location).toEqual({
      file: "app/products/page.tsx",
      line: 2,
      column: 18,
    });
  });

  it("supports exported async variables and local export aliases", () => {
    const names = discoverServerActions(createFixtureProject()).map(
      (action) => action.name,
    );

    expect(names).toContain("deleteProduct");
    expect(names).toContain("publishProduct");
  });

  it("ignores sync functions, non-exported file-level functions, and ordinary async functions", () => {
    const names = discoverServerActions(createFixtureProject()).map(
      (action) => action.name,
    );

    expect(names).not.toContain("syncAction");
    expect(names).not.toContain("internalHelper");
    expect(names).not.toContain("ordinaryAsyncFunction");
    expect(names).not.toContain("importedAction");
  });
});
