import type {
  AuthorizationIssue,
  FindingConfidence,
  PermissionDescriptor,
  SourceLocation,
} from "./authorization.js";

export const ANALYSIS_MODEL_VERSION = 2 as const;

export interface PermissionRecord extends PermissionDescriptor {
  readonly id: string;
  readonly inverted: boolean;
  readonly location: SourceLocation;
  readonly confidence: FindingConfidence;
}

export interface RoleRecord {
  readonly id: string;
  readonly name: string;
  readonly location?: SourceLocation;
}

export interface RouteRecord {
  readonly id: string;
  readonly path: string;
  readonly method: string;
  readonly location: SourceLocation;
  readonly authorizationCheckIds: readonly string[];
}

export interface ServerActionRecord {
  readonly id: string;
  readonly name: string;
  readonly location: SourceLocation;
  readonly authorizationCheckIds: readonly string[];
}

export interface HttpRouteMatch {
  readonly routeId: string;
  readonly confidence: FindingConfidence;
}

export interface HttpClientRequestRecord {
  readonly id: string;
  readonly client: string;
  readonly method: string;
  readonly path: string;
  readonly dynamic: boolean;
  readonly location: SourceLocation;
  readonly confidence: FindingConfidence;
  readonly routeMatches: readonly HttpRouteMatch[];
}

export type AuthorizationCheckKind =
  "casl-can" | "casl-throw-unless-can" | "permguard-require-can";

export interface AuthorizationCheck {
  readonly id: string;
  readonly kind: AuthorizationCheckKind;
  readonly permission: PermissionDescriptor;
  readonly location: SourceLocation;
  readonly confidence: FindingConfidence;
}

export type PermissionUsageKind = "definition" | "check" | "ui";

export interface PermissionUsage {
  readonly id: string;
  readonly kind: PermissionUsageKind;
  readonly permission: PermissionDescriptor;
  readonly location: SourceLocation;
  readonly confidence: FindingConfidence;
}

export type AuthorizationGraphNodeType =
  | "role"
  | "permission"
  | "component"
  | "route"
  | "http-method"
  | "server-action"
  | "authorization-check"
  | "resource"
  | "file";

export type AuthorizationGraphEdgeType =
  | "grants"
  | "requires"
  | "enforces"
  | "invokes"
  | "protects"
  | "inherits"
  | "references";

export interface AuthorizationGraphNode {
  readonly id: string;
  readonly type: AuthorizationGraphNodeType;
  readonly label: string;
}

export interface AuthorizationGraphEdge {
  readonly id: string;
  readonly type: AuthorizationGraphEdgeType;
  readonly source: string;
  readonly target: string;
}

export interface AuthorizationGraph {
  readonly nodes: readonly AuthorizationGraphNode[];
  readonly edges: readonly AuthorizationGraphEdge[];
}

export interface CoverageMetric {
  readonly detected: number;
  readonly expected: number;
  readonly percentage: number;
}

export interface AuthorizationCoverage {
  readonly routes: CoverageMetric;
  readonly serverActions: CoverageMetric;
  readonly overall: CoverageMetric;
}

export interface AnalysisResult {
  readonly modelVersion: typeof ANALYSIS_MODEL_VERSION;
  readonly permissions: readonly PermissionRecord[];
  readonly roles: readonly RoleRecord[];
  readonly routes: readonly RouteRecord[];
  readonly serverActions: readonly ServerActionRecord[];
  readonly httpClientRequests: readonly HttpClientRequestRecord[];
  readonly authorizationChecks: readonly AuthorizationCheck[];
  readonly usages: readonly PermissionUsage[];
  readonly issues: readonly AuthorizationIssue[];
  readonly graph: AuthorizationGraph;
  readonly coverage: AuthorizationCoverage;
}
