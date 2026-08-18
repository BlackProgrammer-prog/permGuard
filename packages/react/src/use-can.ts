import type { AnyAbility, Subject } from "@casl/ability";
import { useAbility } from "@casl/react";

export function useCan(
  action: string,
  subject: Subject,
  field?: string,
): boolean {
  const ability = useAbility<AnyAbility>();

  return field === undefined
    ? ability.can(action, subject)
    : ability.can(action, subject, field);
}
