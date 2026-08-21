import type {
  AuthorizationCheck,
  PermissionRecord,
  PermissionUsage,
} from "@ironpermjs/core";

export interface CaslUsageResult {
  readonly permissions: readonly PermissionRecord[];
  readonly authorizationChecks: readonly AuthorizationCheck[];
  readonly usages: readonly PermissionUsage[];
}
