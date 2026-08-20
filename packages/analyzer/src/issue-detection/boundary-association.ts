import type {
  AuthorizationCheck,
  RouteRecord,
  ServerActionRecord,
  SourceLocation,
} from "@permguard/core";
import ts from "typescript";
import type { AnalyzerProject, AnalyzerSourceFile } from "../types.js";

interface FunctionBoundary {
  readonly file: AnalyzerSourceFile;
  readonly body: ts.ConciseBody;
}

interface AssociatedBoundary<T> {
  readonly record: T;
  readonly resolved: boolean;
}

export interface BoundaryAssociations {
  readonly routes: readonly AssociatedBoundary<RouteRecord>[];
  readonly serverActions: readonly AssociatedBoundary<ServerActionRecord>[];
}

function getPosition(
  file: AnalyzerSourceFile,
  location: SourceLocation,
): number | undefined {
  const line = location.line - 1;
  const column = location.column - 1;

  if (line < 0 || column < 0) return undefined;

  try {
    return file.sourceFile.getPositionOfLineAndCharacter(line, column);
  } catch {
    return undefined;
  }
}

function findNodeAtPosition(
  sourceFile: ts.SourceFile,
  position: number,
): ts.Node | undefined {
  let match: ts.Node | undefined;

  function visit(node: ts.Node): void {
    if (position < node.getFullStart() || position >= node.getEnd()) return;

    if (node.getStart(sourceFile) === position) {
      match = node;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return match;
}

function getFunctionBodyFromDeclaration(
  declaration: ts.Node,
): ts.ConciseBody | undefined {
  if (
    (ts.isFunctionDeclaration(declaration) ||
      ts.isFunctionExpression(declaration) ||
      ts.isMethodDeclaration(declaration)) &&
    declaration.body
  ) {
    return declaration.body;
  }

  if (
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer &&
    (ts.isArrowFunction(declaration.initializer) ||
      ts.isFunctionExpression(declaration.initializer))
  ) {
    return declaration.initializer.body;
  }

  return undefined;
}

function getEnclosingFunctionBody(node: ts.Node): ts.ConciseBody | undefined {
  let current: ts.Node | undefined = node;

  while (current) {
    const body = getFunctionBodyFromDeclaration(current);
    if (body) return body;
    current = current.parent;
  }

  return undefined;
}

function resolveAliasedSymbol(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function resolveFunctionBoundary(
  project: AnalyzerProject,
  files: ReadonlyMap<string, AnalyzerSourceFile>,
  location: SourceLocation,
): FunctionBoundary | undefined {
  const sourceFile = files.get(location.file);
  if (!sourceFile) return undefined;

  const position = getPosition(sourceFile, location);
  if (position === undefined) return undefined;

  const node = findNodeAtPosition(sourceFile.sourceFile, position);
  if (!node) return undefined;

  const directBody = getEnclosingFunctionBody(node);

  if (directBody) {
    return { file: sourceFile, body: directBody };
  }

  const symbol = project.checker.getSymbolAtLocation(node);
  if (!symbol) return undefined;

  const resolved = resolveAliasedSymbol(symbol, project.checker);

  for (const declaration of resolved.declarations ?? []) {
    const body = getFunctionBodyFromDeclaration(declaration);
    if (!body) continue;

    const targetFile = [...files.values()].find(
      (file) => file.sourceFile === declaration.getSourceFile(),
    );
    if (targetFile) return { file: targetFile, body };
  }

  return undefined;
}

function getContainedCheckIds(
  boundary: FunctionBoundary,
  checksByFile: ReadonlyMap<string, readonly AuthorizationCheck[]>,
): readonly string[] {
  const checks = checksByFile.get(boundary.file.path) ?? [];
  const start = boundary.body.getStart(boundary.file.sourceFile);
  const end = boundary.body.getEnd();

  return checks
    .filter((check) => {
      const position = getPosition(boundary.file, check.location);
      return position !== undefined && position >= start && position < end;
    })
    .map((check) => check.id)
    .sort();
}

function groupChecksByFile(
  checks: readonly AuthorizationCheck[],
): ReadonlyMap<string, readonly AuthorizationCheck[]> {
  const grouped = new Map<string, AuthorizationCheck[]>();

  for (const check of checks) {
    const existing = grouped.get(check.location.file) ?? [];
    existing.push(check);
    grouped.set(check.location.file, existing);
  }

  return grouped;
}

export function associateBoundaryChecks(
  project: AnalyzerProject,
  routes: readonly RouteRecord[],
  serverActions: readonly ServerActionRecord[],
  checks: readonly AuthorizationCheck[],
): BoundaryAssociations {
  const files = new Map(project.sourceFiles.map((file) => [file.path, file]));
  const checksByFile = groupChecksByFile(checks);

  function associate<T extends RouteRecord | ServerActionRecord>(
    record: T,
  ): AssociatedBoundary<T> {
    const boundary = resolveFunctionBoundary(project, files, record.location);

    return {
      record: {
        ...record,
        authorizationCheckIds: boundary
          ? getContainedCheckIds(boundary, checksByFile)
          : [],
      },
      resolved: boundary !== undefined,
    };
  }

  return {
    routes: routes.map(associate),
    serverActions: serverActions.map(associate),
  };
}
