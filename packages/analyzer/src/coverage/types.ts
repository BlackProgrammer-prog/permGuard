import type {
  AnalysisResult,
  AuthorizationCoverage,
} from "@ironpermjs/core";

export type CalculateAuthorizationCoverageInput = Pick<
  AnalysisResult,
  "routes" | "serverActions" | "authorizationChecks"
>;

export type AuthorizationCoverageResult = AuthorizationCoverage;
