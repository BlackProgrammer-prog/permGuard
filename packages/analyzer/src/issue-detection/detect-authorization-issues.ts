import type {
  AuthorizationIssue,
  PermissionDescriptor,
  PermissionRecord,
  PermissionUsage,
  RouteRecord,
  ServerActionRecord,
  SourceLocation,
} from "@permguard/core";
import { comparePaths } from "../paths.js";
import { associateBoundaryChecks } from "./boundary-association.js";
import {
  hasMatchingDefinition,
  permissionCovers,
} from "./permission-matching.js";
import type {
  DetectAuthorizationIssuesInput,
  IssueDetectionResult,
} from "./types.js";

function permissionKey(permission: PermissionDescriptor): string {
  return [permission.action, permission.subject, permission.field ?? ""].join(
    ":",
  );
}

function locationKey(location: SourceLocation): string {
  return `${location.file}:${location.line}:${location.column}`;
}

function createMissingRouteIssue(route: RouteRecord): AuthorizationIssue {
  return {
    id: `missing-route-authorization:${route.id}`,
    severity: "HIGH",
    confidence: "high",
    title: "Missing route authorization",
    explanation: `${route.method} ${route.path} does not contain a recognized server-side authorization check. Authentication alone is not authorization.`,
    location: route.location,
  };
}

function createMissingActionIssue(
  action: ServerActionRecord,
): AuthorizationIssue {
  return {
    id: `missing-server-action-authorization:${action.id}`,
    severity: "HIGH",
    confidence: "high",
    title: "Missing Server Action authorization",
    explanation: `${action.name} does not contain a recognized server-side authorization check. Client-side visibility checks do not protect this action.`,
    location: action.location,
  };
}

function createUnverifiableBoundaryIssue(
  kind: "route" | "Server Action",
  name: string,
  id: string,
  location: SourceLocation,
): AuthorizationIssue {
  return {
    id: `unverifiable-${kind === "route" ? "route" : "server-action"}:${id}`,
    severity: "WARNING",
    confidence: "low",
    title: `Unable to verify ${kind} authorization`,
    explanation: `PermGuard discovered ${name}, but could not resolve its function body. No claim is made about whether authorization is present.`,
    location,
  };
}

function createUnknownPermissionIssue(
  usage: PermissionUsage,
): AuthorizationIssue {
  return {
    id: `unknown-permission:${permissionKey(usage.permission)}:${locationKey(usage.location)}`,
    severity: "WARNING",
    confidence: "medium",
    title: "Unknown permission reference",
    explanation: `${usage.permission.action} ${usage.permission.subject} is referenced by a ${usage.kind} usage, but no statically detected CASL rule covers it. Dynamic policy definitions may make this finding incomplete.`,
    location: usage.location,
    permission: usage.permission,
  };
}

function createUnusedRuleIssue(
  permission: PermissionRecord,
): AuthorizationIssue {
  return {
    id: `unused-permission-rule:${permission.id}`,
    severity: "INFO",
    confidence: "medium",
    title: "Possibly unused authorization rule",
    explanation: `${permission.inverted ? "cannot" : "can"} ${permission.action} ${permission.subject} is defined but no statically detected check or UI usage is covered by it. Dynamic references may make this finding incomplete.`,
    location: permission.location,
    permission: {
      action: permission.action,
      subject: permission.subject,
      ...(permission.field ? { field: permission.field } : {}),
    },
  };
}

function compareIssues(
  left: AuthorizationIssue,
  right: AuthorizationIssue,
): number {
  const fileComparison = comparePaths(left.location.file, right.location.file);
  if (fileComparison !== 0) return fileComparison;
  if (left.location.line !== right.location.line) {
    return left.location.line - right.location.line;
  }
  if (left.location.column !== right.location.column) {
    return left.location.column - right.location.column;
  }
  return left.id.localeCompare(right.id);
}

function detectPermissionIssues(
  permissions: readonly PermissionRecord[],
  usages: readonly PermissionUsage[],
): readonly AuthorizationIssue[] {
  if (permissions.length === 0) {
    return [];
  }

  const references = usages.filter((usage) => usage.kind !== "definition");
  const issues: AuthorizationIssue[] = [];

  for (const usage of references) {
    if (!hasMatchingDefinition(permissions, usage.permission)) {
      issues.push(createUnknownPermissionIssue(usage));
    }
  }

  for (const permission of permissions) {
    if (
      !references.some((usage) =>
        permissionCovers(permission, usage.permission),
      )
    ) {
      issues.push(createUnusedRuleIssue(permission));
    }
  }

  return issues;
}

export function detectAuthorizationIssues({
  project,
  routes,
  serverActions,
  caslUsage,
}: DetectAuthorizationIssuesInput): IssueDetectionResult {
  const associations = associateBoundaryChecks(
    project,
    routes,
    serverActions,
    caslUsage.authorizationChecks,
  );
  const issues: AuthorizationIssue[] = [];

  for (const association of associations.routes) {
    const route = association.record;

    if (!association.resolved) {
      issues.push(
        createUnverifiableBoundaryIssue(
          "route",
          `${route.method} ${route.path}`,
          route.id,
          route.location,
        ),
      );
    } else if (route.authorizationCheckIds.length === 0) {
      issues.push(createMissingRouteIssue(route));
    }
  }

  for (const association of associations.serverActions) {
    const action = association.record;

    if (!association.resolved) {
      issues.push(
        createUnverifiableBoundaryIssue(
          "Server Action",
          action.name,
          action.id,
          action.location,
        ),
      );
    } else if (action.authorizationCheckIds.length === 0) {
      issues.push(createMissingActionIssue(action));
    }
  }

  issues.push(
    ...detectPermissionIssues(caslUsage.permissions, caslUsage.usages),
  );

  return {
    routes: associations.routes.map((association) => association.record),
    serverActions: associations.serverActions.map(
      (association) => association.record,
    ),
    issues: issues.sort(compareIssues),
  };
}
