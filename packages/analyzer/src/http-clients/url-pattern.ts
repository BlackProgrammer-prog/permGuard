import ts from "typescript";

export interface UrlPattern {
  readonly path: string;
  readonly dynamic: boolean;
}

function stripQueryAndHash(value: string): string {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const end = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .reduce((smallest, index) => Math.min(smallest, index), value.length);

  return value.slice(0, end);
}

function normalizePath(value: string): string | undefined {
  const stripped = stripQueryAndHash(value.trim());

  if (
    stripped.startsWith("http://") ||
    stripped.startsWith("https://") ||
    stripped.startsWith("//")
  ) {
    return undefined;
  }

  const withLeadingSlash = stripped.startsWith("/") ? stripped : `/${stripped}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed || "/";
}

function extractRawPattern(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  visited: Set<ts.Symbol>,
): { readonly value: string; readonly dynamic: boolean } | undefined {
  if (ts.isStringLiteralLike(expression)) {
    return { value: expression.text, dynamic: false };
  }

  if (ts.isTemplateExpression(expression)) {
    let value = expression.head.text;
    let dynamic = false;

    for (const span of expression.templateSpans) {
      const part = extractRawPattern(span.expression, checker, visited);
      if (part) {
        value += part.value;
        dynamic ||= part.dynamic;
      } else {
        value += ":dynamic";
        dynamic = true;
      }
      value += span.literal.text;
    }

    return { value, dynamic };
  }

  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = extractRawPattern(expression.left, checker, visited);
    const right = extractRawPattern(expression.right, checker, visited);

    return {
      value: `${left?.value ?? ":dynamic"}${right?.value ?? ":dynamic"}`,
      dynamic: left?.dynamic !== false || right?.dynamic !== false,
    };
  }

  if (ts.isIdentifier(expression)) {
    const symbol = checker.getSymbolAtLocation(expression);
    if (!symbol || visited.has(symbol)) return undefined;

    visited.add(symbol);
    const declaration = symbol.valueDeclaration;

    if (
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer
    ) {
      return extractRawPattern(declaration.initializer, checker, visited);
    }
  }

  return undefined;
}

export function extractUrlPattern(
  expression: ts.Expression,
  checker: ts.TypeChecker,
): UrlPattern | undefined {
  const raw = extractRawPattern(expression, checker, new Set());
  if (!raw) return undefined;

  const path = normalizePath(raw.value);
  return path ? { path, dynamic: raw.dynamic } : undefined;
}

export function joinUrlPaths(
  basePath: string | undefined,
  requestPath: UrlPattern,
): UrlPattern {
  if (!basePath || requestPath.path === "/") {
    return basePath && requestPath.path === "/"
      ? { path: basePath, dynamic: requestPath.dynamic }
      : requestPath;
  }

  const path = `${basePath.replace(/\/$/, "")}/${requestPath.path.replace(/^\//, "")}`;
  return { path, dynamic: requestPath.dynamic };
}
