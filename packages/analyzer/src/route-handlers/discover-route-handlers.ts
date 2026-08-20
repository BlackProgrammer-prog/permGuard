import type { RouteRecord } from "@permguard/core";
import ts from "typescript";
import { getSourceLocation } from "../location.js";
import { comparePaths } from "../paths.js";
import type { AnalyzerProject, AnalyzerSourceFile } from "../types.js";
import { getRoutePath } from "./route-path.js";

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

interface ExportedMethod {
  readonly method: HttpMethod;
  readonly node: ts.Node;
}

const httpMethods = new Set<string>(HTTP_METHODS);
const methodOrder = new Map<string, number>(
  HTTP_METHODS.map((method, index) => [method, index]),
);

function isHttpMethod(value: string): value is HttpMethod {
  return httpMethods.has(value);
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
      false)
  );
}

function addMethod(
  methods: Map<HttpMethod, ts.Node>,
  name: string,
  node: ts.Node,
): void {
  if (isHttpMethod(name) && !methods.has(name)) {
    methods.set(name, node);
  }
}

function collectDirectFunctionExport(
  statement: ts.Statement,
  methods: Map<HttpMethod, ts.Node>,
): void {
  if (
    ts.isFunctionDeclaration(statement) &&
    statement.name &&
    hasExportModifier(statement)
  ) {
    addMethod(methods, statement.name.text, statement.name);
  }
}

function collectDirectVariableExports(
  statement: ts.Statement,
  methods: Map<HttpMethod, ts.Node>,
): void {
  if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) {
    return;
  }

  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name)) {
      addMethod(methods, declaration.name.text, declaration.name);
    }
  }
}

function collectNamedExports(
  statement: ts.Statement,
  methods: Map<HttpMethod, ts.Node>,
): void {
  if (
    !ts.isExportDeclaration(statement) ||
    statement.isTypeOnly ||
    !statement.exportClause ||
    !ts.isNamedExports(statement.exportClause)
  ) {
    return;
  }

  for (const element of statement.exportClause.elements) {
    if (!element.isTypeOnly) {
      addMethod(methods, element.name.text, element.name);
    }
  }
}

function collectExportedMethods(
  file: AnalyzerSourceFile,
): readonly ExportedMethod[] {
  const methods = new Map<HttpMethod, ts.Node>();

  for (const statement of file.sourceFile.statements) {
    collectDirectFunctionExport(statement, methods);
    collectDirectVariableExports(statement, methods);
    collectNamedExports(statement, methods);
  }

  return [...methods]
    .map(([method, node]) => ({ method, node }))
    .sort(
      (left, right) =>
        (methodOrder.get(left.method) ?? 0) -
        (methodOrder.get(right.method) ?? 0),
    );
}

function createRouteId(
  file: AnalyzerSourceFile,
  routePath: string,
  method: HttpMethod,
): string {
  return `next-route:${method}:${routePath}:${file.path}`;
}

function compareRoutes(left: RouteRecord, right: RouteRecord): number {
  const pathComparison = comparePaths(left.path, right.path);

  if (pathComparison !== 0) {
    return pathComparison;
  }

  const methodComparison =
    (methodOrder.get(left.method) ?? 0) - (methodOrder.get(right.method) ?? 0);

  return methodComparison !== 0
    ? methodComparison
    : comparePaths(left.location.file, right.location.file);
}

export function discoverRouteHandlers(
  project: AnalyzerProject,
): readonly RouteRecord[] {
  const routes: RouteRecord[] = [];

  for (const file of project.sourceFiles) {
    const routePath = getRoutePath(file.path);

    if (routePath === undefined) {
      continue;
    }

    for (const exportedMethod of collectExportedMethods(file)) {
      routes.push({
        id: createRouteId(file, routePath, exportedMethod.method),
        path: routePath,
        method: exportedMethod.method,
        location: getSourceLocation(
          file,
          exportedMethod.node.getStart(file.sourceFile),
        ),
        authorizationCheckIds: [],
      });
    }
  }

  return routes.sort(compareRoutes);
}
