import type {
  AnalysisResult,
  AuthorizationIssue,
  IssueSeverity,
} from "@permguard/core";

export type AuthorizationDiffChangeKind = "added" | "removed" | "changed";

export type AuthorizationDiffEntityType =
  "permission" | "route" | "server-action" | "issue";

export interface AuthorizationDiffChange {
  readonly id: string;
  readonly kind: AuthorizationDiffChangeKind;
  readonly entityType: AuthorizationDiffEntityType;
  readonly summary: string;
  readonly severity?: IssueSeverity;
}

export interface CoverageDelta {
  readonly before: number;
  readonly after: number;
  readonly delta: number;
}

export interface AuthorizationDiff {
  readonly modelVersion: AnalysisResult["modelVersion"];
  readonly changes: readonly AuthorizationDiffChange[];
  readonly coverage: {
    readonly routes: CoverageDelta;
    readonly serverActions: CoverageDelta;
    readonly overall: CoverageDelta;
  };
}

export interface CiPolicyOptions {
  readonly failOn: IssueSeverity;
}

export interface CiPolicyResult {
  readonly passed: boolean;
  readonly failOn: IssueSeverity;
  readonly blockingIssues: readonly AuthorizationIssue[];
}
