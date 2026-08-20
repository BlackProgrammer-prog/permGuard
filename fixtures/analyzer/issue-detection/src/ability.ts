import { AbilityBuilder, createMongoAbility } from "@casl/ability";

const { can, build } = new AbilityBuilder(createMongoAbility);

can(["read", "update"], "Product");
can("read", "Report");
can("publish", "Article");

export const ability = build();
