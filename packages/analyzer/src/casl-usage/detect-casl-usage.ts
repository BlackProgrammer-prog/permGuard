import type {
  AuthorizationCheck,
  AuthorizationCheckKind,
  PermissionDescriptor,
  PermissionRecord,
  PermissionUsage,
  SourceLocation,
} from "@permguard/core";
import ts from "typescript";
import { getSourceLocation } from "../location.js";
import { comparePaths } from "../paths.js";
import type { AnalyzerProject, AnalyzerSourceFile } from "../types.js";
import { collectBuiltAbilityBindings } from "./ability-bindings.js";
import {
  collectImportBindings,
  isCaslAbilityMethod,
  isImportedIdentifier,
  type ImportBindings,
} from "./imports.js";
import {
  getJsxStaticString,
  getStaticPermissions,
  type StaticPermission,
} from "./permission-arguments.js";
import type { CaslUsageResult } from "./types.js";

const CASL_MODULE = "@casl/ability";
const PERMGUARD_SERVER_MODULE = "@permguard/server";
const PERMGUARD_REACT_MODULE = "@permguard/react";

type DefinitionBindings = ReadonlyMap<ts.Symbol, boolean>;

interface MutableResult {
  readonly permissions: Map<string, PermissionRecord>;
  readonly authorizationChecks: Map<string, AuthorizationCheck>;
  readonly usages: Map<string, PermissionUsage>;
}

function getSymbol(
  node: ts.Node,
  checker: ts.TypeChecker,
): ts.Symbol | undefined {
  return checker.getSymbolAtLocation(node);
}

