import type { AnyAbility, ForbiddenError } from "@casl/ability";
import type { NextRequest } from "next/server";

export type RouteParameters = Record<
  string,
  string | readonly string[] | undefined
>;

export interface PermGuardRouteContext<
  TParams extends RouteParameters = RouteParameters,
> {
  readonly params: Promise<TParams>;
}

export type AppRouteHandler<
  TContext extends PermGuardRouteContext = PermGuardRouteContext,
> = (request: NextRequest, context: TContext) => Response | Promise<Response>;

export interface WithAuthorizationOptions {
  readonly onForbidden?: (
    error: ForbiddenError<AnyAbility>,
  ) => Response | Promise<Response>;
}
