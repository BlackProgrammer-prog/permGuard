import { ForbiddenError, type AnyAbility } from "@casl/ability";

export function requireCan<TAbility extends AnyAbility>(
  ability: TAbility,
  ...args: Parameters<TAbility["can"]>
): void {
  ForbiddenError.from(ability).throwUnlessCan(...args);
}

export function isForbiddenError(
  error: unknown,
): error is ForbiddenError<AnyAbility> {
  return error instanceof ForbiddenError;
}
