import type {
  AuthorizationGraph,
  AuthorizationGraphEdge,
  AuthorizationGraphEdgeType,
  AuthorizationGraphNode,
  AuthorizationGraphNodeType,
  PermissionDescriptor,
  SourceLocation,
} from "@permguard/core";
import type { BuildAuthorizationGraphInput } from "./types.js";

interface GraphAccumulator {
  readonly nodes: Map<string, AuthorizationGraphNode>;
  readonly edges: Map<string, AuthorizationGraphEdge>;
}

function part(value: string): string {
  return encodeURIComponent(value);
}

function permissionId(permission: PermissionDescriptor): string {
  return [
    "permission",
    part(permission.action),
    part(permission.subject),
    part(permission.field ?? ""),
  ].join(":");
}

function permissionLabel(permission: PermissionDescriptor): string {
  const base = `${permission.action} ${permission.subject}`;
  return permission.field ? `${base}.${permission.field}` : base;
}

function fileId(file: string): string {
  return `file:${part(file)}`;
}

function resourceId(subject: string): string {
  return `resource:${part(subject)}`;
}

function addNode(
  graph: GraphAccumulator,
  id: string,
  type: AuthorizationGraphNodeType,
  label: string,
): void {
  if (!graph.nodes.has(id)) graph.nodes.set(id, { id, type, label });
}

function addEdge(
  graph: GraphAccumulator,
  type: AuthorizationGraphEdgeType,
  source: string,
  target: string,
): void {
  const id = `edge:${type}:${source}:${target}`;
  if (!graph.edges.has(id)) graph.edges.set(id, { id, type, source, target });
}

function addFile(graph: GraphAccumulator, location: SourceLocation): string {
  const id = fileId(location.file);
  addNode(graph, id, "file", location.file);
  return id;
}

function addPermission(
  graph: GraphAccumulator,
  permission: PermissionDescriptor,
): string {
  const id = permissionId(permission);
  const subjectId = resourceId(permission.subject);
  addNode(graph, id, "permission", permissionLabel(permission));
  addNode(graph, subjectId, "resource", permission.subject);
  addEdge(graph, "references", id, subjectId);
  return id;
}

function compareNodes(
  left: AuthorizationGraphNode,
  right: AuthorizationGraphNode,
): number {
  return left.id.localeCompare(right.id);
}

function compareEdges(
  left: AuthorizationGraphEdge,
  right: AuthorizationGraphEdge,
): number {
  return left.id.localeCompare(right.id);
}

export function buildAuthorizationGraph(
  input: BuildAuthorizationGraphInput,
): AuthorizationGraph {
  const graph: GraphAccumulator = {
    nodes: new Map(),
    edges: new Map(),
  };

  for (const role of input.roles) {
    addNode(graph, `role:${part(role.id)}`, "role", role.name);
    if (role.location) addFile(graph, role.location);
  }

  for (const permission of input.permissions) {
    const source = addFile(graph, permission.location);
    const target = addPermission(graph, permission);
    addEdge(
      graph,
      permission.inverted ? "references" : "grants",
      source,
      target,
    );
  }

  const checksById = new Map(
    input.authorizationChecks.map((check) => [check.id, check]),
  );

  for (const check of input.authorizationChecks) {
    const checkId = `authorization-check:${part(check.id)}`;
    const source = addFile(graph, check.location);
    const permission = addPermission(graph, check.permission);
    addNode(
      graph,
      checkId,
      "authorization-check",
      `${check.kind}: ${permissionLabel(check.permission)}`,
    );
    addEdge(graph, "references", source, checkId);
    addEdge(graph, "requires", checkId, permission);
  }

  for (const route of input.routes) {
    const routeId = `route:${part(route.id)}`;
    const methodId = `http-method:${part(route.method)}`;
    const source = addFile(graph, route.location);
    addNode(graph, routeId, "route", `${route.method} ${route.path}`);
    addNode(graph, methodId, "http-method", route.method);
    addEdge(graph, "references", source, routeId);
    addEdge(graph, "references", routeId, methodId);

    for (const checkId of route.authorizationCheckIds) {
      if (!checksById.has(checkId)) continue;
      addEdge(
        graph,
        "enforces",
        routeId,
        `authorization-check:${part(checkId)}`,
      );
    }
  }

  for (const action of input.serverActions) {
    const actionId = `server-action:${part(action.id)}`;
    const source = addFile(graph, action.location);
    addNode(graph, actionId, "server-action", action.name);
    addEdge(graph, "references", source, actionId);

    for (const checkId of action.authorizationCheckIds) {
      if (!checksById.has(checkId)) continue;
      addEdge(
        graph,
        "enforces",
        actionId,
        `authorization-check:${part(checkId)}`,
      );
    }
  }

  for (const usage of input.usages) {
    if (usage.kind !== "ui") continue;
    const componentId = `component:${part(usage.location.file)}`;
    const source = addFile(graph, usage.location);
    const permission = addPermission(graph, usage.permission);
    addNode(graph, componentId, "component", usage.location.file);
    addEdge(graph, "references", source, componentId);
    addEdge(graph, "requires", componentId, permission);
  }

  const routeIds = new Set(input.routes.map((route) => route.id));
  for (const request of input.httpClientRequests) {
    const source = addFile(graph, request.location);
    for (const match of request.routeMatches) {
      if (!routeIds.has(match.routeId)) continue;
      addEdge(graph, "invokes", source, `route:${part(match.routeId)}`);
    }
  }

  return {
    nodes: [...graph.nodes.values()].sort(compareNodes),
    edges: [...graph.edges.values()].sort(compareEdges),
  };
}
