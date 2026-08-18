import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { describe, expect, it } from "vitest";
import { createPermissionSnapshot } from "./index.js";

type AppAbility = MongoAbility<["read" | "update" | "delete", "Product"]>;

describe("createPermissionSnapshot", () => {
  it("exposes only selected allowed decisions and removes duplicates", () => {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );
    can("read", "Product");
    can("update", "Product", ["title"]);
    cannot("delete", "Product");
    const ability = build();

    const snapshot = createPermissionSnapshot(ability, [
      { action: "read", subject: "Product" },
      { action: "read", subject: "Product" },
      { action: "update", subject: "Product", field: "title" },
      { action: "update", subject: "Product", field: "ownerId" },
      { action: "delete", subject: "Product" },
    ]);

    expect(snapshot).toEqual({
      version: 1,
      permissions: [
        { action: "read", subject: "Product" },
        { action: "update", subject: "Product", field: "title" },
      ],
    });
    expect(snapshot).not.toHaveProperty("rules");
  });
});
