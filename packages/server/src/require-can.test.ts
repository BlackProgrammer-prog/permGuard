import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { describe, expect, it } from "vitest";
import { isForbiddenError, requireCan } from "./index.js";

type AppAbility = MongoAbility<["read" | "delete", "Product"]>;

function createAbility() {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  can("read", "Product");
  return build();
}

describe("requireCan", () => {
  it("returns when CASL allows the operation", () => {
    expect(() => requireCan(createAbility(), "read", "Product")).not.toThrow();
  });

  it("throws the native CASL ForbiddenError when denied", () => {
    try {
      requireCan(createAbility(), "delete", "Product");
      throw new Error("Expected requireCan to throw");
    } catch (error) {
      expect(isForbiddenError(error)).toBe(true);
      expect(error).toMatchObject({
        action: "delete",
        subject: "Product",
        subjectType: "Product",
      });
    }
  });
});
