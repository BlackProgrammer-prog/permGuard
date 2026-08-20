import type { SourceLocation } from "@permguard/core";
import type { AnalyzerSourceFile } from "./types.js";

export function getSourceLocation(
  file: AnalyzerSourceFile,
  position: number,
): SourceLocation {
  const location = file.sourceFile.getLineAndCharacterOfPosition(position);

  return {
    file: file.path,
    line: location.line + 1,
    column: location.character + 1,
  };
}
