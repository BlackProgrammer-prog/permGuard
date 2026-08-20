import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  AnalyzerConfigError,
  createAnalyzerProject,
  getSourceLocation,
} from "./index.js";

const fixturesDir = fileURLToPath(
  new URL("../../../fixtures/analyzer/", import.meta.url),
);

function fixturePath(name: string): string {
  return path.join(fixturesDir, name);
}

describe("createAnalyzerProject", () => {
  it("parses configured TS and TSX root files once in stable order", () => {
    const project = createAnalyzerProject({
      rootDir: fixturePath("foundation-basic"),
    });

    expect(project.sourceFiles.map((file) => file.path)).toEqual([
      "src/permissions.ts",
      "src/product-card.tsx",
    ]);
    expect(project.sourceFiles.map((file) => file.language)).toEqual([
      "typescript",
      "tsx",
    ]);
    expect(project.diagnostics).toEqual([]);
    expect(
      project.sourceFiles.every(
        (file) =>
          project.program.getSourceFile(file.absolutePath) === file.sourceFile,
      ),
    ).toBe(true);
  });

  it("provides a TypeChecker that resolves imported aliases", () => {
    const project = createAnalyzerProject({
      rootDir: fixturePath("foundation-basic"),
    });
    const productCard = project.sourceFiles.find(
      (file) => file.path === "src/product-card.tsx",
    );

    if (!productCard) {
      throw new Error("Expected product-card.tsx");
    }

    const importDeclaration = productCard.sourceFile.statements.find(
      ts.isImportDeclaration,
    );
    const namedBindings = importDeclaration?.importClause?.namedBindings;

    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      throw new Error("Expected a named import");
    }

    const importName = namedBindings.elements[0]?.name;
    const alias = importName
      ? project.checker.getSymbolAtLocation(importName)
      : undefined;

    if (!alias) {
      throw new Error("Expected an import alias symbol");
    }

    expect(project.checker.getAliasedSymbol(alias).getName()).toBe(
      "permission",
    );
  });

  it("converts AST positions to one-based project locations", () => {
    const project = createAnalyzerProject({
      rootDir: fixturePath("foundation-basic"),
    });
    const productCard = project.sourceFiles.find(
      (file) => file.path === "src/product-card.tsx",
    );

    if (!productCard) {
      throw new Error("Expected product-card.tsx");
    }

    const position = productCard.sourceFile.text.indexOf("permission.action");
    const location = getSourceLocation(productCard, position);

    expect(location).toMatchObject({
      file: "src/product-card.tsx",
      line: 4,
    });
    expect(location.column).toBeGreaterThan(1);
  });

  it("reports syntax diagnostics without discarding the AST", () => {
    const project = createAnalyzerProject({
      rootDir: fixturePath("foundation-invalid"),
    });

    expect(project.sourceFiles).toHaveLength(1);
    expect(project.diagnostics.length).toBeGreaterThan(0);
    expect(project.diagnostics[0]).toMatchObject({
      category: "error",
      location: {
        file: "src/broken.ts",
      },
    });
  });

  it("fails early with a dedicated error for missing config", () => {
    expect(() =>
      createAnalyzerProject({
        rootDir: fixturePath("missing-project"),
      }),
    ).toThrow(AnalyzerConfigError);
  });
});
