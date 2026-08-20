import {
  AbilityBuilder,
  createMongoAbility,
  defineAbility,
  ForbiddenError,
} from "@casl/ability";
import { requireCan as enforce } from "@permguard/server";

const {
  can: allow,
  cannot: deny,
  build,
} = new AbilityBuilder(createMongoAbility);

allow(["read", "update"], "Product");
deny("delete", "Product");

export const articleAbility = defineAbility((grant, forbid) => {
  grant("publish", "Article");
  forbid("archive", "Article");
});

export const ability = build();

ability.can("read", "Product");
ForbiddenError.from(ability).throwUnlessCan("delete", "Product");
enforce(ability, "update", "Product");

const fake = {
  can(_action: string, _subject: string) {
    void [_action, _subject];

    return true;
  },
};

fake.can("fake", "Thing");

function can(_action: string, _subject: string) {
  void [_action, _subject];

  return true;
}

can("local", "Thing");

const dynamicAction = "read";
ability.can(dynamicAction, "DynamicSubject");
