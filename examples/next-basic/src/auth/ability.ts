import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import type { AppAbility, CurrentUser } from "./types";

export function defineAbilityFor(user: CurrentUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility,
  );

  if (user.role === "admin") {
    can("manage", "all");
  }

  if (user.role === "editor") {
    can("read", "Product");
    can("update", "Product");
    can("publish", "Product");
  }

  if (user.role === "viewer") {
    can("read", "Product");
  }

  cannot("delete", "Product");

  return build();
}
