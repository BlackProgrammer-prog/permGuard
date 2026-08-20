import type {
  AuthorizationIssue,
  RouteRecord,
  ServerActionRecord,
} from "@permguard/core";
import type { CaslUsageResult } from "../casl-usage/types.js";
import type { AnalyzerProject } from "../types.js";

export interface DetectAuthorizationIssuesInput {
  readonly project: AnalyzerProject;
  readonly routes: readonly RouteRecord[];
  readonly serverActions: readonly ServerActionRecord[];
  readonly caslUsage: CaslUsageResult;
}

export interface IssueDetectionResult {
  readonly routes: readonly RouteRecord[];
  readonly serverActions: readonly ServerActionRecord[];
  readonly issues: readonly AuthorizationIssue[];
}
