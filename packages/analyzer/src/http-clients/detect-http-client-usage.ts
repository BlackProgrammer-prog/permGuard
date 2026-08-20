import type {
  FindingConfidence,
  HttpClientRequestRecord,
  RouteRecord,
} from "@permguard/core";
import ts from "typescript";
import { getSourceLocation } from "../location.js";
import { comparePaths } from "../paths.js";
import type { AnalyzerProject, AnalyzerSourceFile } from "../types.js";
import { matchClientRequestToRoutes } from "./route-matching.js";
import type { DetectHttpClientUsageOptions } from "./types.js";
import {
  extractUrlPattern,
  joinUrlPaths,
  type UrlPattern,
} from "./url-pattern.js";

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
const BUILT_IN_CLIENT_MODULES = new Set(["axios", "ky"]);

interface ClientBinding {
  readonly moduleName: string;
  readonly basePath?: string;
  readonly directMethod?: string;
  readonly configured: boolean;
}

interface RequestCandidate {
  readonly client: string;
  readonly method: string;
  readonly url: ts.Expression;
  readonly basePath: string | undefined;
  readonly configured: boolean;
}

function getSymbol(
  node: ts.Node,
  checker: ts.TypeChecker,
): ts.Symbol | undefined {
  return checker.getSymbolAtLocation(node);
}

function getStaticString(
  expression: ts.Expression | undefined,
  checker: ts.TypeChecker,
): string | undefined {
  if (!expression) return undefined;
  if (ts.isStringLiteralLike(expression)) return expression.text;

  if (ts.isIdentifier(expression)) {
    const declaration =
      checker.getSymbolAtLocation(expression)?.valueDeclaration;
    if (
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      ts.isStringLiteralLike(declaration.initializer)
    ) {
      return declaration.initializer.text;
    }
  }

  return undefined;
}

function getObjectProperty(
  expression: ts.Expression | undefined,
  propertyName: string,
): ts.Expression | undefined {
  if (!expression || !ts.isObjectLiteralExpression(expression))
    return undefined;

  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = property.name;
    const text =
      ts.isIdentifier(name) || ts.isStringLiteralLike(name)
        ? name.text
        : undefined;
    if (text === propertyName) return property.initializer;
  }

  return undefined;
}

function collectImportedClients(
  file: AnalyzerSourceFile,
  checker: ts.TypeChecker,
  modules: ReadonlySet<string>,
): Map<ts.Symbol, ClientBinding> {
  const bindings = new Map<ts.Symbol, ClientBinding>();

  for (const statement of file.sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !modules.has(statement.moduleSpecifier.text) ||
      (!statement.importClause?.namedBindings && !statement.importClause?.name)
    ) {
      continue;
    }

    const moduleName = statement.moduleSpecifier.text;
    const configured = !BUILT_IN_CLIENT_MODULES.has(moduleName);
    const defaultName = statement.importClause.name;

    if (defaultName) {
      const symbol = getSymbol(defaultName, checker);
      if (symbol) bindings.set(symbol, { moduleName, configured });
    }

    const namedBindings = statement.importClause.namedBindings;
    if (namedBindings && ts.isNamespaceImport(namedBindings)) {
      const symbol = getSymbol(namedBindings.name, checker);
      if (symbol) bindings.set(symbol, { moduleName, configured });
    } else if (namedBindings && ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        if (element.isTypeOnly) continue;
        const symbol = getSymbol(element.name, checker);
        const importedName = (element.propertyName ?? element.name).text;
        if (!symbol) continue;

        bindings.set(symbol, {
          moduleName,
          configured,
          ...(HTTP_METHODS.has(importedName.toUpperCase())
            ? { directMethod: importedName.toUpperCase() }
            : {}),
        });
      }
    }
  }

  return bindings;
}

