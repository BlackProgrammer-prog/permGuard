import type { SourceLocation } from "@ironpermjs/core";
import ts from "typescript";
import { comparePaths, toProjectPath } from "./paths.js";
import type { AnalyzerDiagnostic, DiagnosticCategory } from "./types.js";

const diagnosticHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
};

function mapDiagnosticCategory(
  category: ts.DiagnosticCategory,
): DiagnosticCategory {
  switch (category) {
    case ts.DiagnosticCategory.Warning:
      return "warning";
    case ts.DiagnosticCategory.Error:
      return "error";
    case ts.DiagnosticCategory.Suggestion:
      return "suggestion";
    case ts.DiagnosticCategory.Message:
      return "message";
  }
}

function getDiagnosticLocation(
  diagnostic: ts.Diagnostic,
  rootDir: string,
): SourceLocation | undefined {
  if (!diagnostic.file || diagnostic.start === undefined) {
    return undefined;
  }

  const position = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start,
  );

  return {
    file: toProjectPath(rootDir, diagnostic.file.fileName),
    line: position.line + 1,
    column: position.character + 1,
  };
}

export function convertDiagnostic(
  diagnostic: ts.Diagnostic,
  rootDir: string,
): AnalyzerDiagnostic {
  const location = getDiagnosticLocation(diagnostic, rootDir);
  const base = {
    category: mapDiagnosticCategory(diagnostic.category),
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      ts.sys.newLine,
    ),
  };

  return location ? { ...base, location } : base;
}

export function compareDiagnostics(
  left: AnalyzerDiagnostic,
  right: AnalyzerDiagnostic,
): number {
  const pathComparison = comparePaths(
    left.location?.file ?? "",
    right.location?.file ?? "",
  );

  if (pathComparison !== 0) {
    return pathComparison;
  }

  const lineComparison =
    (left.location?.line ?? 0) - (right.location?.line ?? 0);

  if (lineComparison !== 0) {
    return lineComparison;
  }

  const columnComparison =
    (left.location?.column ?? 0) - (right.location?.column ?? 0);

  return columnComparison !== 0 ? columnComparison : left.code - right.code;
}

export function formatConfigDiagnostics(
  diagnostics: readonly ts.Diagnostic[],
): string {
  return ts.formatDiagnostics([...diagnostics], diagnosticHost);
}
