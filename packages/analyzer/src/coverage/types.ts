import type {
  AnalysisResult,
  AuthorizationCoverage,
} from "@permguard/core";

export type CalculateAuthorizationCoverageInput = Pick<
  AnalysisResult,
  "routes" | "serverActions" | "authorizationChecks"
>;

export type AuthorizationCoverageResult = AuthorizationCoverage;
