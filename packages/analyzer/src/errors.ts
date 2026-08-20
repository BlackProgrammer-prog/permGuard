import type ts from "typescript";
import { formatConfigDiagnostics } from "./diagnostics.js";

export class AnalyzerConfigError extends Error {
  override readonly name = "AnalyzerConfigError";

  constructor(readonly diagnostics: readonly ts.Diagnostic[]) {
    super(formatConfigDiagnostics(diagnostics));
  }
}
