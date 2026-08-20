import type {
  AuthorizationCheck,
  PermissionRecord,
  PermissionUsage,
} from "@permguard/core";

export interface CaslUsageResult {
  readonly permissions: readonly PermissionRecord[];
  readonly authorizationChecks: readonly AuthorizationCheck[];
  readonly usages: readonly PermissionUsage[];
}