function collectClientInstances(
  file: AnalyzerSourceFile,
  checker: ts.TypeChecker,
  bindings: Map<ts.Symbol, ClientBinding>,
): void {
  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.name.text === "create" &&
      ts.isIdentifier(node.initializer.expression.expression)
    ) {
      const sourceSymbol = getSymbol(
        node.initializer.expression.expression,
        checker,
      );
      const sourceBinding = sourceSymbol
        ? bindings.get(sourceSymbol)
        : undefined;
      const targetSymbol = getSymbol(node.name, checker);

      if (sourceBinding && targetSymbol) {
        const baseUrlExpression = getObjectProperty(
          node.initializer.arguments[0],
          "baseURL",
        );
        const basePattern = baseUrlExpression
          ? extractUrlPattern(baseUrlExpression, checker)
          : undefined;

        bindings.set(targetSymbol, {
          ...sourceBinding,
          ...(basePattern && !basePattern.dynamic
            ? { basePath: basePattern.path }
            : {}),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(file.sourceFile);
}

function isNativeFetch(
  expression: ts.Expression,
  checker: ts.TypeChecker,
): boolean {
  if (!ts.isIdentifier(expression) || expression.text !== "fetch") return false;

  const symbol = getSymbol(expression, checker);
  const hasLocalDeclaration =
    symbol?.declarations?.some(
      (declaration) =>
        declaration.getSourceFile() === expression.getSourceFile(),
    ) ?? false;

  return !hasLocalDeclaration;
}

function getConfigRequest(
  binding: ClientBinding,
  config: ts.Expression | undefined,
  checker: ts.TypeChecker,
): RequestCandidate | undefined {
  const url = getObjectProperty(config, "url");
  if (!url) return undefined;

  const method =
    getStaticString(
      getObjectProperty(config, "method"),
      checker,
    )?.toUpperCase() ?? "UNKNOWN";

  return {
    client: binding.moduleName,
    method,
    url,
    basePath: binding.basePath,
    configured: binding.configured,
  };
}

function getRequestCandidate(
  call: ts.CallExpression,
  checker: ts.TypeChecker,
  bindings: ReadonlyMap<ts.Symbol, ClientBinding>,
): RequestCandidate | undefined {
  if (isNativeFetch(call.expression, checker)) {
    const url = call.arguments[0];
    if (!url) return undefined;

    return {
      client: "fetch",
      method:
        getStaticString(
          getObjectProperty(call.arguments[1], "method"),
          checker,
        )?.toUpperCase() ?? "GET",
      url,
      basePath: undefined,
      configured: false,
    };
  }

  if (ts.isIdentifier(call.expression)) {
    const symbol = getSymbol(call.expression, checker);
    const binding = symbol ? bindings.get(symbol) : undefined;
    if (!binding) return undefined;

    if (binding.directMethod) {
      const url = call.arguments[0];
      return url
        ? {
            client: binding.moduleName,
            method: binding.directMethod,
            url,
            basePath: binding.basePath,
            configured: binding.configured,
          }
        : undefined;
    }

    const configRequest = getConfigRequest(binding, call.arguments[0], checker);
    if (configRequest) return configRequest;

    const url = call.arguments[0];
    if (!url) return undefined;
    return {
      client: binding.moduleName,
      method:
        getStaticString(
          getObjectProperty(call.arguments[1], "method"),
          checker,
        )?.toUpperCase() ?? "GET",
      url,
      basePath: binding.basePath,
      configured: binding.configured,
    };
  }

  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression)
  ) {
    const symbol = getSymbol(call.expression.expression, checker);
    const binding = symbol ? bindings.get(symbol) : undefined;
    if (!binding) return undefined;

    const methodName = call.expression.name.text.toUpperCase();
    if (methodName === "REQUEST") {
      return getConfigRequest(binding, call.arguments[0], checker);
    }
    if (!HTTP_METHODS.has(methodName)) return undefined;

    const url = call.arguments[0];
    return url
      ? {
          client: binding.moduleName,
          method: methodName,
          url,
          basePath: binding.basePath,
          configured: binding.configured,
        }
      : undefined;
  }

  return undefined;
}

function requestConfidence(
  pattern: UrlPattern,
  method: string,
  configured: boolean,
): FindingConfidence {
  if (method === "UNKNOWN") return "low";
  if (configured) return "medium";
  return pattern.dynamic ? "high" : "certain";
}

function compareRequests(
  left: HttpClientRequestRecord,
  right: HttpClientRequestRecord,
): number {
  const fileComparison = comparePaths(left.location.file, right.location.file);
  if (fileComparison !== 0) return fileComparison;
  if (left.location.line !== right.location.line)
    return left.location.line - right.location.line;
  if (left.location.column !== right.location.column) {
    return left.location.column - right.location.column;
  }
  return left.id.localeCompare(right.id);
}

export function detectHttpClientUsage(
  project: AnalyzerProject,
  routes: readonly RouteRecord[],
  options: DetectHttpClientUsageOptions = {},
): readonly HttpClientRequestRecord[] {
  const modules = new Set([
    ...BUILT_IN_CLIENT_MODULES,
    ...(options.additionalClientModules ?? []),
  ]);
  const requests: HttpClientRequestRecord[] = [];

  for (const file of project.sourceFiles) {
    const bindings = collectImportedClients(file, project.checker, modules);
    collectClientInstances(file, project.checker, bindings);

    function visit(node: ts.Node): void {
      if (ts.isCallExpression(node)) {
        const candidate = getRequestCandidate(node, project.checker, bindings);

        if (candidate) {
          const extracted = extractUrlPattern(candidate.url, project.checker);
          if (extracted) {
            const pattern = joinUrlPaths(candidate.basePath, extracted);
            const location = getSourceLocation(
              file,
              candidate.url.getStart(file.sourceFile),
            );
            const id = `http-client-request:${candidate.client}:${candidate.method}:${pattern.path}:${file.path}:${location.line}:${location.column}`;

            requests.push({
              id,
              client: candidate.client,
              method: candidate.method,
              path: pattern.path,
              dynamic: pattern.dynamic,
              location,
              confidence: requestConfidence(
                pattern,
                candidate.method,
                candidate.configured,
              ),
              routeMatches:
                candidate.method === "UNKNOWN"
                  ? []
                  : matchClientRequestToRoutes(
                      candidate.method,
                      pattern.path,
                      pattern.dynamic,
                      routes,
                    ),
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(file.sourceFile);
  }

  return requests.sort(compareRequests);
}
