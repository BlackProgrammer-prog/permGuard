import type { AnalysisResult } from "@permguard/core";

export type BuildAuthorizationGraphInput = Pick<
  AnalysisResult,
  | "permissions"
  | "roles"
  | "routes"
  | "serverActions"
  | "httpClientRequests"
  | "authorizationChecks"
  | "usages"
>;
