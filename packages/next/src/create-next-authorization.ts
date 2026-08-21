import type { AnyAbility } from "@casl/ability";
import { isForbiddenError, requireCan as enforceCan } from "@ironpermjs/server";

import { forbiddenResponse } from "./responses.js";
import type {
  AppRouteHandler,
  IronPermJSRouteContext,
  WithAuthorizationOptions,
} from "./route-handler.js";

export type AbilityResolver<TAbility extends AnyAbility> = () =>
  TAbility | Promise<TAbility>;

export interface NextAuthorization<TAbility extends AnyAbility> {
  requireCan(...permission: Parameters<TAbility["can"]>): Promise<TAbility>;

  withAuthorization<
    TContext extends IronPermJSRouteContext = IronPermJSRouteContext,
  >(
    permission: Parameters<TAbility["can"]>,
    handler: AppRouteHandler<TContext>,
    options?: WithAuthorizationOptions,
  ): AppRouteHandler<TContext>;
}

export function createNextAuthorization<TAbility extends AnyAbility>(
  resolveAbility: AbilityResolver<TAbility>,
): NextAuthorization<TAbility> {
  async function requireCan(
    ...permission: Parameters<TAbility["can"]>
  ): Promise<TAbility> {
    const ability = await resolveAbility();

    enforceCan(ability, ...permission);

    return ability;
  }

  function withAuthorization<
    TContext extends IronPermJSRouteContext = IronPermJSRouteContext,
  >(
    permission: Parameters<TAbility["can"]>,
    handler: AppRouteHandler<TContext>,
    options: WithAuthorizationOptions = {},
  ): AppRouteHandler<TContext> {
    return async (request, context) => {
      try {
        await requireCan(...permission);
      } catch (error) {
        if (!isForbiddenError(error)) {
          throw error;
        }

        if (options.onForbidden) {
          return options.onForbidden(error);
        }

        return forbiddenResponse();
      }

      return handler(request, context);
    };
  }

  return {
    requireCan,
    withAuthorization,
  };
}
