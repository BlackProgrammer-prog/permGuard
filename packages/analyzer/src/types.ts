import type { SourceLocation } from "@ironpermjs/core";
import type ts from "typescript";

export type SourceLanguage =
  "typescript" | "tsx" | "javascript" | "jsx" | "unknown";

export type DiagnosticCategory = "warning" | "error" | "suggestion" | "message";

export interface AnalyzerDiagnostic {
  readonly category: DiagnosticCategory;
  readonly code: number;
  readonly message: string;
  readonly location?: SourceLocation;
}

export interface AnalyzerSourceFile {
  readonly path: string;
  readonly absolutePath: string;
  readonly language: SourceLanguage;
  readonly isDeclarationFile: boolean;
  readonly sourceFile: ts.SourceFile;
}

export interface AnalyzerProject {
  readonly rootDir: string;
  readonly tsconfigPath: string;
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly sourceFiles: readonly AnalyzerSourceFile[];
  readonly diagnostics: readonly AnalyzerDiagnostic[];
}

export interface CreateAnalyzerProjectOptions {
  readonly rootDir: string;
  readonly tsconfigPath?: string;
}
