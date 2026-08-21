import type { AnalysisResult } from "@ironpermjs/core";

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
