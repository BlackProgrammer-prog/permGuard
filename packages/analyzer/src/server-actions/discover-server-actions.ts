import type { ServerActionRecord } from "@ironpermjs/core";
import ts from "typescript";
import { getSourceLocation } from "../location.js";
import { comparePaths } from "../paths.js";
import type { AnalyzerProject, AnalyzerSourceFile } from "../types.js";

interface ActionCandidate {
  readonly name: string;
  readonly node: ts.Node;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false)
  );
}

function hasExportModifier(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function isAsyncFunction(
  node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction,
): boolean {
  return hasModifier(node, ts.SyntaxKind.AsyncKeyword);
}

function hasUseServerDirective(
  statements: ts.NodeArray<ts.Statement>,
): boolean {
  for (const statement of statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      return false;
    }

    if (statement.expression.text === "use server") {
      return true;
    }
  }

  return false;
}

function getAsyncVariableFunction(
  declaration: ts.VariableDeclaration,
): ts.ArrowFunction | ts.FunctionExpression | undefined {
  const initializer = declaration.initializer;

  if (
    initializer &&
    (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) &&
    isAsyncFunction(initializer)
  ) {
    return initializer;
  }

  return undefined;
}

function collectTopLevelAsyncFunctions(
  file: AnalyzerSourceFile,
): ReadonlyMap<string, ts.Node> {
  const functions = new Map<string, ts.Node>();

  for (const statement of file.sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      isAsyncFunction(statement)
    ) {
      functions.set(statement.name.text, statement.name);
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        getAsyncVariableFunction(declaration)
      ) {
        functions.set(declaration.name.text, declaration.name);
      }
    }
  }

  return functions;
}

function collectFileLevelActions(file: AnalyzerSourceFile): ActionCandidate[] {
  if (!hasUseServerDirective(file.sourceFile.statements)) {
    return [];
  }

  const localFunctions = collectTopLevelAsyncFunctions(file);
  const actions: ActionCandidate[] = [];

  for (const statement of file.sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      hasExportModifier(statement) &&
      isAsyncFunction(statement)
    ) {
      actions.push({ name: statement.name.text, node: statement.name });
      continue;
    }

    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          getAsyncVariableFunction(declaration)
        ) {
          actions.push({ name: declaration.name.text, node: declaration.name });
        }
      }
      continue;
    }

    if (
      !ts.isExportDeclaration(statement) ||
      statement.moduleSpecifier ||
      statement.isTypeOnly ||
      !statement.exportClause ||
      !ts.isNamedExports(statement.exportClause)
    ) {
      continue;
    }

    for (const element of statement.exportClause.elements) {
      const localName = (element.propertyName ?? element.name).text;

      if (!element.isTypeOnly && localFunctions.has(localName)) {
        actions.push({ name: element.name.text, node: element.name });
      }
    }
  }

  return actions;
}

function getInlineAction(node: ts.Node): ActionCandidate | undefined {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name &&
    node.body &&
    isAsyncFunction(node) &&
    hasUseServerDirective(node.body.statements)
  ) {
    return { name: node.name.text, node: node.name };
  }

  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer)) &&
    isAsyncFunction(node.initializer) &&
    ts.isBlock(node.initializer.body) &&
    hasUseServerDirective(node.initializer.body.statements)
  ) {
    return { name: node.name.text, node: node.name };
  }

  return undefined;
}

function collectInlineActions(file: AnalyzerSourceFile): ActionCandidate[] {
  const actions: ActionCandidate[] = [];

  function visit(node: ts.Node): void {
    const action = getInlineAction(node);

    if (action) {
      actions.push(action);
    }

    ts.forEachChild(node, visit);
  }

  visit(file.sourceFile);
  return actions;
}

function compareActions(
  left: ServerActionRecord,
  right: ServerActionRecord,
): number {
  const fileComparison = comparePaths(left.location.file, right.location.file);

  if (fileComparison !== 0) return fileComparison;
  if (left.location.line !== right.location.line) {
    return left.location.line - right.location.line;
  }
  if (left.location.column !== right.location.column) {
    return left.location.column - right.location.column;
  }
  return left.name.localeCompare(right.name);
}

export function discoverServerActions(
  project: AnalyzerProject,
): readonly ServerActionRecord[] {
  const actions = new Map<string, ServerActionRecord>();

  for (const file of project.sourceFiles) {
    const candidates = [
      ...collectFileLevelActions(file),
      ...collectInlineActions(file),
    ];

    for (const candidate of candidates) {
      const location = getSourceLocation(
        file,
        candidate.node.getStart(file.sourceFile),
      );
      const id = `next-server-action:${candidate.name}:${file.path}:${location.line}:${location.column}`;

      actions.set(id, {
        id,
        name: candidate.name,
        location,
        authorizationCheckIds: [],
      });
    }
  }

  return [...actions.values()].sort(compareActions);
}
