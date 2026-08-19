import type { AnyAbility } from "@casl/ability";
import {isForbiddenError , requireCan as enforceCan} from "@permguard/server";
import {forbiddenResponse} from "./responses";
import type {AppRouteHandler , PermGuardRouteContext , WithAuthorizationOptions} from "./route-handler";

export type AbilityResolver<TAbility extends AnyAbility> = () => |TAbility |Promise<TAbility>;

export interface NextAuthorization<TAbility extends  AnyAbility> {
  requireCan(
    ...permissions: Parameters<TAbility["can"]>
  ) : Promise<TAbility>;
  
  withAuthorization<TContext extends Parameters<any>>()
}
