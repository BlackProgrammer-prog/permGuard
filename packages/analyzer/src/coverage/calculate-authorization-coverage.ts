import type {
  AuthorizationCoverage,
  CoverageMetric,
} from "@permguard/core";
import type { CalculateAuthorizationCoverageInput } from "./types.js";

function percentage(detected: number, expected: number): number {
  if (expected === 0) return 100;
  return Math.round((detected / expected) * 10_000) / 100;
}

function metric(detected: number, expected: number): CoverageMetric {
  return {
    detected,
    expected,
    percentage: percentage(detected, expected),
  };
}

function hasRecognizedCheck(
  checkIds: readonly string[],
  knownCheckIds: ReadonlySet<string>,
): boolean {
  return checkIds.some((checkId) => knownCheckIds.has(checkId));
}

export function calculateAuthorizationCoverage({
  routes,
  serverActions,
  authorizationChecks,
}: CalculateAuthorizationCoverageInput): AuthorizationCoverage {
  const knownCheckIds = new Set(
    authorizationChecks.map((check) => check.id),
  );
  const protectedRoutes = routes.filter((route) =>
    hasRecognizedCheck(route.authorizationCheckIds, knownCheckIds),
  ).length;
  const protectedServerActions = serverActions.filter((action) =>
    hasRecognizedCheck(action.authorizationCheckIds, knownCheckIds),
  ).length;
  const detected = protectedRoutes + protectedServerActions;
  const expected = routes.length + serverActions.length;

  return {
    routes: metric(protectedRoutes, routes.length),
    serverActions: metric(protectedServerActions, serverActions.length),
    overall: metric(detected, expected),
  };
}
