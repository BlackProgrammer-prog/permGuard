import type {
  AnalysisResult,
  PermissionRecord,
  RouteRecord,
  ServerActionRecord,
} from "@permguard/core";
import type {
  AuthorizationDiff,
  AuthorizationDiffChange,
  CoverageDelta,
} from "./types.js";

function part(value: string): string {
  return encodeURIComponent(value);
}

function permissionKey(permission: PermissionRecord): string {
  return [
    permission.inverted ? "cannot" : "can",
    permission.action,
    permission.subject,
    permission.field ?? "",
  ].join(":");
}

function permissionSummary(permission: PermissionRecord): string {
  const field = permission.field ? ` field ${permission.field}` : "";
  return `${permission.inverted ? "cannot" : "can"} ${permission.action} ${permission.subject}${field}`;
}

function routeKey(route: RouteRecord): string {
  return `${route.method}:${route.path}`;
}

function actionKey(action: ServerActionRecord): string {
  return action.id;
}

function recognizedCheckIds(analysis: AnalysisResult): ReadonlySet<string> {
  return new Set(analysis.authorizationChecks.map((check) => check.id));
}

function isProtected(
  ids: readonly string[],
  knownChecks: ReadonlySet<string>,
): boolean {
  return ids.some((id) => knownChecks.has(id));
}

function coverageDelta(before: number, after: number): CoverageDelta {
  return {
    before,
    after,
    delta: Math.round((after - before) * 100) / 100,
  };
}

function compareChanges(
  left: AuthorizationDiffChange,
  right: AuthorizationDiffChange,
): number {
  const entity = left.entityType.localeCompare(right.entityType);
  if (entity !== 0) return entity;
  const id = left.id.localeCompare(right.id);
  if (id !== 0) return id;
  return left.kind.localeCompare(right.kind);
}

export function diffAnalysisResults(
  baseline: AnalysisResult,
  current: AnalysisResult,
): AuthorizationDiff {
  const changes: AuthorizationDiffChange[] = [];

  const beforePermissions = new Map(
    baseline.permissions.map((permission) => [
      permissionKey(permission),
      permission,
    ]),
  );
  const afterPermissions = new Map(
    current.permissions.map((permission) => [
      permissionKey(permission),
      permission,
    ]),
  );

  for (const [key, permission] of afterPermissions) {
    if (beforePermissions.has(key)) continue;
    changes.push({
      id: `permission:${part(key)}`,
      kind: "added",
      entityType: "permission",
      summary: `Added ${permissionSummary(permission)}`,
      ...(!permission.inverted ? { severity: "WARNING" as const } : {}),
    });
  }
  for (const [key, permission] of beforePermissions) {
    if (afterPermissions.has(key)) continue;
    changes.push({
      id: `permission:${part(key)}`,
      kind: "removed",
      entityType: "permission",
      summary: `Removed ${permissionSummary(permission)}`,
    });
  }

  const beforeChecks = recognizedCheckIds(baseline);
  const afterChecks = recognizedCheckIds(current);
  const beforeRoutes = new Map(
    baseline.routes.map((route) => [routeKey(route), route]),
  );
  const afterRoutes = new Map(
    current.routes.map((route) => [routeKey(route), route]),
  );

  for (const [key, route] of afterRoutes) {
    const previous = beforeRoutes.get(key);
    const protectedNow = isProtected(route.authorizationCheckIds, afterChecks);
    if (!previous) {
      changes.push({
        id: `route:${part(key)}`,
        kind: "added",
        entityType: "route",
        summary: `Added ${route.method} ${route.path}${protectedNow ? "" : " without recognized authorization"}`,
        ...(!protectedNow ? { severity: "HIGH" as const } : {}),
      });
      continue;
    }

    const protectedBefore = isProtected(
      previous.authorizationCheckIds,
      beforeChecks,
    );
    if (protectedBefore !== protectedNow) {
      changes.push({
        id: `route:${part(key)}:enforcement`,
        kind: "changed",
        entityType: "route",
        summary: `${route.method} ${route.path} authorization enforcement ${protectedNow ? "added" : "removed"}`,
        ...(!protectedNow ? { severity: "HIGH" as const } : {}),
      });
    }
  }
  for (const [key, route] of beforeRoutes) {
    if (afterRoutes.has(key)) continue;
    changes.push({
      id: `route:${part(key)}`,
      kind: "removed",
      entityType: "route",
      summary: `Removed ${route.method} ${route.path}`,
    });
  }

  const beforeActions = new Map(
    baseline.serverActions.map((action) => [actionKey(action), action]),
  );
  const afterActions = new Map(
    current.serverActions.map((action) => [actionKey(action), action]),
  );

  for (const [key, action] of afterActions) {
    const previous = beforeActions.get(key);
    const protectedNow = isProtected(action.authorizationCheckIds, afterChecks);
    if (!previous) {
      changes.push({
        id: `server-action:${part(key)}`,
        kind: "added",
        entityType: "server-action",
        summary: `Added Server Action ${action.name}${protectedNow ? "" : " without recognized authorization"}`,
        ...(!protectedNow ? { severity: "HIGH" as const } : {}),
      });
      continue;
    }

    const protectedBefore = isProtected(
      previous.authorizationCheckIds,
      beforeChecks,
    );
    if (protectedBefore !== protectedNow) {
      changes.push({
        id: `server-action:${part(key)}:enforcement`,
        kind: "changed",
        entityType: "server-action",
        summary: `Server Action ${action.name} authorization enforcement ${protectedNow ? "added" : "removed"}`,
        ...(!protectedNow ? { severity: "HIGH" as const } : {}),
      });
    }
  }
  for (const [key, action] of beforeActions) {
    if (afterActions.has(key)) continue;
    changes.push({
      id: `server-action:${part(key)}`,
      kind: "removed",
      entityType: "server-action",
      summary: `Removed Server Action ${action.name}`,
    });
  }

  const beforeIssues = new Map(
    baseline.issues.map((issue) => [issue.id, issue]),
  );
  const afterIssues = new Map(current.issues.map((issue) => [issue.id, issue]));

  for (const [id, issue] of afterIssues) {
    if (beforeIssues.has(id)) continue;
    changes.push({
      id: `issue:${part(id)}`,
      kind: "added",
      entityType: "issue",
      summary: `New ${issue.severity} issue: ${issue.title}`,
      severity: issue.severity,
    });
  }
  for (const [id, issue] of beforeIssues) {
    if (afterIssues.has(id)) continue;
    changes.push({
      id: `issue:${part(id)}`,
      kind: "removed",
      entityType: "issue",
      summary: `Resolved ${issue.severity} issue: ${issue.title}`,
    });
  }

  return {
    modelVersion: current.modelVersion,
    changes: changes.sort(compareChanges),
    coverage: {
      routes: coverageDelta(
        baseline.coverage.routes.percentage,
        current.coverage.routes.percentage,
      ),
      serverActions: coverageDelta(
        baseline.coverage.serverActions.percentage,
        current.coverage.serverActions.percentage,
      ),
      overall: coverageDelta(
        baseline.coverage.overall.percentage,
        current.coverage.overall.percentage,
      ),
    },
  };
}
