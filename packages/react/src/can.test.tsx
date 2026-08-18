// @vitest-environment jsdom

import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { AbilityProvider } from "@casl/react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Can } from "./index.js";

type AppAbility = MongoAbility<["read" | "delete", "Product"]>;

function createAbility() {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  can("read", "Product");
  return build();
}

describe("Can", () => {
  it("renders children or fallback from the CASL decision", () => {
    const ability = createAbility();

    render(
      <AbilityProvider value={ability}>
        <Can action="read" subject="Product">
          <span>allowed</span>
        </Can>
        <Can action="delete" subject="Product" fallback={<span>denied</span>}>
          <span>delete</span>
        </Can>
      </AbilityProvider>,
    );

    expect(screen.getByText("allowed")).toBeTruthy();
    expect(screen.getByText("denied")).toBeTruthy();
    expect(screen.queryByText("delete")).toBeNull();
  });

  it("reacts when the provided ability is updated", () => {
    const ability = createAbility();

    render(
      <AbilityProvider value={ability}>
        <Can action="delete" subject="Product">
          <span>delete</span>
        </Can>
      </AbilityProvider>,
    );

    expect(screen.queryByText("delete")).toBeNull();

    act(() => {
      ability.update([
        ...ability.rules,
        { action: "delete", subject: "Product" },
      ]);
    });

    expect(screen.getByText("delete")).toBeTruthy();
  });

  it("supports inverted UI checks and render props", () => {
    render(
      <AbilityProvider value={createAbility()}>
        <Can action="delete" subject="Product" not>
          {(isAllowed) => <span>{isAllowed ? "hidden" : "visible"}</span>}
        </Can>
      </AbilityProvider>,
    );

    expect(screen.getByText("hidden")).toBeTruthy();
  });
});
