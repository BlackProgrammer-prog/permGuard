import type { PermissionDescriptor } from "@ironpermjs/core";
import ts from "typescript";

function getStaticStrings(expression: ts.Expression): readonly string[] {
  if (ts.isStringLiteralLike(expression)) {
    return [expression.text];
  }

  if (!ts.isArrayLiteralExpression(expression)) {
    return [];
  }

  const values: string[] = [];

  for (const element of expression.elements) {
    if (!ts.isStringLiteralLike(element)) {
      return [];
    }

    values.push(element.text);
  }

  return values;
}

export interface StaticPermission {
  readonly permission: PermissionDescriptor;
  readonly locationNode: ts.Expression;
}

export function getStaticPermissions(
  args: readonly ts.Expression[],
  offset = 0,
): readonly StaticPermission[] {
  const actionNode = args[offset];
  const subjectNode = args[offset + 1];

  if (!actionNode || !subjectNode) {
    return [];
  }

  const actions = getStaticStrings(actionNode);
  const subjects = getStaticStrings(subjectNode);

  if (actions.length === 0 || subjects.length === 0) {
    return [];
  }

  const fieldNode = args[offset + 2];
  const fields = fieldNode ? getStaticStrings(fieldNode) : [];
  const normalizedFields: readonly (string | undefined)[] =
    fields.length > 0 ? fields : [undefined];

  return actions.flatMap((action) =>
    subjects.flatMap((subject) =>
      normalizedFields.map((field) => ({
        permission: field ? { action, subject, field } : { action, subject },
        locationNode: actionNode,
      })),
    ),
  );
}

export function getJsxStaticString(
  attribute: ts.JsxAttribute | undefined,
): string | undefined {
  const initializer = attribute?.initializer;

  if (initializer && ts.isStringLiteral(initializer)) {
    return initializer.text;
  }

  if (
    initializer &&
    ts.isJsxExpression(initializer) &&
    initializer.expression &&
    ts.isStringLiteralLike(initializer.expression)
  ) {
    return initializer.expression.text;
  }

  return undefined;
}
