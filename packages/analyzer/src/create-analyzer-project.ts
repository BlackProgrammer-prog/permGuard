import path from "node:path";
import ts from "typescript";
import { compareDiagnostics, convertDiagnostic } from "./diagnostics.js";
import { AnalyzerConfigError } from "./errors.js";
import { comparePaths, normalizeAbsolutePath, toProjectPath } from "./paths.js";
import type {
  AnalyzerProject,
  AnalyzerSourceFile,
  CreateAnalyzerProjectOptions,
  SourceLanguage,
} from "./types.js";

function getSourceLanguage(fileName: string): SourceLanguage {
  switch (path.extname(fileName).toLowerCase()) {
    case ".ts":
    case ".mts":
    case ".cts":
      return "typescript";
    case ".tsx":
      return "tsx";
    case ".js":
    case ".mjs":
    case ".cjs":
      return "javascript";
    case ".jsx":
      return "jsx";
    default:
      return "unknown";
  }
}

function parseTsConfig(tsconfigPath: string): ts.ParsedCommandLine {
  const configFile = ts.readConfigFile(tsconfigPath, (fileName) =>
    ts.sys.readFile(fileName),
  );

  if (configFile.error) {
    throw new AnalyzerConfigError([configFile.error]);
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config as object,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath,
  );

  if (parsed.errors.length > 0) {
    throw new AnalyzerConfigError(parsed.errors);
  }

  return parsed;
}

function collectRootSourceFiles(
  program: ts.Program,
  rootNames: readonly string[],
  rootDir: string,
): readonly AnalyzerSourceFile[] {
  const roots = new Set(rootNames.map(normalizeAbsolutePath));

  return program
    .getSourceFiles()
    .filter((sourceFile) =>
      roots.has(normalizeAbsolutePath(sourceFile.fileName)),
    )
    .map((sourceFile) => {
      const absolutePath = normalizeAbsolutePath(sourceFile.fileName);

      return {
        path: toProjectPath(rootDir, absolutePath),
        absolutePath,
        language: getSourceLanguage(sourceFile.fileName),
        isDeclarationFile: sourceFile.isDeclarationFile,
        sourceFile,
      };
    })
    .sort((left, right) => comparePaths(left.path, right.path));
}

export function createAnalyzerProject(
  options: CreateAnalyzerProjectOptions,
): AnalyzerProject {
  const rootDir = normalizeAbsolutePath(options.rootDir);
  const tsconfigPath = normalizeAbsolutePath(
    options.tsconfigPath ?? path.join(rootDir, "tsconfig.json"),
  );
  const config = parseTsConfig(tsconfigPath);
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: {
      ...config.options,
      noEmit: true,
    },
  });
  const sourceFiles = collectRootSourceFiles(
    program,
    config.fileNames,
    rootDir,
  );
  const diagnostics = program
    .getSyntacticDiagnostics()
    .map((diagnostic) => convertDiagnostic(diagnostic, rootDir))
    .sort(compareDiagnostics);

  return {
    rootDir,
    tsconfigPath,
    program,
    checker: program.getTypeChecker(),
    sourceFiles,
    diagnostics,
  };
}