function collectDefinitionBindings(
  file: AnalyzerSourceFile,
  checker: ts.TypeChecker,
  imports: ImportBindings,
): DefinitionBindings {
  const bindings = new Map<ts.Symbol, boolean>();

  function addBinding(node: ts.BindingName, inverted: boolean): void {
    if (!ts.isIdentifier(node)) return;
    const symbol = getSymbol(node, checker);
    if (symbol) bindings.set(symbol, inverted);
  }

  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      ts.isNewExpression(node.initializer) &&
      isImportedIdentifier(
        node.initializer.expression,
        checker,
        imports,
        CASL_MODULE,
        "AbilityBuilder",
      )
    ) {
      for (const element of node.name.elements) {
        const propertyName = element.propertyName ?? element.name;
        if (!ts.isIdentifier(propertyName)) continue;
        if (propertyName.text === "can") addBinding(element.name, false);
        if (propertyName.text === "cannot") addBinding(element.name, true);
      }
    }

    if (
      ts.isCallExpression(node) &&
      isImportedIdentifier(
        node.expression,
        checker,
        imports,
        CASL_MODULE,
        "defineAbility",
      )
    ) {
      const callback = node.arguments[0];
      if (
        callback &&
        (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
      ) {
        const canParameter = callback.parameters[0];
        const cannotParameter = callback.parameters[1];
        if (canParameter) addBinding(canParameter.name, false);
        if (cannotParameter) addBinding(cannotParameter.name, true);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(file.sourceFile);
  return bindings;
}

function permissionKey(permission: PermissionDescriptor): string {
  return [permission.action, permission.subject, permission.field ?? ""].join(
    ":",
  );
}

function locationKey(location: SourceLocation): string {
  return `${location.file}:${location.line}:${location.column}`;
}

function addDefinition(
  result: MutableResult,
  file: AnalyzerSourceFile,
  item: StaticPermission,
  inverted: boolean,
): void {
  const location = getSourceLocation(
    file,
    item.locationNode.getStart(file.sourceFile),
  );
  const suffix = `${permissionKey(item.permission)}:${locationKey(location)}`;
  const permissionId = `casl-rule:${inverted ? "cannot" : "can"}:${suffix}`;
  const usageId = `permission-usage:definition:${suffix}`;

  result.permissions.set(permissionId, {
    id: permissionId,
    ...item.permission,
    inverted,
    location,
    confidence: "certain",
  });
  result.usages.set(usageId, {
    id: usageId,
    kind: "definition",
    permission: item.permission,
    location,
    confidence: "certain",
  });
}

function addCheck(
  result: MutableResult,
  file: AnalyzerSourceFile,
  item: StaticPermission,
  kind: AuthorizationCheckKind,
): void {
  const location = getSourceLocation(
    file,
    item.locationNode.getStart(file.sourceFile),
  );
  const suffix = `${kind}:${permissionKey(item.permission)}:${locationKey(location)}`;
  const checkId = `authorization-check:${suffix}`;
  const usageId = `permission-usage:check:${suffix}`;

  result.authorizationChecks.set(checkId, {
    id: checkId,
    kind,
    permission: item.permission,
    location,
    confidence: "certain",
  });
  result.usages.set(usageId, {
    id: usageId,
    kind: "check",
    permission: item.permission,
    location,
    confidence: "certain",
  });
}

function addUiUsage(
  result: MutableResult,
  file: AnalyzerSourceFile,
  permission: PermissionDescriptor,
  node: ts.Node,
): void {
  const location = getSourceLocation(file, node.getStart(file.sourceFile));
  const suffix = `${permissionKey(permission)}:${locationKey(location)}`;
  const id = `permission-usage:ui:${suffix}`;

  result.usages.set(id, {
    id,
    kind: "ui",
    permission,
    location,
    confidence: "certain",
  });
}

function getForbiddenThrowArguments(
  call: ts.CallExpression,
  checker: ts.TypeChecker,
  imports: ImportBindings,
): readonly ts.Expression[] | undefined {
  if (
    !ts.isPropertyAccessExpression(call.expression) ||
    call.expression.name.text !== "throwUnlessCan"
  ) {
    return undefined;
  }

  const fromCall = call.expression.expression;
  if (
    !ts.isCallExpression(fromCall) ||
    !ts.isPropertyAccessExpression(fromCall.expression) ||
    fromCall.expression.name.text !== "from" ||
    !isImportedIdentifier(
      fromCall.expression.expression,
      checker,
      imports,
      CASL_MODULE,
      "ForbiddenError",
    )
  ) {
    return undefined;
  }

  return call.arguments;
}

function getJsxAttribute(
  attributes: ts.JsxAttributes,
  name: string,
): ts.JsxAttribute | undefined {
  return attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function isBuiltAbilityReceiver(
  node: ts.Expression,
  checker: ts.TypeChecker,
  builtAbilities: ReadonlySet<ts.Symbol>,
): boolean {
  if (!ts.isIdentifier(node)) {
    return false;
  }

  const symbol = getSymbol(node, checker);
  return symbol !== undefined && builtAbilities.has(symbol);
}

function detectInFile(
  file: AnalyzerSourceFile,
  checker: ts.TypeChecker,
  result: MutableResult,
): void {
  const imports = collectImportBindings(file.sourceFile, checker);
  const definitionBindings = collectDefinitionBindings(file, checker, imports);
  const builtAbilities = collectBuiltAbilityBindings(
    file.sourceFile,
    checker,
    imports,
  );

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        const symbol = getSymbol(node.expression, checker);
        const inverted = symbol ? definitionBindings.get(symbol) : undefined;

        if (inverted !== undefined) {
          for (const item of getStaticPermissions(node.arguments)) {
            addDefinition(result, file, item, inverted);
          }
        } else if (
          isImportedIdentifier(
            node.expression,
            checker,
            imports,
            PERMGUARD_SERVER_MODULE,
            "requireCan",
          )
        ) {
          for (const item of getStaticPermissions(node.arguments, 1)) {
            addCheck(result, file, item, "permguard-require-can");
          }
        } else if (
          isImportedIdentifier(
            node.expression,
            checker,
            imports,
            PERMGUARD_REACT_MODULE,
            "useCan",
          )
        ) {
          for (const item of getStaticPermissions(node.arguments)) {
            addUiUsage(result, file, item.permission, item.locationNode);
          }
        }
      }

      if (
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "can" &&
        (isCaslAbilityMethod(node.expression, checker) ||
          isBuiltAbilityReceiver(
            node.expression.expression,
            checker,
            builtAbilities,
          ))
      ) {
        for (const item of getStaticPermissions(node.arguments)) {
          addCheck(result, file, item, "casl-can");
        }
      }

      const forbiddenArguments = getForbiddenThrowArguments(
        node,
        checker,
        imports,
      );
      if (forbiddenArguments) {
        for (const item of getStaticPermissions(forbiddenArguments)) {
          addCheck(result, file, item, "casl-throw-unless-can");
        }
      }
    }

    if (ts.isJsxOpeningLikeElement(node) && ts.isIdentifier(node.tagName)) {
      if (
        isImportedIdentifier(
          node.tagName,
          checker,
          imports,
          PERMGUARD_REACT_MODULE,
          "Can",
        )
      ) {
        const actionAttribute = getJsxAttribute(node.attributes, "action");
        const subjectAttribute = getJsxAttribute(node.attributes, "subject");
        const action = getJsxStaticString(actionAttribute);
        const subject = getJsxStaticString(subjectAttribute);
        const field = getJsxStaticString(
          getJsxAttribute(node.attributes, "field"),
        );

        if (action && subject) {
          addUiUsage(
            result,
            file,
            field ? { action, subject, field } : { action, subject },
            actionAttribute ?? node,
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(file.sourceFile);
}

function compareByLocation<
  T extends { readonly id: string; readonly location: SourceLocation },
>(left: T, right: T): number {
  const fileComparison = comparePaths(left.location.file, right.location.file);
  if (fileComparison !== 0) return fileComparison;
  if (left.location.line !== right.location.line)
    return left.location.line - right.location.line;
  if (left.location.column !== right.location.column)
    return left.location.column - right.location.column;
  return left.id.localeCompare(right.id);
}

export function detectCaslUsage(project: AnalyzerProject): CaslUsageResult {
  const result: MutableResult = {
    permissions: new Map(),
    authorizationChecks: new Map(),
    usages: new Map(),
  };

  for (const file of project.sourceFiles) {
    detectInFile(file, project.checker, result);
  }

  return {
    permissions: [...result.permissions.values()].sort(compareByLocation),
    authorizationChecks: [...result.authorizationChecks.values()].sort(
      compareByLocation,
    ),
    usages: [...result.usages.values()].sort(compareByLocation),
  };
}
