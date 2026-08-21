import { createNextAuthorization } from "@ironpermjs/next";
import { defineAbilityFor } from "./ability";
import { requireUser } from "./session";

export const authorization = createNextAuthorization(async () =>
  defineAbilityFor(await requireUser()),
);
