import {
  calculateAuthorizationCoverage,
  createAnalyzerProject,
  detectAuthorizationIssues,
  detectCaslUsage,
  detectHttpClientUsage,
  discoverRouteHandlers,
  discoverServerActions,
} from "@permguard/analyzer";
import { ANALYSIS_MODEL_VERSION, type AnalysisResult } from "@permguard/core";
import { buildAuthorizationGraph } from "@permguard/graph";

export interface AnalyzeProjectOptions {
  readonly rootDir: string;
  readonly tsconfigPath?: string;
  readonly additionalClientModules?: readonly string[];
}

export function analyzeProject(options: AnalyzeProjectOptions): AnalysisResult {
  const project = createAnalyzerProject({
    rootDir: options.rootDir,
    ...(options.tsconfigPath ? { tsconfigPath: options.tsconfigPath } : {}),
  });
  const discoveredRoutes = discoverRouteHandlers(project);
  const discoveredServerActions = discoverServerActions(project);
  const caslUsage = detectCaslUsage(project);
  const issueDetection = detectAuthorizationIssues({
    project,
    routes: discoveredRoutes,
    serverActions: discoveredServerActions,
    caslUsage,
  });
  const httpClientRequests = detectHttpClientUsage(
    project,
    issueDetection.routes,
    {
      additionalClientModules: options.additionalClientModules ?? [],
    },
  );
  const coverage = calculateAuthorizationCoverage({
    routes: issueDetection.routes,
    serverActions: issueDetection.serverActions,
    authorizationChecks: caslUsage.authorizationChecks,
  });
  const graph = buildAuthorizationGraph({
    permissions: caslUsage.permissions,
    roles: [],
    routes: issueDetection.routes,
    serverActions: issueDetection.serverActions,
    httpClientRequests,
    authorizationChecks: caslUsage.authorizationChecks,
    usages: caslUsage.usages,
  });

  return {
    modelVersion: ANALYSIS_MODEL_VERSION,
    permissions: caslUsage.permissions,
    roles: [],
    routes: issueDetection.routes,
    serverActions: issueDetection.serverActions,
    httpClientRequests,
    authorizationChecks: caslUsage.authorizationChecks,
    usages: caslUsage.usages,
    issues: issueDetection.issues,
    graph,
    coverage,
  };
}
